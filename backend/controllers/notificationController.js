const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const { inMemoryNotifications, createNotification } = require('../utils/notificationService');

// @desc    Get user notifications (Admin or Employee)
// @route   GET /api/v1/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userId = String(req.user._id);
    const userRole = req.user.role; // 'admin' | 'employee'

    let notifications = [];

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {
          $or: [
            { recipient: req.user._id },
            { recipientRole: userRole },
            { recipientRole: 'all' },
          ],
        };

        notifications = await Notification.find(query)
          .sort({ createdAt: -1 })
          .limit(50)
          .lean();
      } catch (err) {
        console.error('Failed to fetch notifications from MongoDB:', err.message);
      }
    }

    // Fallback to in-memory notifications if empty or DB issue
    if (notifications.length === 0 && inMemoryNotifications.length > 0) {
      notifications = inMemoryNotifications.filter((n) => {
        if (n.recipient && n.recipient === userId) return true;
        if (n.recipientRole === userRole || n.recipientRole === 'all') return true;
        return false;
      });
    }

    // Determine read status for this specific user
    const formatted = notifications.map((n) => {
      const isUserRead =
        n.isRead ||
        (n.readBy && n.readBy.some((id) => String(id) === userId));
      return {
        ...n,
        isRead: Boolean(isUserRead),
      };
    });

    const unreadCount = formatted.filter((n) => !n.isRead).length;

    res.status(200).json({
      success: true,
      count: formatted.length,
      unreadCount,
      notifications: formatted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/v1/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.findByIdAndUpdate(id, {
          $addToSet: { readBy: userId },
          isRead: true,
        });
      } catch (err) {}
    }

    // Update in-memory item
    const item = inMemoryNotifications.find((n) => String(n._id) === String(id));
    if (item) {
      item.isRead = true;
      if (!item.readBy) item.readBy = [];
      if (!item.readBy.includes(String(userId))) item.readBy.push(String(userId));
    }

    res.status(200).json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/v1/notifications/mark-all-read
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.updateMany(
          {
            $or: [
              { recipient: userId },
              { recipientRole: userRole },
              { recipientRole: 'all' },
            ],
          },
          {
            $addToSet: { readBy: userId },
            isRead: true,
          }
        );
      } catch (err) {}
    }

    inMemoryNotifications.forEach((n) => {
      if (n.recipient === String(userId) || n.recipientRole === userRole || n.recipientRole === 'all') {
        n.isRead = true;
        if (!n.readBy) n.readBy = [];
        if (!n.readBy.includes(String(userId))) n.readBy.push(String(userId));
      }
    });

    res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear / Delete notifications
// @route   DELETE /api/v1/notifications
// @access  Private
const clearNotifications = async (req, res) => {
  try {
    const userId = req.user._id;

    if (mongoose.connection.readyState === 1) {
      try {
        await Notification.deleteMany({
          $or: [
            { recipient: userId },
            { recipientRole: req.user.role },
          ],
        });
      } catch (err) {}
    }

    res.status(200).json({ success: true, message: 'Notifications cleared successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit employee complaint or inquiry
// @route   POST /api/v1/notifications/complaint
// @access  Private
const submitComplaint = async (req, res) => {
  try {
    const { subject, description, priority = 'NORMAL' } = req.body;
    if (!subject || !description) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both subject and description for your complaint',
      });
    }

    const employee = req.user;

    // 1. Send notification to HR Admin
    await createNotification({
      recipientRole: 'admin',
      sender: employee._id,
      senderName: employee.name,
      type: 'complaint',
      title: `⚠️ New Complaint: ${subject}`,
      message: `${employee.name} (${employee.department || 'Staff'}) submitted: "${description}"`,
      meta: {
        employeeId: employee._id,
        employeeName: employee.name,
        employeeEmail: employee.email,
        subject,
        description,
        priority,
        timestamp: new Date(),
      },
    });

    // 2. Send confirmation notification to Employee
    await createNotification({
      recipient: employee._id,
      recipientRole: 'employee',
      sender: null,
      senderName: 'HR Support',
      type: 'complaint',
      title: '⚠️ Complaint Registered with HR',
      message: `Your inquiry "${subject}" has been delivered to HR Administration. Priority: ${priority}.`,
      meta: {
        subject,
        priority,
        timestamp: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully. HR Admin has been notified.',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  submitComplaint,
};
