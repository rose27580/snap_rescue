const express = require('express');
const router = express.Router();

// Homepage
router.get('/', (req, res) => {
  res.render('index', { session: req.session });
});

// Auth choice page (User / Workshop / Admin)
router.get('/auth-choice', (req, res) => {
  res.render('authChoice', { session: req.session });
});

// About page
router.get('/about', (req, res) => {
  res.render('about', { session: req.session });
});

// Help / Support page
router.get('/help', (req, res) => {
  res.render('help', { session: req.session });
});

// Location page (for “Get Assistance” button)
router.get('/location', (req, res) => {
  res.render('location', { session: req.session });
});

module.exports = router;
