import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import logger from '../utils/logger.js';
import { calculateBookingCost } from '../utils/pricingUtils.js';
import { validateBookingTimes, validateStationManaged, calculatePaymentDeadline } from '../utils/bookingValidationUtils.js';

// queueService imported lazily to avoid startup crash when Redis is absent (added in Sprint 3)
let queueService = null;
const getQueue = async () => {
  if (!queueService) {
    try { ({ queueService } = await import('../services/queueService.js')); } catch { /* queue not yet wired */ }
  }
  return queueService;
};

export const createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { vehicleId, stationId, startTime, endTime, emergencyContacts, returnStationId } = req.body;
    if (!vehicleId || !stationId || !startTime || !endTime) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: 'Missing required booking details.' });
    }

    const requestedStart = new Date(startTime);
    const requestedEnd   = new Date(endTime);

    const timeValidation = validateBookingTimes(requestedStart, requestedEnd);
    if (!timeValidation.valid) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: timeValidation.message });
    }

    const stationValidation = await validateStationManaged(stationId);
    if (!stationValidation.valid) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: stationValidation.message });
    }

    const vehicle = await Vehicle.findById(vehicleId).session(session);
    if (!vehicle) {
      await session.abortTransaction(); session.endSession();
      return res.status(404).json({ message: 'Vehicle not found.' });
    }

    let pricing;
    try {
      pricing = calculateBookingCost(vehicle, requestedStart, requestedEnd, stationId, returnStationId);
    } catch (err) {
      await session.abortTransaction(); session.endSession();
      return res.status(400).json({ message: err.message });
    }

    // Atomic conflict check inside the transaction
    const conflict = await Booking.findOne({
      vehicle: vehicleId,
      status: { $ne: 'cancelled' },
      startTime: { $lt: requestedEnd },
      endTime:   { $gt: requestedStart },
    }).session(session);

    if (conflict) {
      await session.abortTransaction(); session.endSession();
      return res.status(409).json({ message: 'Sorry, this vehicle is not available for the selected time slot. It may have just been booked by another user.' });
    }

    const paymentDeadline = calculatePaymentDeadline(requestedStart);
    const returnStation = returnStationId && returnStationId !== stationId.toString() ? returnStationId : stationId;

    const [booking] = await Booking.create([{
      user:     req.user._id,
      vehicle:  vehicleId,
      station:  stationId,
      returnStation,
      oneWayFee: pricing.oneWayFee,
      startTime: requestedStart,
      endTime:   requestedEnd,
      originalEndTime: requestedEnd,
      totalCost: pricing.totalCost,
      status: 'confirmed',
      paymentDeadline,
      emergencyContacts: emergencyContacts || [],
      securityDeposit: { amount: pricing.securityDeposit, status: 'pending' },
      overtimeCharges: { overtimeRate: pricing.overtimeRate, gracePeriodMinutes: 15 },
    }], { session });

    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'reserved' }, { session });
    await session.commitTransaction();
    session.endSession();

    logger.info('Booking created', { bookingId: booking._id, userId: req.user._id, vehicleId, totalCost: pricing.totalCost });

    // Schedule payment timeout job (BullMQ wired in Sprint 3)
    const qs = await getQueue();
    if (qs) await qs.schedulePaymentTimeoutJob(booking._id, paymentDeadline);

    // Notify station master dashboard via Socket.IO (wired in Sprint 3)
    if (req.io) req.io.to(`station_${stationId}`).emit('dashboard_refresh', { message: 'New booking request received' });

    res.status(201).json(booking);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    logger.error('Error creating booking', { message: error.message, stack: error.stack });
    res.status(500).json({ message: 'Server Error creating booking' });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('vehicle', 'modelName imageUrl')
      .populate('station', 'name')
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching bookings' });
  }
};

