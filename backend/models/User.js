const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const documentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  category: { type: String, default: 'General' }, // ID Proof, Resume, Certificate, Contract
  fileUrl: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email address'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please enter a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 1,
      select: false,
    },
    role: {
      type: String,
      enum: ['employee', 'admin', 'manager'],
      default: 'employee',
    },
    department: {
      type: String,
      default: 'General',
    },
    designation: {
      type: String,
      default: 'Staff Member',
    },
    shiftStart: {
      type: String,
      default: '09:00', // 9:00 AM
    },
    shiftEnd: {
      type: String,
      default: '18:00', // 6:00 PM
    },
    lateThresholdMinutes: {
      type: Number,
      default: 15,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatar: {
      type: String,
      default: '',
    },
    // Extended Employee Profile Details
    phone: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
    },
    bio: {
      type: String,
      default: '',
    },
    dob: {
      type: String,
      default: '',
    },
    emergencyContact: {
      type: String,
      default: '',
    },
    socialLinks: {
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      twitter: { type: String, default: '' },
      portfolio: { type: String, default: '' },
    },
    documents: [documentSchema],
  },
  { timestamps: true }
);

// Encrypt password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match entered password to hashed password in DB
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
