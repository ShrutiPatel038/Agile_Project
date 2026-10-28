import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import Station from '../models/Station.js';
import logger from '../utils/logger.js';

// queueService / sendBookingConfirmationEmail added in Sprint 3
let queueService = null;
const getQueue = async () => {
  if (!queueService) {
    try { ({ queueService } = await import('../services/queueService.js')); } catch { /* not yet wired */ }
  }
  return queueService;
};

export const getPendingBookings = async (req, res) => {
  try {
    const stationFilter = req.user.role === 'super-admin' ? {} : { station: req.user.station };
    const bookings = await Booking.find({ ...stationFilter, status: 'pending-approval' })
      .populate('user', 'name email')
      .populate('vehicle', 'modelName');
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching pending bookings', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('user vehicle station');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const newStatus = req.body.status;
    const qs = await getQueue();

    if (newStatus === 'cancelled') {
      if (booking.status === 'completed') return res.status(400).json({ message: 'Cannot cancel a completed ride' });
      booking.status = 'cancelled';
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available', availableAfter: null });
      if (qs) {
        await qs.cancelPaymentTimeoutJob(booking._id.toString());
        await qs.cancelOvertimeJob(booking._id.toString());
      }
    } else if (newStatus === 'active' && booking.status === 'confirmed') {
      if (booking.paymentStatus !== 'completed') {
        return res.status(400).json({ message: 'Payment must be completed before starting the ride' });
      }
      booking.status = 'active';
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'in-use' });
      if (qs) {
        const gracePeriod = booking.overtimeCharges?.gracePeriodMinutes || 15;
        await qs.scheduleOvertimeJob(booking._id.toString(), booking.endTime, gracePeriod);
      }
    } else if (newStatus === 'completed' && booking.status === 'active') {
      booking.status = 'completed';
      await Vehicle.findByIdAndUpdate(booking.vehicle, { status: 'available', availableAfter: null });
      if (qs) await qs.cancelOvertimeJob(booking._id.toString());
    } else {
      return res.status(400).json({ message: `Invalid status transition from ${booking.status} to ${newStatus}` });
    }

    await booking.save();
    logger.info('Booking status updated', { bookingId: booking._id, newStatus });

    // Real-time notifications via Socket.IO (wired in Sprint 3)
    if (req.io) {
      const userId = booking.user._id.toString();
      const stationId = booking.station._id.toString();
      req.io.to(userId).emit('notification', { title: `Booking ${newStatus}`, type: 'booking', priority: 'medium' });
      req.io.to(`station_${stationId}`).emit('dashboard_refresh', { message: 'A booking was updated at your station.' });
      req.io.to('super_admin_room').emit('dashboard_refresh', { message: 'A booking was updated.' });
    }

    res.json({ message: `Booking status updated to ${newStatus}` });
  } catch (error) {
    logger.error('Error updating booking status', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addVehicleToStation = async (req, res) => {
  try {
    const { modelName, imageUrl, pricePerHour, stationId: stationFromRequest } = req.body;
    const station = req.user.role === 'super-admin' ? stationFromRequest : req.user.station;
    if (!station) return res.status(400).json({ message: 'Station ID is required' });
    const vehicle = await Vehicle.create({ modelName, imageUrl, pricePerHour, station });
    logger.info('Vehicle added via station master', { vehicleId: vehicle._id, station });
    res.status(201).json(vehicle);
  } catch (error) {
    logger.error('Error adding vehicle', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const stationId = req.user.station;
    if (!stationId) return res.status(400).json({ message: 'User is not assigned to a station.' });

    const now = new Date();
    const [station, vehicles, confirmedBookings, activeRides] = await Promise.all([
      Station.findById(stationId).lean(),
      Vehicle.find({ station: stationId }).lean(),
      Booking.find({ station: stationId, status: 'confirmed' }).populate('user', 'name email').populate('vehicle', 'modelName').lean(),
      Booking.find({ station: stationId, status: 'active' }).populate('user', 'name email').populate('vehicle', 'modelName').lean(),
    ]);

    if (!station) return res.status(404).json({ message: 'Assigned station not found.' });

    const activeRidesWithOverdue = activeRides.map((r) => ({ ...r, isOverdue: new Date(r.endTime) < now }));

    res.json({
      stationName: station.name,
      stats: {
        totalVehicles: vehicles.length,
        availableVehicles: vehicles.filter((v) => v.status === 'available').length,
        confirmedBookingsCount: confirmedBookings.length,
        activeRidesCount: activeRides.length,
        overdueRidesCount: activeRidesWithOverdue.filter((r) => r.isOverdue).length,
      },
      vehicles,
      confirmedBookings,
      activeRides: activeRidesWithOverdue,
    });
  } catch (error) {
    logger.error('Dashboard data fetch error', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};
