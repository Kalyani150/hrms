// One shared MongoDB connection.
// Opened once at startup (server.js) and reused by every request.
const mongoose = require("mongoose");
const User = require("./models/User");

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
        const seeded = await User.ensureAdmin({ onlyIfNoAdmin: true });
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
