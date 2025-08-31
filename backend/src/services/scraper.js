import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const REGION_TO_HOST = {
  "amazon.in": "https://www.amazon.in",
};

export async function fetchAmazonPayBalance({ region, email, password, interactive, storageState }) {
  const baseUrl = REGION_TO_HOST[region];
  if (!baseUrl) throw new Error("Unsupported region");

  const isProd = process.env.NODE_ENV === "production";
  // Try to resolve a Chromium executable installed under node_modules cache
  const resolvedExec = resolveChromiumHeadlessPath();

  const browser = await chromium.launch({
    headless: isProd ? true : false,
    channel: undefined,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || resolvedExec || undefined,
    args: isProd ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: storageState || undefined,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    userAgent:
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  context.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);

  try {
    // If already signed in via storageState, try wallet directly first
    if (storageState) {
      try {
        await page.goto(`${baseUrl}/gp/sva/dashboard`, { waitUntil: "domcontentloaded" });
      } catch {}
    }

    // If not on wallet, navigate to sign-in and perform login
    const bodyText = (await page.textContent("body")) || "";
    if (!/Amazon\s*Pay|Wallet/i.test(bodyText)) {
      await page.goto(`${baseUrl}/ap/signin`, { waitUntil: "domcontentloaded" });
      // Cookie consent (best-effort) with safe selectors
      let accepted = false;
      try { await page.click('#sp-cc-accept', { timeout: 2000 }); accepted = true; } catch {}
      if (!accepted) { try { await page.getByRole('button', { name: /accept/i }).first().click({ timeout: 2000 }); accepted = true; } catch {} }
      if (!accepted) { try { await page.getByText(/Accept Cookies/i).first().click({ timeout: 2000 }); } catch {} }

      const emailLocator = page.locator('#ap_email, input[name="email"]');
      await emailLocator.waitFor({ timeout: 60000 });
      await emailLocator.fill(email);
      const contBtn = page.locator('#continue, input#continue, button[name="continue"]');
      if (await contBtn.count()) { await contBtn.first().click(); }
      const passLocator = page.locator('#ap_password, input[name="password"]');
      await passLocator.waitFor({ timeout: 60000 });
      await passLocator.fill(password);
      await page.click('#signInSubmit, input#signInSubmit');
      await page.waitForLoadState('domcontentloaded');
    }

    // If 2FA/Captcha present, let the user solve manually in visible browser.
    if (interactive && !isProd) {
      await page.waitForLoadState("networkidle");
      // Give time for user to pass challenges; we wait for the account menu presence
      await page.waitForTimeout(2000);
    }

    // Navigate to Amazon Pay balance page
    // Prefer direct dashboard where #APayBalance lives; otherwise hop via amazonpay home
    const navSteps = [];
    try {
      await page.goto(`${baseUrl}/gp/sva/dashboard`, { waitUntil: "domcontentloaded" });
      navSteps.push(`goto ${baseUrl}/gp/sva/dashboard`);
    } catch {}
    if (!(await page.locator('#APayBalance').first().count())) {
      // Try via amazonpay home and click the balance tile/link
      try {
        await page.goto(`${baseUrl}/amazonpay/home`, { waitUntil: "domcontentloaded" });
        navSteps.push(`goto ${baseUrl}/amazonpay/home`);
        const tileLink = page.locator('a[href*="/gp/sva/dashboard"], a[href*="/gp/wallet"], a:has-text("Amazon Pay Balance")').first();
        if (await tileLink.count()) {
          await tileLink.click({ timeout: 5000 });
          navSteps.push('clicked balance tile link');
          await page.waitForLoadState('domcontentloaded');
        }
      } catch {}
    }

    // Extract balance; selectors vary by region. Try several options, India-first
    const attemptedSelectors = [];
    let matchedSelector = null;
    const candidateSelectors = [
      // Direct container + amount on amazon.in
      '#APayBalance .onep-instrument-amount-desktop .currency-green',
      '#APayBalance .currency-green',
      // Text-based anchors
      'text=/Amazon\\s*Pay\\s*Balance/i',
      'text=/Available\\s*balance/i',
      'text=/Wallet\\s*Balance/i',
      '[data-testid="wallet-balance"]',
      '#apx-content .a-color-price',
      '.a-color-price',
    ];

    const candidateLocators = candidateSelectors.map(sel => ({ sel, loc: sel.startsWith('text=') ? page.locator(sel.replace('text=', '')) : page.locator(sel) }));

    let raw = null;
    for (const { sel, loc } of candidateLocators) {
      try {
        attemptedSelectors.push(sel);
        if (await loc.count()) {
          // Read around the locator as well to catch nearby amount
          const handle = await loc.elementHandle();
          if (handle) {
            const text = (await handle.evaluate((el) => el.closest('section,div,span')?.innerText || el.innerText || '')) || '';
            const cleaned = text.replace(/\u00a0/g, ' ').trim();
            const m = cleaned.match(/(₹|INR|\$|£|€)\s*([\d.,]+)/i) || cleaned.match(/([\d.,]+)\s*(INR)/i);
            if (m) { raw = `${m[1] || 'INR'} ${m[2]}`; break; }
            matchedSelector = sel;
          }
        }
      } catch {}
    }

    if (!raw) {
      // Last resort: only look within the APayBalance container to avoid grabbing banner prices
      try {
        const container = await page.locator('#APayBalance').first().elementHandle();
        if (container) {
          const localText = (await container.evaluate(el => el.innerText || ''))?.replace(/\u00a0/g, ' ') || '';
          let match = localText.match(/(₹)\s*([\d.,]+)/);
          if (!match) match = localText.match(/(INR)\s*([\d.,]+)/i);
          if (!match) match = localText.match(/([\d.,]+)\s*(INR)/i);
          if (match) raw = `${match[1]} ${match[2]}`;
        }
      } catch {}
    }

    if (!raw) throw new Error("Unable to locate wallet balance on page");

    const parsed = parseCurrencyAmount(raw, region);
    if (!parsed) throw new Error("Failed to parse balance");

    let newStorageState = null;
    try {
      newStorageState = await context.storageState();
    } catch {}

    const debug = {
      url: page.url(),
      matchedSelector,
      attemptedSelectors,
      extractedText: raw,
      navSteps,
    };

    return { ...parsed, storageState: newStorageState, debug };
  } finally {
    // Do not close immediately to allow manual step if interactive; short delay
    await new Promise((r) => setTimeout(r, 500));
    await context.close();
    await browser.close();
  }
}

export async function fetchAmazonRewards({ region, email, password, interactive, storageState }) {
  const baseUrl = REGION_TO_HOST[region];
  if (!baseUrl) throw new Error("Unsupported region");

  const isProd = process.env.NODE_ENV === "production";
  const resolvedExec = resolveChromiumHeadlessPath();
  const browser = await chromium.launch({
    headless: isProd ? true : false,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || resolvedExec || undefined,
    args: isProd ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: storageState || undefined,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
  });
  const page = await context.newPage();
  context.setDefaultNavigationTimeout(90000);
  page.setDefaultTimeout(90000);

  const navSteps = [];
  const diagnostics = { pagesTried: [], scanned: 0, kept: 0, samples: [] };
  try {
    // Ensure logged in similarly to balance flow
    if (storageState) {
      try { await page.goto(`${baseUrl}/gp/sva/dashboard`, { waitUntil: 'domcontentloaded' }); navSteps.push('goto wallet (state)'); } catch {}
    }
    let body = (await page.textContent('body')) || '';
    if (!/Account|Amazon\s*Pay|Hello,|Sign Out/i.test(body)) {
      await page.goto(`${baseUrl}/ap/signin`, { waitUntil: 'domcontentloaded' });
      const emailInput = page.locator('#ap_email, input[name="email"]'); await emailInput.waitFor({ timeout: 60000 }); await emailInput.fill(email);
      const contBtn = page.locator('#continue, input#continue, button[name="continue"]').first(); if (await contBtn.count()) await contBtn.click();
      const pass = page.locator('#ap_password, input[name="password"]'); await pass.waitFor({ timeout: 60000 }); await pass.fill(password);
      await page.click('#signInSubmit, input#signInSubmit');
      await page.waitForLoadState('domcontentloaded');
    }

    if (interactive && !isProd) { await page.waitForLoadState('networkidle'); await page.waitForTimeout(500); }

    const candidatePages = [
      `${baseUrl}/h/rewards`,
      `${baseUrl}/amazonpay/rewards`,
      `${baseUrl}/gp/coupons`,
      `${baseUrl}/amazonpay/home`,
    ];

    const rewards = [];
    for (const url of candidatePages) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        diagnostics.pagesTried.push(url);
      } catch { continue; }
      // Prefer structured coupon containers if present
      const couponCards = await page.locator('.coupon-container, .coupon-content').all();
      if (couponCards.length > 0) {
        for (const card of couponCards) {
          try {
            const title = (await (await card.$('.coupon-description-main'))?.innerText() || '').replace(/\s+/g,' ').trim();
            const sub = (await (await card.$('.coupon-description-sub'))?.innerText() || '').replace(/\s+/g,' ').trim();
            const expiryText = (await (await card.$('.coupon-date'))?.innerText() || '').replace(/\s+/g,' ').trim();
            const labelText = (await (await card.$('.image_wrapper_label'))?.innerText() || '').replace(/\s+/g,' ').trim();
            const detailHref = await (await card.$('a.reward-ad-detail-link'))?.getAttribute('href');
            const buyHref = await (await card.$('.coupon-cta-issued a.a-button-text, .cta-wrapper a.a-button-text'))?.getAttribute('href');
            const redirectionUrl = await (await card.$('[redirection-url]'))?.getAttribute('redirection-url');
            const href = [detailHref, buyHref, redirectionUrl].filter(Boolean).map(h=> h.startsWith('/')? `${baseUrl}${h}` : h)[0] || null;

            const textBlob = `${title} ${sub} ${labelText} ${expiryText}`.trim();
            if (!textBlob) continue;
            diagnostics.scanned++;

            // Parse fields from structured pieces
            const { minAmount, minCurrency } = deriveMinAmount(`${sub} ${title}`);
            const cashback = deriveCashback(`${title} ${sub}`);
            const expiry = expiryText ? deriveExpiry(`Valid till ${expiryText}`) : { date: null, text: expiryText || null };
            const paymentMethod = labelText || derivePaymentMethod(textBlob);
            const onWhat = deriveOnWhat(textBlob) || deriveOnWhat(href||'');
            const category = deriveCategory(`${textBlob} ${href||''}`);

            const rewardObj = {
              title: title || 'Offer',
              description: sub || '',
              href,
              sourceUrl: url,
              category,
              paymentMethod,
              onWhat,
              minAmount: minAmount ?? null,
              minCurrency: minCurrency || (region === 'amazon.in' ? 'INR' : null),
              cashbackText: cashback.text || null,
              cashbackAmount: cashback.amount ?? null,
              cashbackMaxAmount: cashback.maxAmount ?? null,
              cashbackPercent: cashback.percent ?? null,
              expiresAt: expiry.date ?? null,
              expiryText: expiry.text || expiryText || null,
            };
            rewards.push(rewardObj);
            diagnostics.kept++;
            if (diagnostics.samples.length < 20) diagnostics.samples.push({ snippet: textBlob.slice(0,240), ...rewardObj });
          } catch {}
        }
        // If we found structured coupons, move to next page candidate
        continue;
      }

      // Fallback: heuristic scan
      const cards = await page.locator('article, section, div.a-cardui, div, a').all();
      for (const card of cards) {
        try {
          const text = (await card.innerText()).replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();
          if (!text) continue;
          diagnostics.scanned++;
          if (/(shortcuts|keyboard shortcuts|skip to main|deliver to)/i.test(text)) continue;
          if (!/(reward|offer|cash\s*back|cashback|voucher|coupon|flat|upto|up to|%\s*cash|off\b)/i.test(text)) continue;

          // Extract key fields
          const { title, description } = deriveTitleAndDescription(text);
          const category = deriveCategory(text);
          const paymentMethod = derivePaymentMethod(text);
          const onWhat = deriveOnWhat(text);
          const { minAmount, minCurrency } = deriveMinAmount(text);
          const cashback = deriveCashback(text);
          const expiry = deriveExpiry(text);

          let href = null;
          try { const link = await card.$('a[href]'); if (link) { href = await link.getAttribute('href'); if (href && href.startsWith('/')) href = baseUrl + href; } } catch {}
          const rewardObj = {
            title,
            description,
            href,
            sourceUrl: url,
            category,
            paymentMethod,
            onWhat,
            minAmount: minAmount ?? null,
            minCurrency: minCurrency || (region === 'amazon.in' ? 'INR' : null),
            cashbackText: cashback.text || null,
            cashbackAmount: cashback.amount ?? null,
            cashbackMaxAmount: cashback.maxAmount ?? null,
            cashbackPercent: cashback.percent ?? null,
            expiresAt: expiry.date ?? null,
            expiryText: expiry.text || null,
          };
          rewards.push(rewardObj);
          diagnostics.kept++;
          if (diagnostics.samples.length < 20) {
            diagnostics.samples.push({ snippet: text.slice(0, 240), ...rewardObj });
          }
          if (rewards.length >= 50) break;
        } catch {}
      }
      if (rewards.length >= 1) {
        // We collected something meaningful from this page; continue to others to enrich
      }
      if (rewards.length >= 50) break;
    }

    let newStorageState = null; try { newStorageState = await context.storageState(); } catch {}
    // Deduplicate similar rewards by title+href combo
    const deduped = [];
    const seen = new Set();
    for (const r of rewards) {
      const key = `${(r.title||'').toLowerCase()}|${r.href||r.sourceUrl}`;
      if (seen.has(key)) continue;
      seen.add(key);
      deduped.push(r);
    }

    return { rewards: deduped, storageState: newStorageState, debug: { navSteps, ...diagnostics } };
  } finally {
    await new Promise(r=>setTimeout(r, 300));
    await context.close();
    await browser.close();
  }
}

