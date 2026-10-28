const Notification = require('../models/Notification');
let ioInstance = null;

/**
 * Register active Socket.IO server instance
 * @param {object} io
 */
const setSocketIO = (io) => {
  ioInstance = io;
};

/**
 * Create a persistent notification and emit real-time event if user is connected
 * @param {object} params
 * @param {string|ObjectId} params.recipient - Target User ID
 * @param {string} params.title - Notification title
 * @param {string} params.message - Notification message
 * @param {string} params.type - One of NOTIFICATION_TYPES
 * @param {string} [params.link] - Optional frontend route
 * @param {object} [params.metadata] - Extra payload
 * @returns {Promise<Notification>}
 */
const sendNotification = async ({ recipient, title, message, type, link = '', metadata = {} }) => {
  try {
    const notification = await Notification.create({
      recipient,
      title,
      message,
      type,
      link,
      metadata,
    });

    if (ioInstance) {
      // Emit strictly to the authenticated recipient's room
      ioInstance.to(`user:${recipient}`).emit('notification:new', notification);
    }

    return notification;
  } catch (error) {
    console.error(`[Notification Service] Failed to deliver notification to ${recipient}:`, error.message);
    return null;
  }
};

/**
 * Notify all system administrators
 * @param {object} params
 */
const notifyAdmins = async ({ title, message, type, link = '', metadata = {} }) => {
  if (ioInstance) {
    ioInstance.to('role:admin').emit('admin:alert', {
      title,
      message,
      type,
      link,
      metadata,
      createdAt: new Date(),
    });
  }
};

module.exports = {
  setSocketIO,
  sendNotification,
  notifyAdmins,
};
