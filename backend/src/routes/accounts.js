import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import AmazonAccount from "../models/AmazonAccount.js";
import { encryptSecret, maskEmail } from "../utils/crypto.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res, next) => {
  try {
    const accounts = await AmazonAccount.find({ userId: req.user.id, isDeleted: { $ne: true } }).sort({ pinned: -1, order: 1, createdAt: 1 });
    res.json(
      accounts.map((a) => ({
        id: a._id,
        label: a.label,
        email: maskEmail(a.email),
        region: a.region,
        lastBalance: a.lastBalance,
        lastCurrency: a.lastCurrency,
        lastRefreshedAt: a.lastRefreshedAt,
        order: a.order ?? 0,
        pinned: !!a.pinned,
        tags: a.tags || [],
      }))
    );
  } catch (e) {
    next(e);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const { label, email, password, region, pinned, tags } = req.body || {};
    if (!label || !email || !password || !region) {
      return res.status(400).json({ error: "label, email, password, region required" });
    }
    const encryptedPassword = encryptSecret(password);
    const account = await AmazonAccount.create({
      userId: req.user.id,
      label,
      email,
      region,
      encryptedPassword,
      order: Date.now(),
      pinned: !!pinned,
      tags: Array.isArray(tags) ? tags : [],
    });
    res.status(201).json({ id: account._id });
  } catch (e) {
    next(e);
  }
});

router.put("/:id", async (req, res, next) => {
  try {
    const { label, email, password, region, pinned, tags } = req.body || {};
    const update = {};
    if (label) update.label = label;
    if (email) update.email = email;
    if (region) update.region = region;
    if (typeof pinned === 'boolean') update.pinned = pinned;
    if (Array.isArray(tags)) update.tags = tags;
    if (password) update.encryptedPassword = encryptSecret(password);

    await AmazonAccount.updateOne({ _id: req.params.id, userId: req.user.id }, update);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    await AmazonAccount.updateOne({ _id: req.params.id, userId: req.user.id }, { isDeleted: true, deletedAt: new Date() });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

// Restore soft-deleted account
router.post('/restore/:id', async (req,res,next)=>{
  try{
    await AmazonAccount.updateOne({ _id: req.params.id, userId: req.user.id }, { isDeleted: false, deletedAt: null });
    res.json({ ok: true });
  }catch(e){ next(e) }
})

// Bulk reorder
router.post('/reorder', async (req, res, next) => {
  try{
    const { items } = req.body || {};
    if(!Array.isArray(items)) return res.status(400).json({ error: 'items must be an array of {id, order}' });
    const ops = items.map(({id, order})=> ({ updateOne: { filter: { _id: id, userId: req.user.id }, update: { order } } }));
    if(ops.length) await AmazonAccount.bulkWrite(ops);
    res.json({ ok: true });
  }catch(e){ next(e) }
});

// Upload Playwright storageState for an account to seed a logged-in session
router.post("/:id/storage-state", async (req, res, next) => {
  try {
    const { storageState } = req.body || {};
    if (!storageState) return res.status(400).json({ error: "storageState required" });
    const account = await AmazonAccount.findOne({ _id: req.params.id, userId: req.user.id });
    if (!account) return res.status(404).json({ error: "Account not found" });
    account.storageState = storageState;
    await account.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;

