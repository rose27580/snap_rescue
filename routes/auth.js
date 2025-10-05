const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Workshop = require('../models/Workshop');

// Auth page
router.get('/:role/login', (req, res) => {
  res.render('auth', { role: req.params.role });
});

router.get('/:role/signup', (req, res) => {
  res.render('auth', { role: req.params.role });
});

// Signup
router.post('/:role/signup', async (req, res) => {
  try {
    const role = req.params.role;
    if(role === 'user') {
      const { name, email, password } = req.body;
      const user = new User({ name, email, password });
      await user.save();
      req.session.user = user;
    } else if(role === 'workshop') {
      const { ownerName, workshopName, phone, location, email, password } = req.body;
      const workshop = new Workshop({ ownerName, workshopName, phone, location, email, password });
      await workshop.save();
      req.session.user = workshop;
    }
    res.redirect(`/${role}/dashboard`);
  } catch (err) {
    console.error(err);
    res.send('Error during signup');
  }
});

// Login
router.post('/:role/login', async (req, res) => {
  try {
    const role = req.params.role;
    const { email, password } = req.body;
    let user;
    if(role === 'user') {
      user = await User.findOne({ email });
    } else if(role === 'workshop') {
      user = await Workshop.findOne({ email });
    }
    if(!user) return res.send('User not found');
    const match = await user.comparePassword(password);
    if(!match) return res.send('Incorrect password');
    req.session.user = user;
    res.redirect(`/${role}/dashboard`);
  } catch (err) {
    console.error(err);
    res.send('Error during login');
  }
});

module.exports = router;
