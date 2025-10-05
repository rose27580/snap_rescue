const mongoose = require('mongoose');

const WorkshopSchema = new mongoose.Schema({
  name: { type: String, required: true },
  ownerName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true },
  location: { 
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  password: { type: String, required: true },
  approved: { type: Boolean, default: false }, // ✅ add this
  createdAt: { type: Date, default: Date.now }
});

const Workshop = mongoose.models.Workshop || mongoose.model("Workshop", WorkshopSchema);
module.exports = Workshop;
