  const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();


// -------------------- Middleware --------------------
app.use(express.urlencoded({ extended: true })); // parse POST data
app.use(express.static(path.join(__dirname, 'public')));

// Set EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false, // very important
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// -------------------- MongoDB --------------------
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snaprescue')
  .then(() => console.log("MongoDB connected ✅"))
  .catch(err => console.error("MongoDB connection error ❌:", err));

// -------------------- Routes --------------------
// User routes
// ---------- User Routes ----------
const userRoutes = require('./routes/user');  // single file for all user functionality


const breakdownRoutes = require('./routes/breakdown');

// Workshop routes (merged login/signup + dashboard)
const workshopRoutes = require('./routes/workshop');

// Admin routes
const adminRoutes = require('./routes/admin');

// Mount routes
// ---------- User Routes ----------
 // single file for all user functionality

app.use('/user', userRoutes);  // handles:
// /user/signup
// /user/login
// /user/logout
// /user/dashboard
// /user/profile

app.use('/breakdown', breakdownRoutes);     // /breakdown requests

app.use('/workshop', workshopRoutes);       // /workshop/login, /workshop/signup, /workshop/dashboard

app.use('/admin', adminRoutes);             // /admin login/dashboard

// -------------------- Homepage --------------------
app.get('/', (req, res) => {
  res.render('index', { session: req.session }); // renders your full homepage EJS
});
// -------------------- Public Pages --------------------

// About page
app.get('/about', (req, res) => {
  res.render('about', { session: req.session });
});

// Feedback page (GET)
app.get('/feedback', (req, res) => {
  res.render('feedback', { session: req.session, error: null });
});

// Feedback page (POST)
app.post('/feedback', (req, res) => {
  // Here you can save feedback to DB or just thank user
  console.log(req.body);
  res.send("Thanks for your feedback!");
});

// Location / Get Assistance page
app.get('/location', (req, res) => {
  res.render('location', { session: req.session });
});

// Auth choice page (optional, if you have a unified login/signup page)
app.get('/auth-choice', (req, res) => {
  res.render('auth-choice', { session: req.session });
});


// -------------------- 404 Handler --------------------
app.use((req, res) => {
  res.status(404).send("404 Not Found ❌");
});

// -------------------- Start Server --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SnapRescue server running on port ${PORT} 🚗`));
