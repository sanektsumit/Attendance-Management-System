const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/attendance_db';
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
    console.log(`🗄️ Database Name: ${conn.connection.name}`);

    // Bootstrap initial Admin user and Office Location if database is empty on cold start
    try {
      const User = require('../models/User');
      const OfficeLocation = require('../models/OfficeLocation');

      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount === 0) {
        await User.create({
          name: 'Sanekt Sumit',
          email: 'sanekt.sumit@gmail.com',
          password: process.env.DEFAULT_ADMIN_PASSWORD || 'SanektAdmin@2026',
          role: 'admin',
          department: 'HR',
          designation: 'System Administrator',
          shiftStart: '09:00',
          shiftEnd: '18:00',
        });
        console.log('👤 Initial Admin account bootstrapped: sanekt.sumit@gmail.com');
      }

      const officeCount = await OfficeLocation.countDocuments();
      if (officeCount === 0) {
        await OfficeLocation.create({
          name: 'Headquarters Office',
          lat: 28.57126,
          lng: 77.21991,
          radiusMeters: 500,
          isActive: true,
        });
        console.log('🏢 Initial Office Location bootstrapped: Headquarters Office (28.57126, 77.21991)');
      }
    } catch (seedErr) {
      console.warn(`⚠️ Cold-start bootstrap notice: ${seedErr.message}`);
    }
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
