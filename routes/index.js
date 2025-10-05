const express = require('express');
const router = express.Router();

// Homepage
router.get('/', (req, res) => {
  res.render('index', { session: req.session });
});

// Auth choice page
router.get('/auth-choice', (req, res) => {
  res.render('authChoice');
});

module.exports = router;
