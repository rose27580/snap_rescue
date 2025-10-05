/// routes/breakdown.js
const express = require("express");
const router = express.Router();
const Breakdown = require("../models/breakdown");
const Workshop = require("../models/Workshop");

// POST breakdown request
router.post("/", async (req, res) => {
  try {
    const { location, description } = req.body;

    // Create new breakdown
    let newBreakdown = new Breakdown({
      user: req.session.user._id,
      location,
      description,
      date: new Date(),
      status: "Pending"
    });

    // 🔹 Just assign the first workshop (simple option)
    const workshop = await Workshop.findOne();
    if (workshop) {
      newBreakdown.workshop = workshop._id;
      console.log(`✅ Assigned to workshop: ${workshop.name}`);
    } else {
      console.log("⚠️ No workshop found to assign");
    }

    await newBreakdown.save();
    res.redirect("/dashboard"); // redirect user after request

  } catch (err) {
    console.error("❌ Error creating breakdown:", err);
    res.status(500).send("Error submitting breakdown");
  }
});

module.exports = router;