// Helpers to parse structured fields from unstructured text
function deriveTitleAndDescription(text){
  const m = text.match(/^(.*?)\.?\s(.*)$/) || []
  const title = (m[1] && m[1].length <= 140 ? m[1] : (text.split(/\.|:/)[0]||text).slice(0,140)).trim()
  const description = (m[2] || text).slice(0, 500).trim()
  return { title, description }
}

function deriveCategory(text){
  if (/recharge|bill|electricity|dth|postpaid|prepaid|gas|lpg/i.test(text)) return 'Recharge & Bills'
  if (/gift\s*card|giftcard|gv\b/i.test(text)) return 'Gift Cards'
  if (/flight|bus|train|travel/i.test(text)) return 'Travel'
  if (/shopping|order|cart|buy|appliances|fashion|grocery/i.test(text)) return 'Shopping'
  return 'Other'
}

function derivePaymentMethod(text){
  const patterns = [
    /amazon pay upi/i,
    /amazon pay balance/i,
    /(icici|hdfc|sbi|axis|kotak|bob|yes|idfc).*?(credit|debit) card/i,
    /(visa|mastercard|rupay).*card/i,
    /(netbanking|wallet)/i,
  ]
  for (const p of patterns){ const m = text.match(p); if (m) return m[0].replace(/\s+/g,' ').trim() }
  return null
}

