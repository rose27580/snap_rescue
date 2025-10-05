const mongoose = require('mongoose');
const Workshop = require('./models/Workshop');
const bcrypt = require('bcrypt');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected ✅'))
.catch(err => console.error('❌ MongoDB connection error:', err));

async function populate() {
  try {
    const workshopsData = [
      { name: 'City Auto Care', ownerName: 'Rajesh Kumar', email: 'cityauto@example.com', phone: '9876543210', password: '123456', location: { lat: 28.6139, lng: 77.209 }, approved: true },
      { name: 'QuickFix Garage', ownerName: 'Anita Sharma', email: 'quickfix@example.com', phone: '9876501234', password: '123456', location: { lat: 28.7041, lng: 77.1025 }, approved: true },
      { name: 'Reliable Motors', ownerName: 'Suresh Patel', email: 'reliable@example.com', phone: '9876512345', password: '123456', location: { lat: 28.5355, lng: 77.3910 }, approved: true },
      { name: 'Speedy Auto Repairs', ownerName: 'Rajesh Kumar', email: 'speedy.auto@example.com', phone: '9876543210', password: 'password123', location: { lat: 19.0760, lng: 72.8777 }, approved: true },
      { name: 'DriveSafe Workshop', ownerName: 'Anita Sharma', email: 'drivesafe@example.com', phone: '9123456780', password: 'securepass', location: { lat: 18.5204, lng: 73.8567 }, approved: true },
      { name: 'QuickFix Motors', ownerName: 'Vikram Singh', email: 'quickfix2@example.com', phone: '9988776655', password: 'qwerty123', location: { lat: 28.6139, lng: 77.209 }, approved: false },
      { name: 'AutoCare Experts', ownerName: 'Sonia Verma', email: 'autocare@example.com', phone: '9871234567', password: 'autocare', location: { lat: 12.9716, lng: 77.5946 }, approved: true },
      { name: 'MotorPro Garage', ownerName: 'Rakesh Patel', email: 'motorpro@example.com', phone: '9966554433', password: 'motorpro', location: { lat: 13.0827, lng: 80.2707 }, approved: false }
    ];

    // Hash passwords
    for (let w of workshopsData) {
      w.password = await bcrypt.hash(w.password, 10);
    }

    await Workshop.deleteMany({});
    await Workshop.insertMany(workshopsData);

    console.log('✅ Workshops populated successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error populating workshops:', err);
    process.exit(1);
  }
}

populate();
