import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

let connection = null;
let emailQueue = null;
let paymentTimeoutQueue = null;
let overtimeQueue = null;
let useQueue = false;

try {
  connection = new Redis(REDIS_URL, {
    maxRetriesPerRequest: null,
    connectTimeout: 2000,
    retryStrategy: (times) => {
      if (times > 2) {
        logger.warn('BullMQ Redis unavailable. Falling back to inline tasks.');
        useQueue = false;
        return null;
      }
      return 1000;
    },
  });

  connection.on('connect', () => {
    useQueue = true;
    emailQueue        = new Queue('emails',         { connection });
    paymentTimeoutQueue = new Queue('paymentTimeout', { connection });
    overtimeQueue     = new Queue('overtime',        { connection });
    logger.info('BullMQ queues ready');
  });

  connection.on('error', (err) => {
    if (!useQueue) return;
    logger.warn('BullMQ Redis error, falling back to inline tasks', { message: err.message });
    useQueue = false;
  });
} catch (error) {
  logger.warn('Failed to init BullMQ connection', { message: error.message });
}

export const queueService = {
  addEmailJob: async (booking, user) => {
    if (useQueue && emailQueue) {
      try {
        await emailQueue.add('booking-confirmation', { booking, user }, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
        logger.info('Email job queued', { email: user.email });
        return;
      } catch (err) {
        logger.error('Email queue failed, executing inline', { message: err.message });
      }
    }
    await sendBookingConfirmationEmail(booking, user);
  },

  schedulePaymentTimeoutJob: async (bookingId, paymentDeadline) => {
    if (!useQueue || !paymentTimeoutQueue) { logger.debug('Payment timeout handled by cron', { bookingId }); return; }
    try {
      const delay = new Date(paymentDeadline).getTime() - Date.now();
      if (delay <= 0) return;
      const jobId = `payment-timeout-${bookingId}`;
      const existing = await paymentTimeoutQueue.getJob(jobId);
      if (existing) await existing.remove();
      await paymentTimeoutQueue.add('payment-timeout', { bookingId: bookingId.toString() }, { jobId, delay, attempts: 3, backoff: { type: 'fixed', delay: 10000 } });
      logger.info('Payment timeout scheduled', { bookingId, minutesUntil: Math.round(delay / 60000) });
    } catch (err) {
      logger.error('Failed to schedule payment timeout job', { bookingId, message: err.message });
    }
  },

  cancelPaymentTimeoutJob: async (bookingId) => {
    if (!useQueue || !paymentTimeoutQueue) return;
    try {
      const job = await paymentTimeoutQueue.getJob(`payment-timeout-${bookingId}`);
      if (job) { await job.remove(); logger.info('Payment timeout job cancelled', { bookingId }); }
    } catch (err) {
      logger.error('Failed to cancel payment timeout job', { bookingId, message: err.message });
    }
  },

  scheduleOvertimeJob: async (bookingId, endTime, gracePeriodMinutes = 15) => {
    if (!useQueue || !overtimeQueue) { logger.debug('Overtime handled by cron', { bookingId }); return; }
    try {
      const fireAt = new Date(endTime).getTime() + gracePeriodMinutes * 60 * 1000;
      const delay  = Math.max(fireAt - Date.now(), 100);
      const jobId  = `overtime-${bookingId}`;
      const existing = await overtimeQueue.getJob(jobId);
      if (existing) await existing.remove();
      await overtimeQueue.add('overtime-check', { bookingId: bookingId.toString() }, { jobId, delay, attempts: 3, backoff: { type: 'fixed', delay: 10000 } });
      logger.info('Overtime job scheduled', { bookingId, minutesUntil: Math.round(delay / 60000) });
    } catch (err) {
      logger.error('Failed to schedule overtime job', { bookingId, message: err.message });
    }
  },

  cancelOvertimeJob: async (bookingId) => {
    if (!useQueue || !overtimeQueue) return;
    try {
      const job = await overtimeQueue.getJob(`overtime-${bookingId}`);
      if (job) { await job.remove(); logger.info('Overtime job cancelled', { bookingId }); }
    } catch (err) {
      logger.error('Failed to cancel overtime job', { bookingId, message: err.message });
    }
  },

  scheduleOvertimeRecheckJob: async (bookingId, uniqueJobId, delayMs) => {
    if (!useQueue || !overtimeQueue) return;
    await overtimeQueue.add('overtime-check', { bookingId: bookingId.toString() }, { jobId: uniqueJobId, delay: delayMs, attempts: 2, backoff: { type: 'fixed', delay: 5000 } });
  },
};

export { connection };
