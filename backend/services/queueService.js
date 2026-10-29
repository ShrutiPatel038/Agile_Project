import { sendBookingConfirmationEmail } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

// Delayed jobs run on in-process timers.
// Timers are lost on restart; the cron watchdogs in jobs/ cover that gap.
const timers = new Map();

// setTimeout overflows above ~24.8 days; longer delays are left to the cron watchdogs.
const MAX_TIMER_DELAY = 2 ** 31 - 1;

const scheduleTimer = (jobId, delay, run) => {
    cancelTimer(jobId);
    if (delay > MAX_TIMER_DELAY) {
        logger.warn('Job delay too long for in-process timer, relying on cron watchdog', { jobId });
        return false;
    }
    const handle = setTimeout(async () => {
        timers.delete(jobId);
        try {
            await run();
            logger.info('Job completed', { jobId });
        } catch (err) {
            logger.error('Job failed', { jobId, message: err.message });
        }
    }, delay);
    timers.set(jobId, handle);
    return true;
};

const cancelTimer = (jobId) => {
    const handle = timers.get(jobId);
    if (!handle) return false;
    clearTimeout(handle);
    timers.delete(jobId);
    return true;
};

// Workers are imported lazily: overtimeWorker imports this module for re-checks.
const runPaymentTimeout = async (bookingId) => {
    const { processPaymentTimeout } = await import('../jobs/paymentTimeoutWorker.js');
    await processPaymentTimeout(bookingId);
};

const runOvertimeCheck = async (bookingId) => {
    const { processOvertimeCheck } = await import('../jobs/overtimeWorker.js');
    await processOvertimeCheck(bookingId);
};

export const queueService = {
    /**
     * Send the booking confirmation email (inline, no queue)
     */
    addEmailJob: async (booking, user) => {
        logger.info('Sending booking confirmation email', { bookingId: booking?._id?.toString() });
        await sendBookingConfirmationEmail(booking, user);
    },

    /**
     * Schedule a payment timeout check at the exact paymentDeadline.
     * @param {string} bookingId
     * @param {Date} paymentDeadline
     */
    schedulePaymentTimeoutJob: async (bookingId, paymentDeadline) => {
        const delay = new Date(paymentDeadline).getTime() - Date.now();
        if (delay <= 0) {
            logger.warn('Payment deadline already passed, skipping timeout job', { bookingId: bookingId.toString() });
            return;
        }

        const jobId = `payment-timeout-${bookingId}`;
        if (scheduleTimer(jobId, delay, () => runPaymentTimeout(bookingId.toString()))) {
            logger.info('Payment timeout job scheduled', { bookingId: bookingId.toString(), minutes: Math.round(delay / 60000) });
        }
    },

    /**
     * Cancel the payment timeout job for a booking (e.g. when payment succeeds).
     * @param {string} bookingId
     */
    cancelPaymentTimeoutJob: async (bookingId) => {
        if (cancelTimer(`payment-timeout-${bookingId}`)) {
            logger.info('Payment timeout job cancelled (payment received)', { bookingId: bookingId.toString() });
        }
    },

    /**
     * Schedule an overtime check at the moment the grace period ends.
     * @param {string} bookingId
     * @param {Date} endTime - The booking's scheduled end time
     * @param {number} gracePeriodMinutes - Grace period in minutes (default: 15)
     */
    scheduleOvertimeJob: async (bookingId, endTime, gracePeriodMinutes = 15) => {
        // Fire at endTime + gracePeriod (the first moment overtime officially starts)
        const fireAt = new Date(endTime).getTime() + (gracePeriodMinutes * 60 * 1000);
        const delay = Math.max(fireAt - Date.now(), 100); // minimum 100ms delay

        const jobId = `overtime-${bookingId}`;
        if (scheduleTimer(jobId, delay, () => runOvertimeCheck(bookingId.toString()))) {
            logger.info('Overtime job scheduled', { bookingId: bookingId.toString(), minutes: Math.round(delay / 60000) });
        }
    },

    /**
     * Cancel the overtime job for a booking (e.g. when ride is completed or cancelled).
     * @param {string} bookingId
     */
    cancelOvertimeJob: async (bookingId) => {
        if (cancelTimer(`overtime-${bookingId}`)) {
            logger.info('Overtime job cancelled (ride ended)', { bookingId: bookingId.toString() });
        }
    },

    /**
     * Internal: re-schedule an overtime re-check from the worker itself (hourly accumulation).
     * @param {string} bookingId
     * @param {string} uniqueJobId - A unique ID for this recheck job
     * @param {number} delayMs - Delay in milliseconds
     */
    scheduleOvertimeRecheckJob: async (bookingId, uniqueJobId, delayMs) => {
        scheduleTimer(uniqueJobId, delayMs, () => runOvertimeCheck(bookingId.toString()));
    }
};
