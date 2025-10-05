const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/auth-choice');
}

// -------------------- SIGNUP --------------------
router.get('/signup', (req, res) => {
  res.render('auth', { role: 'user', session: req.session });
});

router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.send('User already exists!');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, role: 'user' });
    await newUser.save();

    req.session.user = newUser;
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error signing up.');
  }
});

// -------------------- LOGIN --------------------
router.get('/login', (req, res) => {
  res.render('auth', { role: 'user', session: req.session });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.send('Invalid credentials.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.send('Invalid credentials.');

    req.session.user = user;
    res.redirect('/user/dashboard');
  } catch (err) {
    console.error(err);
    res.send('Error logging in.');
  }
});

// -------------------- LOGOUT --------------------
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

module.exports = router;
