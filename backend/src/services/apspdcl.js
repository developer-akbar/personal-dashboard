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
    // Enhanced API approach: Call both bill history and payment history APIs
    try{
      console.log(`[APSPDCL] Fetching bill data for service: ${serviceNumber}`)
      
      // Call both APIs in parallel
      const [billHistoryResp, paymentHistoryResp] = await Promise.allSettled([
        fetch('https://apspdcl.in/ConsumerDashboard/public/publicbillhistory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `uscno=${encodeURIComponent(String(serviceNumber))}`,
        }),
        fetch('https://apspdcl.in/ConsumerDashboard/public/publicpaymenthistory', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
          body: `uscno=${encodeURIComponent(String(serviceNumber))}`,
        })
      ])

      console.log(`[APSPDCL] Bill history API status: ${billHistoryResp.status}`)
      console.log(`[APSPDCL] Payment history API status: ${paymentHistoryResp.status}`)

      let billData = null
      let paymentData = null

      // Process bill history response
      if (billHistoryResp.status === 'fulfilled' && billHistoryResp.value.ok) {
        const billJson = await billHistoryResp.value.json()
        console.log(`[APSPDCL] Bill history response: ${JSON.stringify(billJson)}`)
        billData = billJson
      }

      // Process payment history response
      if (paymentHistoryResp.status === 'fulfilled' && paymentHistoryResp.value.ok) {
        const paymentJson = await paymentHistoryResp.value.json()
        console.log(`[APSPDCL] Payment history response: ${JSON.stringify(paymentJson)}`)
        paymentData = paymentJson
      }

      if (billData && Array.isArray(billData?.data) && billData.data.length) {
        // Parse bill history data
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

        const norm = billData.data.map(row=> ({
          closingDate: parseD(row.closingDate),
          dueDate: parseD(row.duedate),
          billedUnits: Number(row.billedUnits||0),
          billAmount: Number(String(row.billAmount||'0').replace(/,/g,'')),
        })).filter(r=> r.closingDate)

        norm.sort((a,b)=> (b.closingDate||0) - (a.closingDate||0))
        const latest = norm[0]

        // Process payment history to determine payment status
        let paymentStatus = { isPaid: false, paidDate: null, receiptNumber: null }
        if (paymentData && Array.isArray(paymentData?.data) && paymentData.data.length) {
          const parsePaymentDate = (s) => {
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
            return null
          }

          // Check if current month bill is paid
          const now = new Date()
          const currentYear = now.getUTCFullYear()
          const currentMonth = now.getUTCMonth()

          const currentMonthPayment = paymentData.data.find(payment => {
            const paymentDate = parsePaymentDate(payment.prdate)
            if (!paymentDate) return false
            return paymentDate.getUTCFullYear() === currentYear && 
                   paymentDate.getUTCMonth() === currentMonth
          })

          if (currentMonthPayment) {
            paymentStatus = {
              isPaid: true,
              paidDate: parsePaymentDate(currentMonthPayment.prdate),
              receiptNumber: currentMonthPayment.prno,
              paidAmount: Number(String(currentMonthPayment.billamt||'0').replace(/,/g,''))
            }
            console.log(`[APSPDCL] Current month payment found: ${JSON.stringify(paymentStatus)}`)
          }
        }

        // Exclude entries that belong to the current calendar month (UTC)
        const now = new Date()
        const nowY = now.getUTCFullYear(), nowM = now.getUTCMonth()
        const filtered = norm.filter(x => !(x.closingDate && x.closingDate.getUTCFullYear()===nowY && x.closingDate.getUTCMonth()===nowM))
        const lastThree = filtered.slice(0,3).map(x=> ({ closingDate: x.closingDate, billAmount: x.billAmount }))
        const hasCurrentMonth = norm.some(x=> x.closingDate && x.closingDate.getUTCFullYear()===nowY && x.closingDate.getUTCMonth()===nowM)
        
        // Determine status based on payment information
        let amount = latest?.billAmount || 0
        let status = 'NO_DUES'
        
        if (hasCurrentMonth) {
          if (paymentStatus.isPaid) {
            status = 'PAID'
            amount = 0 // No dues if paid
          } else {
            status = 'DUE'
          }
        }

        console.log(`[APSPDCL] Final status: ${status}, Amount: ${amount}, Payment: ${paymentStatus.isPaid}`)

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
          // Enhanced payment information
          isPaid: paymentStatus.isPaid,
          paidDate: paymentStatus.paidDate,
          receiptNumber: paymentStatus.receiptNumber,
          paidAmount: paymentStatus.paidAmount,
          debug: { 
            steps: ['api:publicbillhistory', 'api:publicpaymenthistory'], 
            billHistoryData: billData,
            paymentHistoryData: paymentData,
            paymentStatus,
            monthsAll: norm.map(x=> x.closingDate && `${x.closingDate.getUTCFullYear()}-${x.closingDate.getUTCMonth()+1}`), 
            nowMonth:`${nowY}-${nowM+1}`, 
            filteredMonths: filtered.map(x=> `${x.closingDate.getUTCFullYear()}-${x.closingDate.getUTCMonth()+1}`), 
            snippet: JSON.stringify(norm.slice(0,3))
          }
        }
      }
    }catch(error){
      console.error(`[APSPDCL] API error: ${error.message}`)
    }

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

