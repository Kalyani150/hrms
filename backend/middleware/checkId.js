const mongoose = require("mongoose");

// Rejects a request whose :id is not a valid MongoDB id, e.g. checkId("leave")
const checkId = (label) => (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: `Invalid ${label} id` });
  }
  next();
};

module.exports = checkId;