function deriveOnWhat(text){
  const m = text.match(/on\s+(mobile recharge|electricity bill|dth|recharge|bill payments?|gift cards?|shopping|orders?|flight|bus|train)/i)
  return m ? capitalize(m[1]) : null
}

function deriveMinAmount(text){
  // Examples: min order value ₹200, on ₹99+, min spend of ₹500, orders of ₹1,000 or more
  const m = text.match(/(?:min(?:imum)?\s*(?:order)?\s*(?:value|spend)?\s*(?:of)?\s*|on\s*|orders?\s*of\s*)(₹|rs\.?|inr)?\s*([\d,]+)\+?/i)
  if (!m) return { minAmount: null, minCurrency: null }
  const cur = (m[1]||'').toUpperCase().replace(/RS\.?/,'INR').replace('₹','INR') || null
  const amt = Number((m[2]||'').replace(/,/g,''))
  return { minAmount: Number.isFinite(amt)? amt : null, minCurrency: cur }
}

function deriveCashback(text){
  // Percent
  const p = text.match(/(\d{1,2})%\s*cashback/i)
  // Flat/up to amount
  const a = text.match(/\b(flat|upto|up to)\s*(₹|rs\.?|inr)?\s*([\d,]+)\s*(?:cash\s*back|cashback|off)?/i)
  const max = text.match(/max(?:imum)?\s*(?:up to)?\s*(₹|rs\.?|inr)?\s*([\d,]+)/i)
  const out = { text: null, amount: null, maxAmount: null, percent: null }
  if (p) out.percent = Number(p[1])
  if (a) out.amount = Number((a[3]||'').replace(/,/g,'')), out.text = a[0]
  if (max) out.maxAmount = Number((max[2]||'').replace(/,/g,''))
  if (!out.text && p) out.text = p[0]
  return out
}

