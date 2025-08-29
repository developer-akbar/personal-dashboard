# Amazon Wallet Monitor — Seeding Sessions (storageState) for Multiple Accounts

Use this guide to add new Amazon.in accounts and seed their sessions so server-side refreshes work reliably without interactive login.

## 0) Prerequisites (run locally)
- Node.js 18+ installed
- Internet access (to install Playwright and open Chromium)

## 1) One-time local setup
Create a working folder and install Playwright locally (you only do this once):

macOS/Linux:
```bash
mkdir -p aws-wallet-state && cd aws-wallet-state
npm init -y
npm i -D playwright@1.55.0
npx playwright install chromium
```

Windows (PowerShell):
```powershell
mkdir aws-wallet-state; cd aws-wallet-state
npm init -y
npm i -D playwright@1.55.0
npx playwright install chromium
```

## 2) Create the seeding script (seed.js)
Create a file named `seed.js` in the same folder with the following content:

```javascript
const { chromium } = require('playwright');

(async () => {
  const out = process.argv[2] || 'storageState.json';
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    locale: 'en-IN',
    timezoneId: 'Asia/Kolkata',
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  // Start from home for reliability, then go to Sign in
  await page.goto('https://www.amazon.in/', { waitUntil: 'domcontentloaded' });
  try { await page.click('#nav-link-accountList', { timeout: 3000 }); } catch {}
  if (!/ap\/signin/.test(page.url())) {
    try { await page.getByRole('link', { name: /sign in/i }).first().click({ timeout: 3000 }); } catch {}
  }
  if (!/ap\/signin/.test(page.url())) {
    try { await page.click('a[href*="/ap/signin"]', { timeout: 3000 }); } catch {}
  }

  console.log('Log in fully (Captcha/2FA). When signed in, focus this terminal and press Enter...');
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', async () => {
    const state = await context.storageState();
    require('fs').writeFileSync(out, JSON.stringify(state));
    console.log('Saved', out);
    await browser.close();
    process.exit(0);
  });
})();
```

## 3) For EACH new Amazon.in account
Repeat these steps per account. Use a unique filename per account (e.g., `storageState-akbar-prime.json`).

1) Generate storageState for that account (opens a visible Chromium):

macOS/Linux:
```bash
node seed.js storageState-<your-label>.json
```

Windows (PowerShell):
```powershell
node seed.js storageState-<your-label>.json
```

Log in to Amazon.in in the opened browser (complete Captcha/2FA). When you are fully signed in, return to the terminal and press Enter. This saves the session cookies into the specified file.

2) Build the upload payload (wraps the JSON):

macOS/Linux:
```bash
node -e "const fs=require('fs');const f=process.argv[1];const s=JSON.parse(fs.readFileSync(f,'utf8'));fs.writeFileSync(`payload-${f}.json`,JSON.stringify({storageState:s}))" storageState-<your-label>.json
```

Windows (PowerShell):
```powershell
$state = Get-Content -Raw -Path .\storageState-<your-label>.json
$body  = @{ storageState = (ConvertFrom-Json $state) } | ConvertTo-Json -Depth 20
Set-Content -Path payload-storageState-<your-label>.json -Value $body
```

3) Upload to the backend for that specific accountId
- First, obtain the `id` for the account from the dashboard or via `GET /api/accounts`.
- Replace `<ACCOUNT_ID>` and `<JWT_ACCESS_TOKEN>` below.

macOS/Linux:
```bash
curl -X POST "https://personal-dashboard-1.onrender.com/api/accounts/<ACCOUNT_ID>/storage-state" \
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  --data-binary @payload-storageState-<your-label>.json
```

Windows (PowerShell):
```powershell
curl.exe -X POST "https://personal-dashboard-1.onrender.com/api/accounts/<ACCOUNT_ID>/storage-state" ^
  -H "Authorization: Bearer <JWT_ACCESS_TOKEN>" ^
  -H "Content-Type: application/json" ^
  --data-binary "@payload-storageState-<your-label>.json"
```

4) Refresh from the dashboard
- Open the dashboard and click Refresh for that account. The server will use the stored session to fetch the Amazon Pay wallet balance headlessly.

## 4) When do I need to reseed?
You do NOT need to repeat seeding when opening the dashboard from another device.

You SHOULD reseed the specific account if:
- Amazon forces re-login (session expired, password changed, security checks)
- Refresh returns login timeouts or cannot locate the balance due to sign-in
- You get Captcha/2FA in production headless (seed locally again)

Steps to reseed are the same as Section 3; upload the new payload to the same `<ACCOUNT_ID>`.

## 5) Notes and tips
- Use a meaningful name per file: `storageState-<label>.json` and `payload-storageState-<label>.json`.
- Only `amazon.in` is supported in this project.
- Dashboard JWT is separate and now lasts ~12 hours. If the dashboard shows a 401 toast, just sign in again (no need to reseed). The Amazon storageState persists server-side per account.
- If you prefer avoiding local seeding, we can add an optional server-side "Interactive Login" feature that opens a visible browser via WebSocket so you can solve Captcha/2FA from the server session and save `storageState` automatically.