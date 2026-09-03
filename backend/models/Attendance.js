const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  lat: { type: Number, default: null },
  lng: { type: Number, default: null },
  address: { type: String, default: 'Location unavailable' },
  isWithinFence: { type: Boolean, default: true },
});

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // Stored in YYYY-MM-DD format for precise daily queries & indexing
      required: true,
    },
    punchInTime: {
      type: Date,
      required: true,
    },
    punchOutTime: {
      type: Date,
      default: null,
    },
    punchInLocation: {
      type: locationSchema,
      default: () => ({}),
    },
    punchOutLocation: {
      type: locationSchema,
      default: () => ({}),
    },
    totalHours: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'HALF_DAY', 'ABSENT', 'ON_LEAVE'],
      default: 'PRESENT',
    },
    punchSource: {
      type: String,
      enum: ['WEB', 'MOBILE', 'SYSTEM'],
      default: 'WEB',
    },
    remark: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Ensure an employee can only have one attendance record per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });
attendanceSchema.index({ user: 1, date: -1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
