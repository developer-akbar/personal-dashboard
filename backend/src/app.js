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

const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin === "*" ? true : corsOrigin.split(","),
    credentials: true,
  })
);

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

app.use("/auth", authRoutes);
app.use("/accounts", accountRoutes);
app.use("/balances", balanceRoutes);
app.use("/settings", settingsRoutes);

app.use(errorHandler);

export default app;

