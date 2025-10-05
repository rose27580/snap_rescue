const express = require('express');
const router = express.Router();
const Breakdown = require('../models/Breakdown');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/user/login');
}

// GET user dashboard
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    // Optional: fetch recent requests for the dashboard (if needed)
    const requests = await Breakdown.find({ user: req.session.user._id })
      .populate('workshop', 'workshopName email phone')
      .sort({ date: -1 });

    res.render('user-dashboard', { user: req.session.user, requests });
  } catch (err) {
    console.error("❌ User dashboard error:", err);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
});

module.exports = router;
