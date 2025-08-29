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
    // Region specific Amazon Pay URL may vary; we attempt a generic path and fallback
    const candidates = [
      `${baseUrl}/gp/sva/dashboard`,
      `${baseUrl}/gp/wallet`,
    ];

    let found = false;
    for (const url of candidates) {
      await page.goto(url, { waitUntil: "domcontentloaded" });
      const text = await page.textContent("body");
      if (text && /Amazon\s*Pay|Wallet|Balance/i.test(text)) {
        found = true;
        break;
      }
    }

    if (!found) {
      // Try opening account menu to reach wallet link
      await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    }

    // Extract balance; selectors vary by region. Try several options
    const selectors = [
      '[data-testid="wallet-balance"]',
      ".wallet-balance",
      "text=/Balance/",
      "#apx-content .a-color-price",
      ".a-color-price",
    ];

    let raw = null;
    for (const sel of selectors) {
      const el = await page.$(sel);
      if (el) {
        raw = (await el.textContent())?.trim();
        if (raw) break;
      }
    }

    if (!raw) {
      // Fallback: scrape by regex searching page text
      const body = await page.textContent("body");
      const match = body && body.match(/([A-Z]{3}|₹|£|€|\$)\s?([\d,]+(?:\.\d{1,2})?)/);
      if (match) raw = `${match[1]} ${match[2]}`;
    }

    if (!raw) throw new Error("Unable to locate wallet balance on page");

    const parsed = parseCurrencyAmount(raw);
    if (!parsed) throw new Error("Failed to parse balance");

    let newStorageState = null;
    try {
      newStorageState = await context.storageState();
    } catch {}

    return { ...parsed, storageState: newStorageState };
  } finally {
    // Do not close immediately to allow manual step if interactive; short delay
    await new Promise((r) => setTimeout(r, 500));
    await context.close();
    await browser.close();
  }
}

function parseCurrencyAmount(text) {
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

