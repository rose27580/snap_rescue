const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Breakdown = require('../models/breakdown');
const bcrypt = require('bcrypt');

// ------------------ Middleware ------------------

// Redirect logged-in users away from login/signup
function redirectIfLoggedIn(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') {
    return res.redirect('/user/dashboard');
  }
  next();
}

// Ensure user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.role === 'user') return next();
  res.redirect('/user/login');
}

// ------------------ SIGNUP ------------------
router.get('/signup', redirectIfLoggedIn, (req, res) => {
  res.render('auth-user', { role: 'signup', error: null });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    const emailNormalized = email.trim().toLowerCase();

    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      return res.render('auth-user', { role: 'signup', error: 'Email already registered' });
    }

    // ✅ Remove explicit bcrypt.hash here; pre-save hook in model will handle hashing
    const newUser = new User({
      name,
      email: emailNormalized,
      phone,
      password,   // plain password; will be hashed by User model hook
      role: 'user'
    });

    await newUser.save();

    // Save minimal user info in session
    req.session.user = {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role
    };

    res.redirect('/user/dashboard');
  } catch (err) {
    console.error("❌ User signup error:", err);
    res.render('auth-user', { role: 'signup', error: 'Something went wrong during signup' });
  }
});

// ------------------ LOGIN ------------------
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('auth-user', { role: 'login', error: null });
});

router.post('/login', async (req, res) => {
  try {
    const emailNormalized = req.body.email.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email: emailNormalized });
    if (!user) return res.render('auth-user', { role: 'login', error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.render('auth-user', { role: 'login', error: 'Invalid credentials' });

    // Save minimal user info in session
    req.session.user = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    res.redirect('/user/dashboard');
  } catch (err) {
    console.error("❌ User login error:", err);
    res.render('auth-user', { role: 'login', error: 'Something went wrong during login' });
  }
});

// ------------------ DASHBOARD ------------------
router.get('/dashboard', isAuthenticated, async (req, res) => {
  try {
    const requests = await Breakdown.find({ user: req.session.user._id })
      .populate('workshop', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.render('user-dashboard', { user: req.session.user, requests });
  } catch (err) {
    console.error("❌ User dashboard error:", err);
    res.status(500).send("Something went wrong loading the dashboard.");
  }
});

// ------------------ PROFILE ------------------
router.get('/profile', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id).lean();
    if (!user) return res.redirect('/user/login');
    res.render('user-profile', { user });
  } catch (err) {
    console.error("❌ Error loading profile:", err);
    res.status(500).send("Something went wrong.");
  }
});

router.post('/profile', isAuthenticated, async (req, res) => {
  const { name, email, phone } = req.body;
  const emailNormalized = email.trim().toLowerCase();

  try {
    const updatedUser = await User.findByIdAndUpdate(
      req.session.user._id,
      { name, email: emailNormalized, phone },
      { new: true }
    ).lean();

    req.session.user = {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role
    };

    res.redirect('/user/profile');
  } catch (err) {
    console.error("❌ Error updating profile:", err);
    res.status(500).send("Could not update profile.");
  }
});

// ------------------ LOGOUT ------------------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// ------------------ BREAKDOWN REQUEST ------------------
router.get('/breakdown', isAuthenticated, (req, res) => {
  res.render('user-breakdown', { user: req.session.user });
});

router.post('/breakdown', isAuthenticated, async (req, res) => {
  try {
    const { lat, lng, description } = req.body;

    if (!lat || !lng) {
      return res.status(400).send("Location coordinates are required");
    }

    const newBreakdown = new Breakdown({
      user: req.session.user._id,
      description,
      location: { 
        lat: parseFloat(lat), 
        lng: parseFloat(lng) 
      },
      status: 'pending'
    });

    await newBreakdown.save();

    // Notify nearest workshops
    const Workshop = require('../models/Workshop');
    const workshops = await Workshop.find({});

    function getDistance(lat1, lng1, lat2, lng2) {
      return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
    }

    const sortedWorkshops = workshops
      .map(w => ({
        workshop: w,
        distance: getDistance(
          parseFloat(lat), parseFloat(lng),
          w.location?.lat || 0, w.location?.lng || 0
        )
      }))
      .sort((a,b) => a.distance - b.distance);

    const nearestWorkshops = sortedWorkshops.slice(0,3);
    nearestWorkshops.forEach(nw => {
      console.log(`🔔 Notify Workshop: ${nw.workshop.name} about breakdown ID: ${newBreakdown._id}`);
    });

    res.redirect('/user/dashboard');
  } catch (err) {
    console.error("❌ Breakdown request error:", err);
    res.status(500).send("Error submitting breakdown request");
  }
});

module.exports = router;
