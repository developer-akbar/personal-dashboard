import { chromium } from "playwright";

const REGION_TO_HOST = {
  "amazon.in": "https://www.amazon.in",
};

export async function fetchAmazonPayBalance({ region, email, password, interactive, storageState }) {
  const baseUrl = REGION_TO_HOST[region];
  if (!baseUrl) throw new Error("Unsupported region");

  const isProd = process.env.NODE_ENV === "production";
  const browser = await chromium.launch({
    headless: isProd ? true : false,
    channel: undefined,
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined,
    args: isProd ? ["--no-sandbox", "--disable-setuid-sandbox"] : [],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    storageState: storageState || undefined,
  });
  const page = await context.newPage();

  try {
    // Navigate to sign-in
    await page.goto(`${baseUrl}/ap/signin`, { waitUntil: "domcontentloaded" });
    await page.fill("#ap_email", email);
    await page.click("#continue");
    await page.fill("#ap_password", password);
    await page.click("#signInSubmit");

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

