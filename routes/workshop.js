const express = require('express');
const router = express.Router();
const Workshop = require('../models/Workshop');
const Breakdown = require('../models/breakdown');
const bcrypt = require('bcrypt');

// ------------------ Middleware ------------------

// Redirect logged-in workshops away from login/signup
function redirectIfLoggedIn(req, res, next) {
  if (req.session.user && req.session.user.role === 'workshop') {
    return res.redirect('/workshop/dashboard');
  }
  next();
}

// Allow only logged-in workshops
function isWorkshop(req, res, next) {
  if (req.session.user && req.session.user.role === 'workshop') return next();
  res.redirect('/workshop/login');
}

// ------------------ SIGNUP ------------------
router.get('/signup', redirectIfLoggedIn, (req, res) => {
  res.render('workshopAuth', { role: 'signup', error: null });
});

router.post('/signup', async (req, res) => {
  try {
    const { ownerName, workshopName, email, phone, location, password } = req.body;

    const existing = await Workshop.findOne({ email });
    if (existing) {
      return res.render('workshopAuth', { role: 'signup', error: "Email already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newWorkshop = new Workshop({
      name: workshopName,
      ownerName,
      email,
      phone,
      location,
      password: hashedPassword,
      approved: false
    });

    await newWorkshop.save();
    res.redirect('/workshop/login');
  } catch (err) {
    console.error("❌ Workshop signup error:", err);
    res.render('workshopAuth', { role: 'signup', error: "Something went wrong during signup" });
  }
});

// ------------------ LOGIN ------------------
router.get('/login', redirectIfLoggedIn, (req, res) => {
  res.render('workshopAuth', { role: 'login', error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const workshop = await Workshop.findOne({ email });

    if (!workshop) {
      return res.render('workshopAuth', { role: 'login', error: "Workshop not found" });
    }

    const validPassword = await bcrypt.compare(password, workshop.password);
    if (!validPassword) {
      return res.render('workshopAuth', { role: 'login', error: "Invalid password" });
    }

    if (!workshop.approved) {
      return res.render('workshopAuth', { role: 'login', error: "Your workshop is not yet approved by admin" });
    }

    req.session.user = {
      _id: workshop._id,
      name: workshop.name,
      role: 'workshop'
    };

    res.redirect('/workshop/dashboard');
  } catch (err) {
    console.error("❌ Workshop login error:", err);
    res.render('workshopAuth', { role: 'login', error: "Something went wrong during login" });
  }
});

// ------------------ DASHBOARD ------------------
router.get('/dashboard', isWorkshop, async (req, res) => {
  try {
    const workshopId = req.session.user._id;

    // New requests (notifications) → not yet accepted/declined
    const newRequests = await Breakdown.find({
      workshop: workshopId,
      accepted: null
    }).populate('user').lean();

    // Active jobs → accepted and not completed
    const activeJobs = await Breakdown.find({
      workshop: workshopId,
      accepted: true,
      status: { $ne: 'Completed' }
    }).populate('user').lean();

    // Completed jobs
    const completedJobs = await Breakdown.find({
      workshop: workshopId,
      status: 'Completed'
    }).populate('user').lean();

    res.render('workshop-dashboard', {
      workshop: req.session.user,
      newRequests: newRequests || [],
      activeJobs: activeJobs || [],
      completedJobs: completedJobs || []
    });
  } catch (err) {
    console.error("❌ Error loading workshop dashboard:", err);
    res.status(500).send("Could not load dashboard");
  }
});

// ------------------ ACCEPT REQUEST ------------------
router.post('/requests/:id/accept', isWorkshop, async (req, res) => {
  try {
    await Breakdown.findByIdAndUpdate(req.params.id, {
      accepted: true,
      status: 'In Progress'
    });
    res.redirect('/workshop/dashboard');
  } catch (err) {
    console.error("❌ Error accepting request:", err);
    res.status(500).send("Could not accept request");
  }
});

// ------------------ DECLINE REQUEST ------------------
router.post('/requests/:id/decline', isWorkshop, async (req, res) => {
  try {
    const declined = await Breakdown.findByIdAndUpdate(req.params.id, {
      accepted: false,
      workshop: null,
      status: 'Pending'
    }, { new: true });

    console.log(`⚠️ Admin Notification: Breakdown ID ${declined._id} was declined by workshop`);

    res.redirect('/workshop/dashboard');
  } catch (err) {
    console.error("❌ Error declining request:", err);
    res.status(500).send("Could not decline request");
  }
});

// ------------------ UPDATE STATUS ------------------
router.post('/update-status/:id', isWorkshop, async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'In Progress', 'Completed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).send("Invalid status value");
    }

    await Breakdown.findByIdAndUpdate(req.params.id, { status });
    res.redirect('/workshop/dashboard');
  } catch (err) {
    console.error("❌ Error updating status:", err);
    res.status(500).send("Could not update status");
  }
});

// ------------------ LOGOUT ------------------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/workshop/login');
  });
});

module.exports = router;