function deriveExpiry(text){
  const m = text.match(/(valid\s*(?:till|until|up to)|ends\s*(?:on)?|expire[sd]?\s*(?:on)?|till)\s*([A-Za-z]{3,9}\s*\d{1,2},?\s*\d{2,4}|\d{1,2}\s*[A-Za-z]{3,9}\s*\d{2,4}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/i)
  if (!m) return { date: null, text: null }
  const raw = m[2]
  let date = null
  try { const d = Date.parse(raw); if (!Number.isNaN(d)) date = new Date(d) } catch {}
  return { date, text: m[0] }
}

function capitalize(s){ try{ return s.charAt(0).toUpperCase() + s.slice(1) }catch{ return s } }
function parseCurrencyAmount(text, region) {
  if (!text) return null;
  const mapSymbolToCode = {
    "$": "USD",
    "₹": "INR",
    "£": "GBP",
    "€": "EUR",
    "C$": "CAD",
    "A$": "AUD",
  };

  let currency = null;
  let amount = null;

  const trim = text.replace(/\s+/g, " ").trim();

  // 1) Format: USD 12.34
  let m = trim.match(/([A-Z]{3})\s+([\d,]+(?:\.\d{1,2})?)/);
  if (m) {
    currency = m[1];
    amount = parseFloat(m[2].replace(/,/g, ""));
  }

  // 2) Format: $12.34 or ₹ 1,234.00
  if (!amount) {
    m = trim.match(/(A\$|C\$|\$|₹|£|€)\s*([\d,]+(?:\.\d{1,2})?)/);
    if (m) {
      currency = mapSymbolToCode[m[1]] || null;
      amount = parseFloat(m[2].replace(/,/g, ""));
    }
  }

  // 3) Region-specific tweak for amazon.in where amounts may appear like "1,234.56"
  if (!amount && /amazon\.in$/.test(region || "")) {
    m = trim.match(/([\d,]+(?:\.\d{1,2})?)\s*(INR)/i);
    if (m) {
      currency = "INR";
      amount = parseFloat(m[1].replace(/,/g, ""));
    }
  }

  if (!currency || Number.isNaN(amount)) return null;
  return { currency, amount };
}

function resolveChromiumHeadlessPath() {
  try {
    const cacheBase = path.join(process.cwd(), "node_modules", ".cache", "ms-playwright");
    if (!fs.existsSync(cacheBase)) return undefined;
    const entries = fs.readdirSync(cacheBase).filter((d) => d.startsWith("chromium"));
    if (!entries.length) return undefined;
    // Prefer headless_shell installs if present
    const preferred = entries.sort().reverse().find((d) => d.startsWith("chromium_headless_shell-")) || entries.sort().reverse()[0];
    const candidateHeadless = path.join(cacheBase, preferred, "chrome-linux", "headless_shell");
    if (fs.existsSync(candidateHeadless)) return candidateHeadless;
    const candidateChrome = path.join(cacheBase, preferred, "chrome-linux", "chrome");
    if (fs.existsSync(candidateChrome)) return candidateChrome;
    return undefined;
  } catch {
    return undefined;
  }
}

