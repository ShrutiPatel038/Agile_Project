// Stub — full implementation added in Commit 28 (EVG-45/46/47).
// Exported here so queueService, emailWorker and overtimeWorker can import without error.
import logger from '../utils/logger.js';

export const createNotificationUtil = async (userId, title, message, _type, _priority = 'medium', _channels = {}, io = null) => {
  logger.debug('Notification (stub)', { userId, title, message });
  if (io) io.to(userId?.toString()).emit('notification', { title, message });
};

export const sendBookingConfirmationEmail = async (booking, user) => {
  logger.info('Email confirmation (stub)', { bookingId: booking._id, email: user?.email });
};

export const createNotification = async (_req, res) => res.status(501).json({ message: 'Not implemented yet' });
export const getUserNotifications = async (_req, res) => res.json({ notifications: [] });
export const markAsRead = async (_req, res) => res.json({ message: 'ok' });
