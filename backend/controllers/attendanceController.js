const mongoose = require('mongoose');
const Attendance = require('../models/Attendance');
const OfficeLocation = require('../models/OfficeLocation');
const User = require('../models/User');
const { getTodayString, calculateLateStatus, calculateWorkingHours } = require('../utils/attendanceCalc');
const { reverseGeocode } = require('../utils/geocode');
const { checkGeofenceCompliance } = require('../utils/geofence');
const { sendPunchNotificationEmail } = require('../utils/mailer');
const { createNotification } = require('../utils/notificationService');

// Helper to resolve active office location for geofence check
const getActiveOfficeLocation = async () => {
  try {
    const office = await OfficeLocation.findOne({ isActive: true });
    if (office) {
      return { lat: office.latitude, lng: office.longitude, radius: office.radiusMeters || 200, name: office.name };
    }
  } catch (err) {}
  // Default office location fallback if none configured in DB
  return { lat: 28.57126, lng: 77.21991, radius: 500, name: 'Headquarters' };
};

// @desc    Punch In / Log In for Today
// @route   POST /api/v1/attendance/punch-in
// @access  Private
const punchIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayString();

    const existingRecord = await Attendance.findOne({ user: userId, date: todayStr });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: 'You have already logged in for today.',
        attendance: existingRecord,
      });
    }

    const { lat, lng, photo } = req.body;
    if (lat === undefined || lng === undefined || lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({
        success: false,
        message: 'GPS location coordinates (lat/lng) are required for logging in.',
      });
    }

    const office = await getActiveOfficeLocation();
    const fenceCheck = checkGeofenceCompliance(lat, lng, office.lat, office.lng, office.radius);

    const address = await reverseGeocode(lat, lng);
    const now = new Date();
    const status = calculateLateStatus(now, req.user.shiftStart || '09:00', req.user.lateThresholdMinutes || 15);

    const attendance = await Attendance.create({
      user: userId,
      date: todayStr,
      punchInTime: now,
      status,
      punchInLocation: {
        lat: Number(lat),
        lng: Number(lng),
        address,
        isWithinFence: fenceCheck.isWithinFence,
      },
      punchInPhoto: photo || '',
      punchSource: 'WEB',
    });

    // 📧 Trigger Log In Email Notification asynchronously
    try {
      sendPunchNotificationEmail({
        employee: req.user,
        eventType: 'LOGGED_IN',
        timestamp: now,
        address,
        lat,
        lng,
        status,
      });
    } catch (e) {}

    // 🔔 Send in-app notifications on BOTH sides (Employee & HR Admin)
    try {
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Notification for Employee
      createNotification({
        recipient: req.user._id,
        recipientRole: 'employee',
        sender: null,
        senderName: 'Attendance System',
        type: 'attendance_in',
        title: '🟢 Attendance Check-In Recorded',
        message: `You marked attendance at ${timeStr} (${status}) from ${address}.`,
        meta: { status, address, time: now, attendanceId: attendance._id },
      });
      // Notification for Admin
      createNotification({
        recipientRole: 'admin',
        sender: req.user._id,
        senderName: req.user.name,
        type: 'attendance_in',
        title: `🟢 ${req.user.name} Logged In (${status})`,
        message: `${req.user.name} (${req.user.department || 'General'}) clocked in at ${timeStr} from ${address}.`,
        meta: { employeeName: req.user.name, employeeId: req.user._id, status, address, time: now, attendanceId: attendance._id },
      });
    } catch (nErr) {}

    res.status(201).json({
      success: true,
      message: `Logged In successfully at ${now.toLocaleTimeString()} (${status})`,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Punch Out / Log Out for Today
// @route   PUT /api/v1/attendance/punch-out
// @access  Private
const punchOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayString();

    const attendance = await Attendance.findOne({ user: userId, date: todayStr });
    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No Log In record found for today. You must Log In first.',
      });
    }

    if (attendance.punchOutTime) {
      return res.status(400).json({
        success: false,
        message: 'You have already logged out for today.',
        attendance,
      });
    }

    const { lat, lng, photo } = req.body;
    if (lat === undefined || lng === undefined || lat === null || lng === null || isNaN(Number(lat)) || isNaN(Number(lng))) {
      return res.status(400).json({
        success: false,
        message: 'GPS location coordinates (lat/lng) are required for logging out.',
      });
    }

    const office = await getActiveOfficeLocation();
    const fenceCheck = checkGeofenceCompliance(lat, lng, office.lat, office.lng, office.radius);

    const address = await reverseGeocode(lat, lng);
    const now = new Date();
    const totalHours = calculateWorkingHours(attendance.punchInTime, now);

    attendance.punchOutTime = now;
    attendance.totalHours = totalHours;
    attendance.punchOutLocation = {
      lat: Number(lat),
      lng: Number(lng),
      address,
      isWithinFence: fenceCheck.isWithinFence,
    };
    if (photo) {
      attendance.punchOutPhoto = photo;
    }

    if (totalHours < 4 && attendance.status !== 'LATE') {
      attendance.status = 'HALF_DAY';
    }

    await attendance.save();

    // 📧 Trigger Log Out Email Notification asynchronously
    try {
      sendPunchNotificationEmail({
        employee: req.user,
        eventType: 'LOGGED_OUT',
        timestamp: now,
        address,
        lat,
        lng,
        totalHours,
        status: attendance.status,
      });
    } catch (e) {}

    // 🔔 Send in-app notifications on BOTH sides (Employee & HR Admin)
    try {
      const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      // Notification for Employee
      createNotification({
        recipient: req.user._id,
        recipientRole: 'employee',
        sender: null,
        senderName: 'Attendance System',
        type: 'attendance_out',
        title: '🟡 Shift Completed / Clocked Out',
        message: `You clocked out at ${timeStr}. Total shift duration: ${totalHours} hrs.`,
        meta: { totalHours, time: now, attendanceId: attendance._id },
      });
      // Notification for Admin
      createNotification({
        recipientRole: 'admin',
        sender: req.user._id,
        senderName: req.user.name,
        type: 'attendance_out',
        title: `🟡 ${req.user.name} Clocked Out`,
        message: `${req.user.name} clocked out at ${timeStr}. Shift duration: ${totalHours} hrs.`,
        meta: { employeeName: req.user.name, employeeId: req.user._id, totalHours, time: now, attendanceId: attendance._id },
      });
    } catch (nErr) {}

    res.status(200).json({
      success: true,
      message: `Logged Out successfully! Total hours worked: ${totalHours} hrs`,
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Today's Attendance Status
// @route   GET /api/v1/attendance/today
// @access  Private
const getTodayStatus = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayString();

    const attendance = await Attendance.findOne({ user: userId, date: todayStr });

    res.status(200).json({
      success: true,
      todayStr,
      attendance: attendance || null,
      isPunchedIn: attendance ? !!attendance.punchInTime : false,
      isPunchedOut: attendance ? !!attendance.punchOutTime : false,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get User's Personal Attendance History
// @route   GET /api/v1/attendance/my-history
// @access  Private
const getMyAttendance = async (req, res) => {
  try {
    const userId = req.user._id;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 30;
    const skip = (page - 1) * limit;

    const history = await Attendance.find({ user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Attendance.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      count: history.length,
      total,
      page,
      pages: Math.ceil(total / limit) || 1,
      history,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Recapture / Update Attendance Photo after Logging In
// @route   PUT /api/v1/attendance/update-photo
// @access  Private
const updateAttendancePhoto = async (req, res) => {
  try {
    const userId = req.user._id;
    const todayStr = getTodayString();
    const { photo } = req.body;

    if (!photo) {
      return res.status(400).json({ success: false, message: 'Photo data is required' });
    }

    const attendance = await Attendance.findOne({ user: userId, date: todayStr });
    if (!attendance) {
      return res.status(404).json({ success: false, message: 'No active attendance record found for today.' });
    }

    attendance.punchInPhoto = photo;
    await attendance.save();

    res.status(200).json({
      success: true,
      message: 'Attendance verification photo recaptured & updated successfully!',
      attendance,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  punchIn,
  punchOut,
  getTodayStatus,
  getMyAttendance,
  updateAttendancePhoto,
};
