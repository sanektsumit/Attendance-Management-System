const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/db');
const User = require('./models/User');
const Attendance = require('./models/Attendance');
const Leave = require('./models/Leave');
const OfficeLocation = require('./models/OfficeLocation');
const Department = require('./models/Department');

const seedData = async () => {
  try {
    await connectDB();

    console.log('🧹 Clearing existing database collections...');
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Leave.deleteMany({});
    await OfficeLocation.deleteMany({});
    await Department.deleteMany({});

    console.log('🏢 Creating default Office Location...');
    await OfficeLocation.create({
      name: 'Headquarters Office',
      lat: 28.57126,
      lng: 77.21991,
      radiusMeters: 200,
      isGeofenceEnforced: false,
    });

    console.log('📁 Creating Departments...');
    await Department.create([
      { name: 'Engineering', code: 'ENG', description: 'Software Development & IT' },
      { name: 'Human Resources', code: 'HR', description: 'People Management & Operations' },
      { name: 'Sales & Marketing', code: 'SALES', description: 'Client Acquisition & Branding' },
    ]);

    console.log('👤 Seeding Admin User...');
    await User.create({
      name: 'Sanekt Sumit',
      email: 'sanekt.sumit@gmail.com',
      password: 'sanekt.sumit@gmail.com',
      role: 'admin',
      department: 'HR',
      designation: 'System Administrator',
      shiftStart: '09:00',
      shiftEnd: '18:00',
    });

    console.log('🎉 Seed Completed Successfully! Raw data removed.');
    console.log('\n--- Admin Credentials ---');
    console.log('Admin Email: sanekt.sumit@gmail.com');
    console.log('Password:    sanekt.sumit@gmail.com\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed Failed:', error);
    process.exit(1);
  }
};

seedData();

