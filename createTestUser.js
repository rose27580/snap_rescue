const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User'); // make sure this path is correct
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snaprescue');

  console.log("✅ Connected to MongoDB");

  // 1️⃣ Create a test user
  const email = "testuser@example.com";
  const plainPassword = "Test1234";

  let user = await User.findOne({ email });
  if (user) {
    console.log("⚠️ User already exists, deleting...");
    await User.deleteOne({ email });
  }

  user = new User({
    name: "Test User",
    email,
    password: plainPassword, // plain password; hook will hash it
    role: "user"
  });

  await user.save();
  console.log("✅ Test user created");
  console.log("Stored password hash:", user.password);

  // 2️⃣ Verify bcrypt.compare works
  const isMatch = await bcrypt.compare(plainPassword, user.password);
  console.log("Password match:", isMatch ? "✅ Success" : "❌ Fail");

  // 3️⃣ Clean up (optional)
  // await User.deleteOne({ email });
  // console.log("Test user deleted");

  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
