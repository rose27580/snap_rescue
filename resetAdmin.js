const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');  // models folder is in project root
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snaprescue');

  const email = process.argv[2] || 'admin@snaprescue.com';
  const newPass = process.argv[3] || 'Admin123';

  if (!email) {
    console.log('Usage: node resetAdminPassword.js admin@example.com [newPassword]');
    process.exit(1);
  }

  const hash = await bcrypt.hash(newPass, 10);
  const res = await User.updateOne(
    { email: email.toLowerCase().trim(), role: 'admin' },
    { $set: { password: hash } }
  );

  console.log('Updated:', res.modifiedCount || res.nModified, 'admin(s). New password:', newPass);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
