const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function resetUsers() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/snaprescue', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB connected ✅');

    // Delete all existing users
    await User.deleteMany({});
    console.log('All users deleted ✅');

    // Optional: create a test user
    const testUser = new User({
      name: 'Test User',
      email: 'testuser@example.com',
      password: '123456', // pre-save hook will hash it
      role: 'user'
    });

    await testUser.save();
    console.log('Test user created ✅');
    console.log('Email: testuser@example.com, Password: 123456');

    process.exit(0);
  } catch (err) {
    console.error('❌ Error resetting users:', err);
    process.exit(1);
  }
}

resetUsers();
