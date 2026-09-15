const mongoose = require('mongoose');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const { createNotification } = require('../utils/notificationService');

const mockLeaves = [];

const getMongoUserId = async (user) => {
  if (user._id && mongoose.Types.ObjectId.isValid(String(user._id))) {
    return user._id;
  }
  try {
    let dbUser = await User.findOne({ email: user.email });
    if (!dbUser) {
      dbUser = await User.create({
        name: user.name || 'Employee',
        email: user.email,
        password: user.password || 'Employee@123',
        role: user.role || 'employee',
        department: user.department || 'Engineering',
        designation: user.designation || 'Staff Member',
      });
    }
    return dbUser._id;
  } catch (e) {
    return user._id;
  }
};

// @desc    Apply for Leave
// @route   POST /api/v1/leaves
// @access  Private (Employee)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate || !reason) {
      return res.status(400).json({ success: false, message: 'Please provide start date, end date, and reason' });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ success: false, message: 'Start date cannot be after end date' });
    }

    const newLeave = {
      _id: `leave_${Date.now()}`,
      user: req.user,
      leaveType: leaveType || 'CASUAL',
      startDate,
      endDate,
      reason,
      status: 'PENDING',
      createdAt: new Date(),
    };

    if (mongoose.connection.readyState === 1) {
      try {
        const mongoUserId = await getMongoUserId(req.user);
        const dbLeave = await Leave.create({
          user: mongoUserId,
          leaveType: leaveType || 'CASUAL',
          startDate,
          endDate,
          reason,
          status: 'PENDING',
        });
        newLeave._id = dbLeave._id;
      } catch (err) {
        console.error('Failed to save Leave to MongoDB:', err.message);
      }
    }

    mockLeaves.unshift(newLeave);

    // 🔔 Send in-app notifications on BOTH sides (Employee & HR Admin)
    try {
      createNotification({
        recipientRole: 'admin',
        sender: req.user._id,
        senderName: req.user.name,
        type: 'leave_applied',
        title: `📋 New Leave Request: ${req.user.name}`,
        message: `${req.user.name} applied for ${leaveType || 'Casual'} leave (${startDate} to ${endDate}). Reason: "${reason || 'No reason specified'}"`,
        meta: { leaveId: newLeave._id, employeeName: req.user.name, leaveType, startDate, endDate, reason },
      });
      createNotification({
        recipient: req.user._id,
        recipientRole: 'employee',
        type: 'leave_applied',
        title: `📋 Leave Application Submitted`,
        message: `Your request for ${leaveType || 'Casual'} leave (${startDate} to ${endDate}) is submitted and pending HR review.`,
        meta: { leaveId: newLeave._id, leaveType, startDate, endDate },
      });
    } catch (nErr) {}

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      leave: newLeave,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get logged in employee's leaves
// @route   GET /api/v1/leaves/mine
// @access  Private
const getMyLeaves = async (req, res) => {
  try {
    let leaves = [];
    if (mongoose.connection.readyState === 1) {
      try {
        leaves = await Leave.find({ user: req.user._id }).sort({ createdAt: -1 });
      } catch (err) {}
    }

    if (leaves.length === 0) {
      leaves = mockLeaves.filter((l) => String(l.user._id || l.user) === String(req.user._id));
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all leave requests (Admin)
// @route   GET /api/v1/leaves
// @access  Private/Admin
const getAllLeaves = async (req, res) => {
  try {
    const { status } = req.query;
    let leaves = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const filter = status ? { status } : {};
        leaves = await Leave.find(filter).populate('user', 'name email department designation').sort({ createdAt: -1 });
      } catch (err) {}
    }

    if (leaves.length === 0) {
      leaves = status ? mockLeaves.filter((l) => l.status === status) : mockLeaves;
    }

    res.status(200).json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or Reject Leave (Admin)
// @route   PUT /api/v1/leaves/:id/status
// @access  Private/Admin
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, adminComment } = req.body;
    const leaveId = req.params.id;

    const leave = mockLeaves.find((l) => String(l._id) === String(leaveId));
    if (leave) {
      leave.status = status;
      leave.adminComment = adminComment || '';
    }

    if (mongoose.connection.readyState === 1) {
      try {
        await Leave.findByIdAndUpdate(leaveId, { status, adminComment });
      } catch (err) {}
    }

    // 🔔 Send in-app notifications on BOTH sides (Employee & HR Admin)
    try {
      let targetUser = null;
      let targetLeave = leave;
      if (!targetLeave && mongoose.connection.readyState === 1) {
        targetLeave = await Leave.findById(leaveId);
      }
      const isApproved = status === 'APPROVED';
      const employeeId = targetLeave ? (targetLeave.user?._id || targetLeave.user) : null;
      if (employeeId) {
        createNotification({
          recipient: employeeId,
          recipientRole: 'employee',
          type: isApproved ? 'leave_approved' : 'leave_rejected',
          title: isApproved ? '✅ Leave Request Approved!' : '❌ Leave Request Rejected',
          message: `Your leave request has been ${status.toUpperCase()} by HR Administration.${adminComment ? ' Remarks: "' + adminComment + '"' : ''}`,
          meta: { leaveId, status, adminComment },
        });
      }
      createNotification({
        recipientRole: 'admin',
        sender: req.user._id,
        senderName: req.user.name,
        type: isApproved ? 'leave_approved' : 'leave_rejected',
        title: `Leave Request ${status.toUpperCase()}`,
        message: `Leave application #${leaveId} was marked as ${status} by Admin.`,
        meta: { leaveId, status, adminComment },
      });
    } catch (nErr) {}

    res.status(200).json({
      success: true,
      message: `Leave application ${status.toLowerCase()} successfully`,
      leave: leave || { _id: leaveId, status },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
};
