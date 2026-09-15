const mongoose = require('mongoose');
const Notification = require('../models/Notification');

// In-memory fallback notifications buffer
const inMemoryNotifications = [];

/**
 * Dispatch a notification to a specific user, role ('admin'/'employee'), or 'all'
 */
const createNotification = async ({
  recipient = null,
  recipientRole = 'all',
  sender = null,
  senderName = 'System',
  type = 'system',
  title,
  message,
  meta = {},
}) => {
  const notifObj = {
    _id: new mongoose.Types.ObjectId(),
    recipient: recipient ? String(recipient) : null,
    recipientRole,
    sender: sender ? String(sender) : null,
    senderName,
    type,
    title,
    message,
    meta,
    isRead: false,
    readBy: [],
    createdAt: new Date(),
  };

  // Keep in memory buffer
  inMemoryNotifications.unshift(notifObj);
  if (inMemoryNotifications.length > 100) {
    inMemoryNotifications.pop();
  }

  // Persist to MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      await Notification.create({
        recipient,
        recipientRole,
        sender,
        senderName,
        type,
        title,
        message,
        meta,
      });
    } catch (err) {
      console.error('Failed to save notification to MongoDB:', err.message);
    }
  }

  return notifObj;
};

module.exports = {
  createNotification,
  inMemoryNotifications,
};
