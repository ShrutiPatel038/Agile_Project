import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { queueService } from '../services/queueService.js';
import { createNotificationUtil } from '../controllers/notificationController.js';
import logger from '../utils/logger.js';

/**
 * Processes an overtime billing check for one booking.
 *
 * How it works:
 *  - When a ride goes active, queueService schedules a timer
 *    to fire exactly when (endTime + gracePeriod) elapses.
 *  - At that moment this:
 *      1. Calculates the first overtime charge
 *      2. Updates the booking total cost
 *      3. Notifies the user and station master
 *      4. Re-schedules itself to run again in 1 hour if ride is still active
 *  - When ride is completed or cancelled, the timer is cancelled via cancelOvertimeJob().
 */
export const processOvertimeCheck = async (bookingId) => {
    const now = new Date();
    logger.info('Overtime: checking booking', { bookingId });

    // Re-fetch fresh booking state
    const booking = await Booking.findById(bookingId).populate('user vehicle station');

    if (!booking) {
        logger.info('Overtime: booking not found, skipping', { bookingId });
        return;
    }

    // If ride is no longer active (completed/cancelled) stop processing
    if (booking.status !== 'active') {
        logger.info('Overtime: booking no longer active, no further checks', { bookingId, status: booking.status });
        return;
    }

    // Calculate how long the ride has been overdue
    const gracePeriodMs = (booking.overtimeCharges?.gracePeriodMinutes || 15) * 60 * 1000;
    const endTimeWithGrace = new Date(booking.endTime.getTime() + gracePeriodMs);

    if (now <= endTimeWithGrace) {
        // Still within grace period (edge case: timer fired slightly early)
        logger.info('Overtime: still in grace period, skipping charges', { bookingId });
        return;
    }

    // Calculate overtime duration
    const overtimeMs = now.getTime() - endTimeWithGrace.getTime();
    const overtimeHours = Math.ceil(overtimeMs / (1000 * 60 * 60)); // Round up to nearest hour

    const overtimeRate = booking.overtimeCharges?.overtimeRate ||
        (booking.vehicle.pricePerHour * 1.5);
    const overtimeCost = overtimeHours * overtimeRate;

    const previousOvertimeHours = booking.overtimeCharges?.overtimeHours || 0;
    const previousOvertimeCost = booking.overtimeCharges?.overtimeCost || 0;

    // Recalculate base cost (idempotent - same formula every run)
    const plannedDurationHours = Math.max(
        0,
        (new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime()) / (1000 * 60 * 60)
    );
    const plannedBaseCost = (plannedDurationHours * booking.vehicle.pricePerHour) + (booking.oneWayFee || 0);

    // Update overtime fields
    booking.overtimeCharges.isOvertime = true;
    booking.overtimeCharges.overtimeHours = overtimeHours;
    booking.overtimeCharges.overtimeCost = overtimeCost;
    booking.overtimeCharges.lastCalculatedAt = now;
    booking.totalCost = plannedBaseCost + overtimeCost;
    await booking.save();

    const overtimeChanged = previousOvertimeHours !== overtimeHours || previousOvertimeCost !== overtimeCost;

    if (overtimeChanged) {
        // Notify the user
        await createNotificationUtil(
            booking.user._id,
            'Overtime Charges Applied',
            `Your ride is ${overtimeHours} hour(s) overdue. ₹${overtimeCost} overtime charges have been added. Please return the vehicle immediately to avoid further charges.`,
            'reminder',
            'urgent',
            {},
            global.io
        );

        // Notify station master
        const stationMaster = await User.findOne({
            station: booking.station._id,
            role: 'station-master'
        });

        if (stationMaster) {
            await createNotificationUtil(
                stationMaster._id,
                'Overdue Ride - Overtime Charges Applied',
                `${booking.user.name}'s ride with ${booking.vehicle.modelName} is ${overtimeHours}h overdue. ₹${overtimeCost} overtime charges applied.`,
                'reminder',
                'high',
                {},
                global.io
            );
        }

        logger.info('Overtime charge applied', { bookingId, overtimeHours, overtimeCost });
    }

    // Re-schedule itself to run again in 1 hour to accumulate further overtime.
    // Ongoing re-checks stop by checking booking.status === 'active' at the top.
    try {
        const ONE_HOUR_MS = 60 * 60 * 1000;
        const nextJobId = `overtime-${bookingId}-rechk-${Date.now()}`;
        await queueService.scheduleOvertimeRecheckJob(bookingId, nextJobId, ONE_HOUR_MS);
        logger.info('Overtime re-check scheduled in 1 hour', { bookingId });
    } catch (rescheduleErr) {
        logger.warn('Could not re-schedule overtime check', { bookingId, message: rescheduleErr.message });
    }
};

export const startOvertimeWorker = () => {
    logger.info('Overtime worker ready (in-process timers)');
};
