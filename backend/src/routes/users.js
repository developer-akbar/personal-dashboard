import { Router } from "express";
import bcrypt from "bcryptjs";
import { requireAuth } from "../middleware/auth.js";
import User from "../models/User.js";

const router = Router();
router.use(requireAuth);

router.get("/me", async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ error: "Not found" });
    res.json({ id: user._id, email: user.email, name: user.name, baseCurrency: user.baseCurrency });
  } catch (e) { next(e); }
});

router.put("/me", async (req, res, next) => {
  try {
    const { name, baseCurrency } = req.body || {};
    const update = {};
    if (typeof name === 'string') update.name = name;
    if (typeof baseCurrency === 'string') update.baseCurrency = baseCurrency;
    await User.updateOne({ _id: req.user.id }, update);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

router.post("/change-password", async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) return res.status(400).json({ error: "Missing fields" });
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "Not found" });
    const ok = await user.comparePassword(currentPassword);
    if (!ok) return res.status(401).json({ error: "Invalid current password" });
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ ok: true });
  } catch (e) { next(e); }
});

export default router;

