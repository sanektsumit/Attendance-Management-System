const OfficeLocation = require('../models/OfficeLocation');

// @desc    Get Office Geofence Settings
// @route   GET /api/v1/office
// @access  Private
const getOfficeSettings = async (req, res) => {
  try {
    let office = await OfficeLocation.findOne();
    if (!office) {
      office = await OfficeLocation.create({
        name: 'Headquarters Office',
        lat: Number(process.env.OFFICE_LAT || 28.6139),
        lng: Number(process.env.OFFICE_LNG || 77.2090),
        radiusMeters: Number(process.env.OFFICE_RADIUS_METERS || 200),
        isGeofenceEnforced: false,
      });
    }

    res.status(200).json({
      success: true,
      office,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Office Geofence Settings
// @route   PUT /api/v1/office
// @access  Private/Admin
const updateOfficeSettings = async (req, res) => {
  try {
    const { name, lat, lng, radiusMeters, isGeofenceEnforced } = req.body;

    let office = await OfficeLocation.findOne();
    if (!office) {
      office = new OfficeLocation();
    }

    if (name) office.name = name;
    if (lat !== undefined) office.lat = Number(lat);
    if (lng !== undefined) office.lng = Number(lng);
    if (radiusMeters !== undefined) office.radiusMeters = Number(radiusMeters);
    if (isGeofenceEnforced !== undefined) office.isGeofenceEnforced = isGeofenceEnforced;

    await office.save();

    res.status(200).json({
      success: true,
      message: 'Office geofence settings updated',
      office,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getOfficeSettings,
  updateOfficeSettings,
};
