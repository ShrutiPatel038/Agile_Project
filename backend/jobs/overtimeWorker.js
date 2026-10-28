import { Worker } from 'bullmq';
import Redis from 'ioredis';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { queueService } from '../services/queueService.js';
import { createNotificationUtil } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

export const startOvertimeWorker = () => {
  let connection;
  try {
    connection = new Redis(REDIS_URL, {
      maxRetriesPerRequest: null,
      connectTimeout: 2000,
      retryStrategy: (times) => {
        if (times > 2) { logger.warn('Redis unavailable for Overtime Worker.'); return null; }
        return 1000;
      },
    });

    connection.on('error', () => {});
    connection.on('connect', () => {
      const worker = new Worker('overtime', async (job) => {
        const { bookingId } = job.data;
        const now = new Date();
        const booking = await Booking.findById(bookingId).populate('user vehicle station');
        if (!booking)                      { logger.info('Overtime job: booking not found', { bookingId }); return; }
        if (booking.status !== 'active')   { logger.info('Overtime job: booking no longer active', { bookingId, status: booking.status }); return; }

        const gracePeriodMs    = (booking.overtimeCharges?.gracePeriodMinutes || 15) * 60 * 1000;
        const endTimeWithGrace = new Date(booking.endTime.getTime() + gracePeriodMs);
        if (now <= endTimeWithGrace) return;

        const overtimeMs    = now.getTime() - endTimeWithGrace.getTime();
        const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60));
        const overtimeRate  = booking.overtimeCharges?.overtimeRate || (booking.vehicle.pricePerHour * 1.5);
        const overtimeCost  = overtimeHours * overtimeRate;

        const prevHours = booking.overtimeCharges?.overtimeHours || 0;
        const prevCost  = booking.overtimeCharges?.overtimeCost  || 0;

        const plannedHours = Math.max(0, (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60));
        const baseCost     = plannedHours * booking.vehicle.pricePerHour + (booking.oneWayFee || 0);

        booking.overtimeCharges.isOvertime       = true;
        booking.overtimeCharges.overtimeHours    = overtimeHours;
        booking.overtimeCharges.overtimeCost     = overtimeCost;
        booking.overtimeCharges.lastCalculatedAt = now;
        booking.totalCost = baseCost + overtimeCost;
        await booking.save();

        if (prevHours !== overtimeHours || prevCost !== overtimeCost) {
          await createNotificationUtil(booking.user._id, 'Overtime Charges Applied', `Your ride is ${overtimeHours} hour(s) overdue. ₹${overtimeCost} overtime charges added.`, 'reminder', 'urgent', {}, global.io);
          const sm = await User.findOne({ station: booking.station._id, role: 'station-master' });
          if (sm) await createNotificationUtil(sm._id, 'Overdue Ride', `${booking.user.name}'s ride (${booking.vehicle.modelName}) is ${overtimeHours}h overdue. ₹${overtimeCost} overtime applied.`, 'reminder', 'high', {}, global.io);
          logger.info('Overtime charges applied', { bookingId, overtimeHours, overtimeCost });
        }

        // Re-schedule to accumulate further overtime hourly
        try {
          await queueService.scheduleOvertimeRecheckJob(bookingId, `overtime-${bookingId}-rechk-${Date.now()}`, 60 * 60 * 1000);
        } catch (err) {
          logger.warn('Could not re-schedule overtime recheck', { bookingId, message: err.message });
        }
      }, { connection, concurrency: 5 });

      worker.on('completed', (job) => logger.info('Overtime job completed', { jobId: job.id }));
      worker.on('failed', (job, err) => logger.error('Overtime job failed', { jobId: job?.id, message: err.message }));
      logger.info('Overtime worker listening to "overtime" queue');
    });
  } catch (error) {
    logger.warn('Failed to init Overtime Worker', { message: error.message });
  }
};
