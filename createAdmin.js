const mongoose = require('mongoose');
const User = require('./models/User');

require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snaprescue');

  const email = process.argv[2] || 'admin@snaprescue.com';
  const password = process.argv[3] || 'Admin123';
  const name = 'Super Admin';

  // check if already exists
  let existing = await User.findOne({ email });
  if (existing) {
    console.log("⚠️ Admin already exists:", existing.email);
    return process.exit(0);
  }

  const admin = new User({
    name,
    email,
    password,  // plain here, hook will hash
    role: 'admin'
  });

  await admin.save();
  console.log("✅ Admin created:", email, "Password:", password);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
