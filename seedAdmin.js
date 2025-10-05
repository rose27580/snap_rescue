// seedAdmin.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // adjust path

mongoose.connect('mongodb://127.0.0.1:27017/snaprescue')
  .then(async () => {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await User.create({
      name: "Super Admin",
      email: "admin@gmail.com",
      password: hashedPassword,
      role: "admin"
    });
    console.log("✅ Admin created successfully!");
    mongoose.disconnect();
  })
  .catch(err => console.error(err));
