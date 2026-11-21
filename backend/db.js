// One shared MongoDB connection.
// Locally it is opened once at startup; on Vercel (serverless) it is opened on the first request
// of each function instance and then reused, so warm requests are fast.
const mongoose = require("mongoose");
const { ensureAdmin } = require("./scripts/seedAdmin");

let ready = null;

function connectDb() {
  if (!ready) {
    ready = (async () => {
      for (const key of ["MONGO_URI", "JWT_SECRET"]) {
        if (!process.env[key]) throw new Error(`Missing required env variable: ${key}`);
      }

      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 8000, // fail fast with a clear error instead of hanging
        maxPoolSize: 5
      });
      console.log("MongoDB connected");

      // A fresh database has no users: create the first admin from ADMIN_* so you can sign in
      try {
        const seeded = await ensureAdmin({ onlyIfNoAdmin: true });
        if (seeded.created) console.log(`First admin created: ${seeded.email}`);
      } catch (err) {
        console.warn("First admin was not created:", err.message);
      }
    })().catch((err) => {
      ready = null; // let the next request try again
      throw err;
    });
  }
  return ready;
}

module.exports = { connectDb };
