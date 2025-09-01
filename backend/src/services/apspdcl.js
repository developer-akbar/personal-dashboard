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

