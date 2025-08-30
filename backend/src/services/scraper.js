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

