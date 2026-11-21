const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["Sick Leave", "Casual Leave", "Annual Leave", "Other"],
    required: true
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  reason: { type: String, default: "", trim: true },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending"
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null
  },
  reviewedAt: { type: Date, default: null }
}, {
  timestamps: true,
  toJSON: {
    // Send plain YYYY-MM-DD dates to the frontend
    transform(doc, ret) {
      ret.startDate = ret.startDate?.toISOString().slice(0, 10);
      ret.endDate = ret.endDate?.toISOString().slice(0, 10);
      return ret;
    }
  }
});

leaveSchema.pre("validate", function () {
  if (this.startDate && this.endDate && this.endDate < this.startDate) {
    this.invalidate("endDate", "End date cannot be before start date");
  }
});

leaveSchema.index({ employee: 1, startDate: -1 });

module.exports = mongoose.model("Leave", leaveSchema);
