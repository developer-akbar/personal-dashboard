import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";

const router = Router();

router.post("/register", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });

    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ email, passwordHash });

    const access = signAccessToken({ sub: String(user._id), email: user.email });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email });
    res.json({ accessToken: access, refreshToken: refresh, user: { id: user._id, email: user.email } });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "Email and password required" });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: "Invalid credentials" });
    const access = signAccessToken({ sub: String(user._id), email: user.email });
    const refresh = signRefreshToken({ sub: String(user._id), email: user.email });
    res.json({ accessToken: access, refreshToken: refresh, user: { id: user._id, email: user.email } });
  } catch (e) {
    next(e);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
    const payload = verifyRefreshToken(refreshToken);
    const access = signAccessToken({ sub: payload.sub, email: payload.email });
    res.json({ accessToken: access });
  } catch (e) {
    next(e);
  }
});

export default router;

