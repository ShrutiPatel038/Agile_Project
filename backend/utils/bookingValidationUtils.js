import User from '../models/User.js';

/**
 * Validates the requested booking time window.
 * Returns { valid: true } or { valid: false, message: string }.
 * Pure-ish — only uses the clock, no DB calls.
 */
export const validateBookingTimes = (startTime, endTime) => {
  const now = new Date();

  if (startTime < now) {
    return { valid: false, message: 'Cannot book in the past.' };
  }

  // Must be booked at least 30 minutes in advance
  const minLeadTime = new Date(now.getTime() + 30 * 60 * 1000);
  if (startTime < minLeadTime) {
    return { valid: false, message: 'Bookings must be made at least 30 minutes in advance.' };
  }

  const durationHours = (endTime - startTime) / (1000 * 60 * 60);
  if (durationHours < 1) {
    return { valid: false, message: 'Minimum booking duration is 1 hour.' };
  }
  if (durationHours > 168) {
    return { valid: false, message: 'Maximum booking duration is 7 days.' };
  }

  // Station operating hours: 6 AM – 11 PM
  const startHour = startTime.getHours();
  const endHour = endTime.getHours();
  const endMinutes = endTime.getMinutes();
  if (
    startHour < 6 ||
    startHour > 23 ||
    endHour < 6 ||
    (endHour > 23 && endMinutes > 0)
  ) {
    return { valid: false, message: 'Station operates from 6 AM to 11 PM only.' };
  }

  return { valid: true };
};

/**
 * Verifies the station has at least one assigned station master.
 * Returns { valid: true } or { valid: false, message: string }.
 */
export const validateStationManaged = async (stationId) => {
  const count = await User.countDocuments({ station: stationId, role: 'station-master' });
  if (count === 0) {
    return { valid: false, message: 'This station is currently unmanaged and not accepting bookings.' };
  }
  return { valid: true };
};

/**
 * Determines the payment deadline based on how far in advance the booking is.
 * - ≥ 12 hours ahead → 2-hour window
 * - < 12 hours ahead → 30-minute window
 */
export const calculatePaymentDeadline = (startTime) => {
  const now = new Date();
  const isAdvance = startTime.getTime() > now.getTime() + 12 * 60 * 60 * 1000;
  const windowMs = isAdvance ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000;
  return new Date(now.getTime() + windowMs);
};
