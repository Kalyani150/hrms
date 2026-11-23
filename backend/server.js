// Entry point: `npm run dev` locally, `npm start` on Render.
require("dotenv").config();

const app = require("./app");
const { connectDb } = require("./db");

const PORT = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error("Startup failed:", err.message);
    process.exit(1);
  });
