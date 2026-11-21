// Local development MongoDB on mongodb://127.0.0.1:27017 (data kept in backend/.data).
// Use this when you have no Atlas / installed MongoDB:  npm run db
const path = require("path");
const fs = require("fs");
const { MongoMemoryServer } = require("mongodb-memory-server");

const dbPath = path.join(__dirname, "..", ".data");
fs.mkdirSync(dbPath, { recursive: true });

MongoMemoryServer.create({
  instance: { port: 27017, ip: "127.0.0.1", dbPath, storageEngine: "wiredTiger" }
})
  .then((server) => {
    console.log(`Local MongoDB running: ${server.getUri()}hrms`);
    const stop = async () => { await server.stop({ doCleanup: false }); process.exit(0); };
    process.on("SIGINT", stop);
    process.on("SIGTERM", stop);
  })
  .catch((err) => {
    console.error("Could not start local MongoDB:", err.message);
    process.exit(1);
  });
