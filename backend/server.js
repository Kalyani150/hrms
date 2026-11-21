require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const rateLimit = require("express-rate-limit");
const { ensureAdmin } = require("./scripts/seedAdmin");

const app = express();

// Behind a reverse proxy (e.g. Render) the visitor's real IP arrives in X-Forwarded-For.
// Without this the login rate limiter would treat every visitor as the same address.
app.set("trust proxy", Number(process.env.TRUST_PROXY) || 0);

const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

for (const key of ["MONGO_URI", "JWT_SECRET"]) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
}

app.use(helmet());
app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

// Limit brute-force password guessing: only FAILED login attempts count, and only on /login
// (page loads call /auth/me, so limiting all of /api/auth would log real users out)
app.use(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 20,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again later." }
  })
);

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

// Mount a route file; skip it (with a warning) until it exports a router
const mountRoute = (path, file) => {
  const router = require(file);
  if (typeof router === "function") {
    app.use(path, router);
  } else {
    console.warn(`Skipping ${path}: ${file} does not export a router yet`);
  }
};

mountRoute("/api/auth", "./routes/auth");
mountRoute("/api/employees", "./routes/employees");
mountRoute("/api/attendance", "./routes/attendance");
mountRoute("/api/leaves", "./routes/leaves");
mountRoute("/api/payroll", "./routes/payroll");
mountRoute("/api/dashboard", "./routes/dashboard");

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

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("MongoDB connected");

    // A fresh database has no users: create the first admin from ADMIN_* so you can sign in
    try {
      const seeded = await ensureAdmin({ onlyIfNoAdmin: true });
      if (seeded.created) console.log(`First admin created: ${seeded.email}`);
    } catch (err) {
      console.warn("First admin was not created:", err.message);
    }

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("MongoDB connection failed:", err.message);
    process.exit(1);
  });
