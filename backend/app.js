require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { connectDb } = require("./db");

const app = express();

// Behind a reverse proxy (Render, Vercel ...) the visitor's real IP arrives in X-Forwarded-For.
// Without this the login rate limiter would treat every visitor as the same address.
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 0);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Make sure the database is connected before any route runs (cached after the first call)
app.use(async (req, res, next) => {
  try {
    await connectDb();
    next();
  } catch (err) {
    next(err);
  }
});

// Limit brute-force guessing on the public auth forms. Only the listed paths are limited
// (page loads call /auth/me, so limiting all of /api/auth would log real users out).
const authLimiter = (limit, extra = {}) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." },
    ...extra
  });

app.use("/api/auth/login", authLimiter(20, { skipSuccessfulRequests: true }));
app.use("/api/auth/register", authLimiter(10));
app.use("/api/auth/forgot-password", authLimiter(5));
app.use("/api/auth/reset-password", authLimiter(10));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/leaves", require("./routes/leaves"));
app.use("/api/payroll", require("./routes/payroll"));
app.use("/api/dashboard", require("./routes/dashboard"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({
    message:
      process.env.NODE_ENV === "production" ? "Server error" : err.message
  });
});

module.exports = app;
