const express = require("express");
const router = express.Router();
const User = require("../models/User");

// Middleware to check authentication
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect("/user/login");
}

// GET profile page
router.get("/profile", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).lean();
    if (!user) {
      return res.redirect("/user/login");
    }
    res.render("user-profile", { user });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).send("Something went wrong.");
  }
});

// POST update profile
router.post("/profile", isAuthenticated, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      { name, email, phone },
      { new: true }
    ).lean();

    // update session with fresh user data
    req.session.user = updatedUser;

    res.redirect("/user/profile");
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).send("Could not update profile.");
  }
});

module.exports = router;
