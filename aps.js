require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// session
app.use(session({
  secret: process.env.SESSION_SECRET || 'snaprescue-secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snaprescue' })
}));

// DB connect
mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/snaprescue')
  .then(() => console.log('MongoDB connected ✅'))
  .catch(err => console.error('MongoDB Error ❌', err));

// routes
const userAuth = require('./routes/userAuth');
const workshopAuth = require('./routes/workshopAuth');

app.use(userAuth);
app.use(workshopAuth);

// homepage & public pages
app.get('/', (req, res) => {
  res.render('index', { session: req.session });
});
app.get('/about', (req, res) => res.render('about', { session: req.session }));

// start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SnapRescue server running on port ${PORT} 🚗`));
