import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import AmazonAccount from "../models/AmazonAccount.js";
import Balance from "../models/Balance.js";
import { decryptSecret } from "../utils/crypto.js";
import { fetchAmazonPayBalance } from "../services/scraper.js";
import rateLimit from 'express-rate-limit'
import { getAdminUsers, getAmazonRefreshCap, istDayKey } from '../config/limits.js'

const router = Router();

router.use(requireAuth);

// Per-user limiter: configurable per-day cap for non-admin users
const ADMIN_USERS = getAdminUsers()
const AMAZON_REFRESH_RATE_LIMIT_PER_DAY = getAmazonRefreshCap()
const refreshLimiter = rateLimit({
  windowMs: 24*60*60*1000,
  max: AMAZON_REFRESH_RATE_LIMIT_PER_DAY,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req)=> `${req.user?.id || req.ip}:${istDayKey()}`,
  skip: (req)=> ADMIN_USERS.includes((req.user?.email||'').toLowerCase()),
  handler: (_req, res)=> res.status(429).json({ error: `Rate limit exceeded (AMAZON_REFRESH_RATE_LIMIT_PER_DAY/day). Please try tomorrow.` })
})

router.get("/history/:accountId", async (req, res, next) => {
  try {
    const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const history = await Balance.find({ accountId: account._id }).sort({ createdAt: -1 }).limit(200);
    res.json(history);
  } catch (e) {
    next(e);
  }
});

router.post("/refresh/:accountId", refreshLimiter, async (req, res, next) => {
  try {
    const cooldownMs = Number(process.env.REFRESH_COOLDOWN_MS || 5*60*1000)
    const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found" });
    const isAdmin = ADMIN_EMAILS.includes((req.user?.email||'').toLowerCase())
    if (!isAdmin){
      if (account.refreshInProgress) return res.status(409).json({ error: 'Already refreshing' })
      if (account.nextAllowedAt && account.nextAllowedAt > new Date()){
        const wait = Math.ceil((account.nextAllowedAt - new Date())/1000)
        return res.status(429).json({ error: `Please wait ${wait}s` })
      }
    }
    account.refreshInProgress = true; await account.save()

    const password = decryptSecret(account.encryptedPassword);
    const { amount, currency, storageState, debug } = await fetchAmazonPayBalance({
      region: account.region,
      email: account.email,
      password,
      interactive: process.env.NODE_ENV !== 'production',
      storageState: account.storageState,
    });

    account.lastBalance = amount;
    account.lastCurrency = currency;
    account.lastRefreshedAt = new Date();
    // cooldown only on success
    if (!isAdmin) account.nextAllowedAt = new Date(Date.now()+cooldownMs)
    account.refreshInProgress = false
    if (storageState) account.storageState = storageState;
    await account.save();

    const snap = await Balance.create({ accountId: account._id, amount, currency });
    res.json({ amount, currency, timestamp: snap.createdAt, debug });
  } catch (e) {
    try {
      const account = await AmazonAccount.findOne({ _id: req.params.accountId, userId: req.user.id });
      if (account) {
        account.lastError = e?.message || 'Refresh failed';
        account.lastErrorAt = new Date();
        account.refreshInProgress = false // ensure unlocked on failure
        await account.save();
      }
    } catch {}
    next(e);
  }
});

router.post("/refresh-all", refreshLimiter, async (req, res, next) => {
  try {
    const cooldownMs = Number(process.env.REFRESH_COOLDOWN_MS || 5*60*1000)
    const accounts = await AmazonAccount.find({ userId: req.user.id }).sort({ createdAt: 1 });
    const batchSize = Math.max(1, Math.min(5, Number(req.body?.batchSize) || 3));
    const results = [];
    for (let i = 0; i < accounts.length; i += batchSize) {
      const chunk = accounts.slice(i, i + batchSize);
      const settled = await Promise.allSettled(chunk.map(async (account, idx) => {
        try{
          const isAdmin = ADMIN_EMAILS.includes((req.user?.email||'').toLowerCase())
          if (!isAdmin){
            if (account.refreshInProgress) return { skipped:true, accountId: account._id, reason:'in-progress' }
            if (account.nextAllowedAt && account.nextAllowedAt > new Date()) return { skipped:true, accountId: account._id, reason:'cooldown' }
          }
          account.refreshInProgress = true; await account.save()
          const password = decryptSecret(account.encryptedPassword);
          const { amount, currency, storageState } = await fetchAmazonPayBalance({
            region: account.region,
            email: account.email,
            password,
            interactive: process.env.NODE_ENV !== 'production',
            storageState: account.storageState,
          });
          account.lastBalance = amount;
          account.lastCurrency = currency;
          account.lastRefreshedAt = new Date();
          if (!isAdmin) account.nextAllowedAt = new Date(Date.now()+cooldownMs) // only on success
          account.refreshInProgress = false
          if (storageState) account.storageState = storageState;
          await account.save();
          const snap = await Balance.create({ accountId: account._id, amount, currency });
          return { accountId: account._id, amount, currency, index: i + idx + 1, total: accounts.length, timestamp: snap.createdAt };
        }catch(err){
          try{ account.refreshInProgress = false; await account.save() }catch{}
          throw err
        }
      }));
      for (const r of settled) {
        if (r.status === 'fulfilled') results.push(r.value);
        else {
          const err = r.reason;
          const acc = chunk[settled.indexOf(r)];
          if (acc) {
            acc.lastError = err?.message || 'Refresh failed';
            acc.lastErrorAt = new Date();
            try { await acc.save(); } catch {}
            results.push({ accountId: acc._id, error: acc.lastError, index: accounts.indexOf(acc) + 1, total: accounts.length });
          }
        }
      }
    }
    res.json({ results, batchSize });
  } catch (e) {
    next(e);
  }
});

export default router;

