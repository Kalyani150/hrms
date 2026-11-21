const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT (httpOnly cookie, or Bearer header) and attaches req.user
const protect = async (req, res, next) => {
  let token = req.cookies?.token;

  const header = req.headers.authorization;
  if (!token && header?.startsWith("Bearer ")) {
    token = header.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  const user = await User.findById(payload.id);
  if (!user || user.status !== "Active") {
    return res.status(401).json({ message: "Account not found or inactive" });
  }

  req.user = user;
  next();
};

// Restricts a route to the given roles, e.g. authorize("Admin")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

module.exports = { protect, authorize };
