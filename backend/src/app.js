import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import compression from "compression";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import accountRoutes from "./routes/accounts.js";
import balanceRoutes from "./routes/balances.js";
import settingsRoutes from "./routes/settings.js";
import { errorHandler } from "./middleware/error.js";

const app = express();

const normalizeOrigin = (s) => (s || "").replace(/\/$/, "");
const envOrigins = (process.env.CORS_ORIGIN || "").split(",").map((s) => s.trim()).filter(Boolean).map(normalizeOrigin);
const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser requests or same-origin
    if (!origin) return callback(null, true);
    const normalized = normalizeOrigin(origin);
    if (envOrigins.length === 0) return callback(null, true);
    if (envOrigins.includes(normalized)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(morgan("tiny"));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
});
app.use(limiter);

app.get("/health", (_req, res) => res.json({ ok: true }));
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Backward-compatible mounts
app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/balances", balanceRoutes);
app.use("/settings", settingsRoutes);

// API prefix mounts to match frontend baseURL ending with /api
app.use("/api/auth", authRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/balances", balanceRoutes);
app.use("/api/settings", settingsRoutes);

app.use(errorHandler);

export default app;

