const mongoose = require('mongoose');

const officeLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Headquarters Office',
    },
    lat: {
      type: Number,
      required: true,
      default: 28.6139, // Default New Delhi coordinates
    },
    lng: {
      type: Number,
      required: true,
      default: 77.209,
    },
    radiusMeters: {
      type: Number,
      default: 200, // 200 meter radius threshold
    },
    isGeofenceEnforced: {
      type: Boolean,
      default: false, // Flag only vs Strict Block
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('OfficeLocation', officeLocationSchema);
