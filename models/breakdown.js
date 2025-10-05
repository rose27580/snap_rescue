
const mongoose = require("mongoose");

const breakdownSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  description: String,
  location: {
    lat: Number,
    lng: Number
  },
  status: { type: String, default: "Pending" }, // Pending, In Progress, Completed
  workshop: { type: mongoose.Schema.Types.ObjectId, ref: "Workshop", default: null },
  accepted: { type: Boolean, default: null } // ✅ new field: null=pending, true=accepted, false=declined
}, { timestamps: true });

module.exports = mongoose.model("Breakdown", breakdownSchema);