export const getVehicleAvailability = async (req, res) => {
  try {
    const bookings = await Booking.find({
      vehicle: req.params.vehicleId,
      status: { $in: ['pending-confirmation', 'confirmed', 'active'] },
    }).select('startTime endTime');
    res.json({ bookedSlots: bookings.map((b) => ({ start: b.startTime, end: b.endTime })) });
  } catch (error) {
    logger.error('Error fetching vehicle availability', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching availability' });
  }
};

export const modifyBooking = async (req, res) => {
  try {
    const { newEndTime, type } = req.body;
    const booking = await Booking.findById(req.params.bookingId).populate('vehicle');
    if (!booking || booking.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    if (!['pending-confirmation', 'confirmed', 'active'].includes(booking.status)) {
      return res.status(400).json({ message: 'Cannot modify completed or cancelled bookings' });
    }

    const newEnd = new Date(newEndTime);
    const oldEnd = booking.endTime;
    const now    = new Date();

    if (booking.status === 'active' && newEnd <= now) {
      return res.status(400).json({ message: 'Extension must be in the future' });
    }

    const conflict = await Booking.findOne({
      vehicle: booking.vehicle._id,
      _id: { $ne: booking._id },
      status: { $ne: 'cancelled' },
      startTime: { $lt: newEnd },
      endTime:   { $gt: booking.startTime },
    });
    if (conflict) return res.status(409).json({ message: 'Time slot not available for modification' });

    const oldDuration = (oldEnd - booking.startTime) / (1000 * 60 * 60);
    const newDuration = (newEnd - booking.startTime) / (1000 * 60 * 60);
    const additionalCost = (newDuration - oldDuration) * booking.vehicle.pricePerHour;

    booking.endTime   = newEnd;
    booking.totalCost += additionalCost;
    booking.modifications.push({ type, oldEndTime: oldEnd, newEndTime: newEnd, additionalCost });

    if (booking.status === 'active' && type === 'extend') {
      booking.paymentStatus  = 'pending';
      booking.paymentDeadline = new Date(now.getTime() + 10 * 60 * 1000);
    }
    await booking.save();

    logger.info('Booking modified', { bookingId: booking._id, type, additionalCost });
    res.json({ message: 'Booking modified successfully', additionalCost, requiresPayment: booking.status === 'active' && type === 'extend', paymentDeadline: booking.paymentDeadline });
  } catch (error) {
    logger.error('Error modifying booking', { message: error.message });
    res.status(500).json({ message: 'Server Error modifying booking' });
  }
};

export const getUserAnalytics = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id }).populate('vehicle');
    const totalBookings = bookings.length;
    const totalSpent    = bookings.reduce((s, b) => s + (b.totalCost || 0), 0);
    const totalHours    = bookings.reduce((s, b) => s + (b.endTime - b.startTime) / (1000 * 60 * 60), 0);

    const vehicleCount = {};
    bookings.forEach((b) => {
      const id = b.vehicle._id.toString();
      vehicleCount[id] = (vehicleCount[id] || 0) + 1;
    });
    const topVehicles = Object.entries(vehicleCount)
      .sort(([, a], [, b]) => b - a).slice(0, 5)
      .map(([id, count]) => {
        const b = bookings.find((x) => x.vehicle._id.toString() === id);
        return { _id: id, modelName: b.vehicle.modelName, bookingCount: count };
      });

    const monthlySpending = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const start = new Date(d.getFullYear(), d.getMonth(), 1);
      const end   = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const amount = bookings
        .filter((b) => { const dt = new Date(b.createdAt); return dt >= start && dt <= end; })
        .reduce((s, b) => s + (b.totalCost || 0), 0);
      monthlySpending.push({ month: d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }), amount });
    }

    res.json({ totalBookings, totalSpent, totalHours: Math.round(totalHours), avgRating: 4.2, topVehicles, monthlySpending });
  } catch (error) {
    logger.error('Error fetching user analytics', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching analytics' });
  }
};
