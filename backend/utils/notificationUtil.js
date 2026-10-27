import logger from './logger.js';

// Stub — full implementation added in Commit 20 when Notification model exists.
// Callers should import from here; the real util will replace this file then.
export const createNotificationUtil = async (userId, title, message, type = 'system', priority = 'medium') => {
  logger.debug('Notification stub (model not yet created)', { userId, title, type, priority });
};
