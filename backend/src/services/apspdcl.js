import { chromium } from 'playwright'
import { resolveChromiumHeadlessPath } from './scraper.js'

export async function fetchApspdclBill({ serviceNumber, interactive, storageState }){
  const isProd = process.env.NODE_ENV === 'production'
  const resolvedExec = resolveChromiumHeadlessPath()
  const browser = await chromium.launch({
    headless: isProd ? true : false,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || resolvedExec || undefined,
    args: isProd ? ['--no-sandbox','--disable-setuid-sandbox'] : [],
  })
  const context = await browser.newContext({ viewport:{ width:1280, height:900 } })
  const page = await context.newPage()
  context.setDefaultNavigationTimeout(90000)
  page.setDefaultTimeout(90000)
  const debug = { steps: [], snippet: null }
  try{
    // Direct API (bill history) first: faster and avoids CAPTCHA
    try{
      const curl = `curl -s -X POST 'https://apspdcl.in/ConsumerDashboard/public/publicbillhistory' -H 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8' --data 'uscno=${serviceNumber}'`
      try{ console.log(`[APSPDCL] ${curl}`) }catch{}
      const resp = await fetch('https://apspdcl.in/ConsumerDashboard/public/publicbillhistory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
        body: `uscno=${encodeURIComponent(String(serviceNumber))}`,
      })
      if (resp.ok){
        const json = await resp.json()
        try{ console.log(`[APSPDCL] response: ${JSON.stringify(json)}`) }catch{}
        if (Array.isArray(json?.data) && json.data.length){
          // Map and pick latest by closingDate
          const parseD = (s)=>{
            if (!s) return null;
            const parts = String(s).trim().split(/[-/]/);
            if (parts.length===3){
              const [dd, mon, yy] = parts;
              const months = { JAN:0,FEB:1,MAR:2,APR:3,MAY:4,JUN:5,JUL:6,AUG:7,SEP:8,OCT:9,NOV:10,DEC:11 };
              const m = months[(mon||'').toUpperCase()] ?? null;
              const year = yy.length===2 ? 2000 + Number(yy) : Number(yy);
              const day = Number(dd);
              if (m!=null && !Number.isNaN(year) && !Number.isNaN(day)) return new Date(Date.UTC(year, m, day));
            }
            const p = Date.parse(String(s).replace(/-/g,' '));
            return Number.isNaN(p)? null : new Date(p)
          }
          const norm = json.data.map(row=> ({
            closingDate: parseD(row.closingDate),
            dueDate: parseD(row.duedate),
            billedUnits: Number(row.billedUnits||0),
            billAmount: Number(String(row.billAmount||'0').replace(/,/g,'')),
          })).filter(r=> r.closingDate)
          norm.sort((a,b)=> (b.closingDate||0) - (a.closingDate||0))
          const latest = norm[0]
          // Exclude entries that belong to the current calendar month (UTC)
          const now = new Date()
          const nowY = now.getUTCFullYear(), nowM = now.getUTCMonth()
          const filtered = norm.filter(x => !(x.closingDate && x.closingDate.getUTCFullYear()===nowY && x.closingDate.getUTCMonth()===nowM))
          const lastThree = filtered.slice(0,3).map(x=> ({ closingDate: x.closingDate, billAmount: x.billAmount }))
          const hasCurrentMonth = norm.some(x=> x.closingDate && x.closingDate.getUTCFullYear()===nowY && x.closingDate.getUTCMonth()===nowM)
          const amount = latest?.billAmount || 0
          const status = hasCurrentMonth ? (amount>0 ? 'DUE' : 'NO_DUES') : 'NO_DUES'
          return {
            serviceNumber,
            customerName: null, // not available from this endpoint
            billDate: latest?.closingDate || null,
            dueDate: latest?.dueDate || null,
            amountDue: amount,
            billedUnits: latest?.billedUnits || 0,
            lastThreeAmounts: lastThree,
            status,
            payUrl: 'https://payments.billdesk.com/MercOnline/SPDCLController',
            debug: { steps: ['api:publicbillhistory'], curl, monthsAll: norm.map(x=> x.closingDate && `${x.closingDate.getUTCFullYear()}-${x.closingDate.getUTCMonth()+1}`), nowMonth:`${nowY}-${nowM+1}`, filteredMonths: filtered.map(x=> `${x.closingDate.getUTCFullYear()}-${x.closingDate.getUTCMonth()+1}`), snippet: JSON.stringify(norm.slice(0,3)), raw: json }
          }
        }
      }
    }catch{}

    await page.goto('https://payments.billdesk.com/MercOnline/SPDCLController', { waitUntil:'domcontentloaded' })
    debug.steps.push('open entry')
    // Try common field names; APSPDCL page may load an iframe or form
    const input = page.locator('input[name*="service" i], input[placeholder*="Service" i], input[type="text"]').first()
    await input.fill(String(serviceNumber))
    debug.steps.push('filled service number')
    // Click submit: look for buttons with pay/search/submit
    const submit = page.locator('button:has-text("Submit"), button:has-text("Search"), input[type="submit"]').first()
    if (await submit.count()) { await submit.click(); debug.steps.push('clicked submit') }
    await page.waitForLoadState('domcontentloaded')

    // Heuristic parse: look for bill details table or labels
    const bodyText = (await page.textContent('body'))?.replace(/\u00a0/g,' ').trim() || ''
    debug.snippet = bodyText.slice(0, 2000)
    if (/captcha/i.test(bodyText)) { debug.steps.push('captcha required') }
    // Extract fields
    // Prefer DOM extraction from table rows if present
    let amount = null, dueDate=null, billDate=null, customerName=null
    try{
      const rows = await page.$$('table.tb_detail tr')
      for (const r of rows){
        const label = (await (await r.$('td:nth-child(1)'))?.innerText()||'').trim()
        const value = (await (await r.$('td:nth-child(2), td.rtd'))?.innerText()||'').trim()
        if (/Customer\s*Name/i.test(label)) customerName = value
        if (/Bill\s*Date/i.test(label)) billDate = parseMaybeDate(value)
        if (/Due\s*Date/i.test(label)) dueDate = parseMaybeDate(value)
        if (/(Arrear|Current\s*Demand|Amount\s*Due|Bill\s*Amount|Total)/i.test(label)){
          const n = Number((value||'').replace(/[,₹INR\s]/gi,''))
          if (!Number.isNaN(n)) amount = (amount||0) + n
        }
      }
    }catch{}
    // Fallback to regex if table not found
    if (amount==null){
      const amountMatch = bodyText.match(/(Arrear\s*Amount|Current\s*Demand|Amount\s*Due|Bill\s*Amount|Total)\s*[:\-]?\s*(₹|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i)
      if (amountMatch) amount = Number((amountMatch[3]||'').replace(/,/g,''))
    }
    if (dueDate==null){
      const dueDateMatch = bodyText.match(/Due\s*Date\s*[:\-]?\s*([A-Za-z]{3,9}\s*\d{1,2},?\s*\d{2,4}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i)
      if (dueDateMatch) dueDate = parseMaybeDate(dueDateMatch[1])
    }
    if (billDate==null){
      const billDateMatch = bodyText.match(/Bill\s*Date\s*[:\-]?\s*([A-Za-z]{3,9}\s*\d{1,2},?\s*\d{2,4}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i)
      if (billDateMatch) billDate = parseMaybeDate(billDateMatch[1])
    }
    if (!customerName){
      const nameMatch = bodyText.match(/Customer\s*Name\s*[:\-]?\s*([A-Za-z][A-Za-z\s.]+)/i)
      if (nameMatch) customerName = (nameMatch[1]||'').trim()
    }
    const noDues = /no\s*dues|you\s*don'?t\s*have\s*any\s*dues/i.test(bodyText)

    const status = noDues ? 'NO_DUES' : ((amount||0)>0 ? 'DUE' : 'UNKNOWN')

    // Payment URL known pattern: use query or consistent base if available
    const payUrl = 'https://payments.billdesk.com/MercOnline/SPDCLController' // Landing; often session-bound deep links

    return { serviceNumber, customerName, billDate, dueDate, amountDue: amount||0, status, payUrl, debug }
  } finally {
    await context.close(); await browser.close()
  }
}

function parseMaybeDate(s){
  if(!s) return null
  const t = Date.parse(s)
  return Number.isNaN(t) ? null : new Date(t)
}

