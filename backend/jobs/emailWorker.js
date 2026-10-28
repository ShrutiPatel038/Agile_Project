import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const startEmailWorker = () => {
  let connection;
  try {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 2) { logger.warn('Redis unavailable for Email Worker. Worker disabled.'); return null; }
        return 1000;
      },
    });

    connection.on('error', () => {});
    connection.on('connect', () => {
      const worker = new Worker('emails', async (job) => {
        if (job.name === 'booking-confirmation') {
          const { booking, user } = job.data;
          await sendBookingConfirmationEmail(booking, user);
        }
      }, { connection, concurrency: 2 });

      worker.on('completed', (job) => logger.info('Email job completed', { jobId: job.id }));
      worker.on('failed', (job, err) => logger.error('Email job failed', { jobId: job?.id, message: err.message }));
      logger.info('Email worker listening to "emails" queue');
    });
  } catch (error) {
    logger.warn('Failed to init Email Worker', { message: error.message });
  }
};
