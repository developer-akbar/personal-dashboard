## Personal Dashboard (Amazon + Electricity)

See Amazon Pay balances and APSPDCL electricity bills in one place.

### Features

- Authentication & Security
  - Secure auth (bcrypt + JWT; 12h access), refresh endpoint
  - AES‑256‑GCM for encrypted Amazon credentials and session storageState
  - Cloudflare Turnstile CAPTCHA (opt-in via env), strict CSP, CORS
  - Forgot password with OTP via email/SMS
  - Unique mobile number validation during registration
  - Password strength validation and show/hide toggles

- Amazon Dashboard
  - Add/manage multiple Amazon accounts (amazon.in only)
  - One-click Refresh (single/all) with robust locking, cooldowns, admin bypass
  - Balance history snapshots; totals per currency and base-currency conversion
  - Rewards tab: fetch and display grouped rewards with details
  - Status badges, error tooltips, pin/star, tags, sort/filter/search
  - CSV export (buttons hidden by default), keyboard shortcuts (a/r)
  - Role-based access control (admin/subscriber restrictions)

- Electricity Dashboard (APSPDCL)
  - Services CRUD with validation (13 digits and APSPDCL pre-check)
  - One-click Refresh (single/all) with locking, cooldowns, admin bypass
  - Auto-refresh after adding a valid service
  - Trash: soft delete, restore, and permanent delete
  - Duplicate-in-Trash guidance: toast to navigate/restore
  - Search, sort (Amount desc/Label A–Z/Last refreshed), and status filters (Active tab)
  - "Search Total (₹)" pill for filtered results
  - Pay Now: copies Service Number first (toast), then opens APSPDCL
  - Last 3 bills (excludes current month), billed units, due highlight
  - Selection checkboxes with Selected Total

- User Profile & Account Management
  - Complete profile management with avatar support
  - Edit profile information (name, email, phone, avatar URL)
  - Change password with current password verification
  - Instagram-style avatar borders with gradient effects
  - Modal-based editing for better UX

- UX, Theming, and Accessibility
  - Global header component with consistent navigation
  - Homepage with educational purpose statement
  - Light/dark/system theme with persisted preference
  - Improved card visuals; consistent buttons/icons; loading toasts persist until API resolves
  - Flash + scroll to newly added service
  - Time‑ago labels next to Last refreshed
  - Mobile-friendly: numeric keypad for Service Number input; no spinners
  - Loading skeletons for better perceived performance
  - Error boundaries for graceful error handling
  - Input validation with real-time feedback

- Mobile & Responsive Design
  - Optimized touch targets (44px minimum)
  - Long-press detection for mobile interactions
  - Responsive grid layouts and modal designs
  - Mobile-specific styling and interactions
  - Improved search input clear buttons

- Observability & Health
  - Footer health indicator (backend up, DB status)
  - Debug panel (toggleable) and helpful toast flows
  - Comprehensive error handling and user feedback

### Tech Stack

- Backend: Node.js + Express (Render/Cloud Run), MongoDB Atlas
- Frontend: React + Vite (Vercel), HashRouter
- Scraping: Playwright (Chromium, storageState per account)
- APSPDCL: public bill history API

### Local Development

1) Backend
```bash
cp backend/.env.example backend/.env
# set MONGODB_URI, JWT secrets, CREDENTIALS_ENCRYPTION_KEY, CORS_ORIGIN
cd backend && npm install && npm run dev
```

2) Frontend
```bash
cp frontend/.env.example frontend/.env
# set VITE_API_URL (e.g., http://localhost:4000)
cd frontend && npm install && npm run dev
```

### Environment Variables (Backend)

- `MONGODB_URI` (required), `MONGODB_DB_NAME` (default: `amazon_wallet_monitor`)
- `JWT_SECRET`, `JWT_REFRESH_SECRET` (strong, random; distinct)
- `JWT_ACCESS_TTL` (default: `12h`), `JWT_REFRESH_TTL` (default: `7d`)
- `CREDENTIALS_ENCRYPTION_KEY` (32+ chars; changing it invalidates stored creds)
- `CORS_ORIGIN` (your frontend origin, comma-separated if multiple)

Generate secrets:
```bash
openssl rand -hex 64
# or
node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"
```

Note: `NODE_ENV` is optional on Render (defaults to production).

### Deployment

Backend (Render / Cloud Run)
- Docker-based on Playwright image or Node build with Playwright install
- Expose port 4000/8080; set env vars (MONGODB_URI, JWT secrets, CREDENTIALS_ENCRYPTION_KEY, CORS_ORIGIN)

Frontend (Vercel)
- Set `VITE_API_URL` to your backend URL
- `vercel.json` enforces strict CSP and SPA rewrites

### Security Notes

- Never log raw Amazon credentials. They are AES‑256‑GCM encrypted at rest
- Manual 2FA/Captcha: storageState seeded locally once (see SESSIONS.md)
- JWT access + refresh tokens; access ~12h; refresh endpoint available

### Usage Notes

- Homepage at `/` explains features and has Sign in. Unauthenticated or expired sessions redirect to `/`.
- Only `amazon.in` is supported. If you need other regions, extend selectors and models accordingly.
- For Amazon accounts, seed `storageState` locally once and upload via dashboard (see SESSIONS.md).

