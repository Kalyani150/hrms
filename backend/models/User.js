const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true, select: false },
  role: {
    type: String,
    enum: ["Admin", "Employee"],
    default: "Employee"
  },
  department: { type: String, default: "" },
  designation: { type: String, default: "" },
  phone: { type: String, default: "", trim: true },
  address: { type: String, default: "", trim: true },
  salary: { type: Number, default: 0, min: 0 },
  joiningDate: { type: Date, default: Date.now },
  status: {
    type: String,
    enum: ["Active", "Inactive"],
    default: "Active"
  }
}, { timestamps: true });

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
