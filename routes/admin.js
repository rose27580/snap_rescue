const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Workshop = require('../models/Workshop');
const Breakdown = require('../models/breakdown');

// ------------------ Middleware ------------------
// Ensure admin is logged in
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') return next();
  res.redirect('/admin/login');
}

// ------------------ ADMIN LOGIN ------------------
router.get('/login', (req, res) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return res.redirect('/admin/dashboard');
  }
  res.render('admin-login', { error: null });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({ email, role: 'admin' });
    if (!admin) return res.render('admin-login', { error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, admin.password);
    if (!validPassword) return res.render('admin-login', { error: 'Invalid credentials' });

    req.session.user = admin;
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Admin login error:", err);
    res.render('admin-login', { error: 'Something went wrong during login' });
  }
});

router.get('/dashboard', isAdmin, async (req, res) => {
  try {
    const users = await User.find({ role: 'user' }).lean();
    const workshops = await Workshop.find().lean();
    
    const breakdowns = await Breakdown.find()
      .populate('user', 'name email phone')
      .populate('workshop', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    // ✅ Add declined breakdowns for admin to see
    const declinedBreakdowns = await Breakdown.find({ accepted: false })
      .populate('user', 'name email phone')
      .populate('workshop', 'name email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.render('admin-dashboard', {
      admin: req.session.user,
      users,
      workshops,
      breakdowns,
      declinedBreakdowns,  // <--- pass it to EJS
      totalUsers: users.length,
      totalWorkshops: workshops.length,
      totalBreakdowns: breakdowns.length
    });

  } catch (err) {
    console.error("❌ Admin dashboard error:", err);
    res.status(500).send("Error loading admin dashboard");
  }
});

// ------------------ DELETE USER ------------------
router.get('/users/delete/:id', isAdmin, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Delete user error:", err);
    res.status(500).send("Could not delete user");
  }
});

// ------------------ APPROVE WORKSHOP ------------------
router.get('/workshops/approve/:id', isAdmin, async (req, res) => {
  try {
    await Workshop.findByIdAndUpdate(req.params.id, { approved: true });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Approve workshop error:", err);
    res.status(500).send("Could not approve workshop");
  }
});

// ------------------ DELETE WORKSHOP ------------------
router.get('/workshops/delete/:id', isAdmin, async (req, res) => {
  try {
    await Workshop.findByIdAndDelete(req.params.id);
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Delete workshop error:", err);
    res.status(500).send("Could not delete workshop");
  }
});

// ------------------ RESOLVE BREAKDOWN ------------------
router.get('/breakdowns/resolve/:id', isAdmin, async (req, res) => {
  try {
    await Breakdown.findByIdAndUpdate(req.params.id, { status: 'Resolved' });
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Resolve breakdown error:", err);
    res.status(500).send("Could not resolve breakdown");
  }
});

// ------------------ ASSIGN / REASSIGN WORKSHOP ------------------
router.post('/breakdowns/assign/:id', isAdmin, async (req, res) => {
  try {
    const breakdownId = req.params.id;
    const { workshopId } = req.body;

    const breakdown = await Breakdown.findByIdAndUpdate(
      breakdownId,
      { workshop: workshopId, status: 'Assigned', accepted: null },
      { new: true }
    );

    const workshop = await Workshop.findById(workshopId);
    if (workshop) {
      console.log(`🔔 Notify Workshop: ${workshop.name} about breakdown ID: ${breakdown._id}`);
    }

    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error("❌ Assign workshop error:", err);
    res.status(500).send("Could not assign workshop");
  }
});

// ------------------ LOGOUT ------------------
router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/admin/login');
  });
});

module.exports = router;
