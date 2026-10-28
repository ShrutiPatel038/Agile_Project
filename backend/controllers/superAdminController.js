import Station from '../models/Station.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { createNotificationUtil } from '../controllers/notificationController.js';
import SupportTicket from '../models/SupportTicket.js';
import { cacheService } from '../services/cacheService.js';
import logger from '../utils/logger.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, path.join(__dirname, '../images'));
  },
  filename: (req, file, cb) => {
    const base = (req.body.modelName || 'vehicle').toLowerCase().replace(/\s+/g, '-');
    cb(null, `${base}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

export const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── Stations ─────────────────────────────────────────────────────────────────

export const createStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Name and location are required' });

    const exists = await Station.findOne({ name });
    if (exists) return res.status(400).json({ message: 'A station with this name already exists.' });

    const station = await Station.create({ name, location });
    await cacheService.del('public:stations');
    logger.info('Station created, cache evicted', { stationId: station._id, name });

    const superAdmins = await User.find({ role: 'super-admin' });
    for (const admin of superAdmins) {
      if (admin._id.toString() !== req.user._id.toString()) {
        await createNotificationUtil(admin._id, 'New Station Created', `${name} station has been created at ${location}.`, 'system', 'medium');
      }
    }

    res.status(201).json(station);
  } catch (error) {
    logger.error('Error creating station', { message: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

export const getAllStations = async (_req, res) => {
  try {
    const stations = await Station.find({});
    res.json(stations);
  } catch (error) {
    logger.error('Error fetching all stations', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getStationDetails = async (req, res) => {
  try {
    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const [master, vehicles, bookings] = await Promise.all([
      User.findOne({ station: req.params.id, role: 'station-master' }).select('name email'),
      Vehicle.find({ station: req.params.id }),
      Booking.find({ station: req.params.id }).populate('user', 'name email').populate('vehicle', 'modelName'),
    ]);

    const availableVehicles = vehicles.filter((v) => v.status === 'available').length;
    const activeRides = bookings.filter((b) => b.status === 'active').length;
    const totalRevenue = bookings
      .filter((b) => b.status === 'completed')
      .reduce((acc, b) => acc + (b.totalCost || 0), 0);

    res.json({
      station,
      stats: { stationMaster: master, totalVehicles: vehicles.length, availableVehicles, activeRides, totalRevenue: totalRevenue.toFixed(2) },
      vehicles,
      bookings,
    });
  } catch (error) {
    logger.error('Error in getStationDetails', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getStationOverview = async (req, res) => {
  try {
    const { sortBy = 'name', sortOrder = 'asc', status, vehicleCount, minRevenue, maxRevenue } = req.query;

    const [stations, masters] = await Promise.all([
      Station.find({}).lean(),
      User.find({ role: 'station-master' }).select('name station').lean(),
    ]);

    const masterMap = masters.reduce((acc, m) => {
      if (m.station) acc[m.station.toString()] = m.name;
      return acc;
    }, {});

    const [vehicleStats, bookingStats] = await Promise.all([
      Vehicle.aggregate([
        { $group: { _id: '$station', totalVehicles: { $sum: 1 }, availableVehicles: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } },
      ]),
      Booking.aggregate([
        { $group: { _id: '$station', activeRides: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } }, totalRevenue: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalCost', 0] } } } },
      ]),
    ]);

    const vMap = vehicleStats.reduce((acc, i) => { acc[i._id] = i; return acc; }, {});
    const bMap = bookingStats.reduce((acc, i) => { acc[i._id] = i; return acc; }, {});

    let result = stations.map((s) => {
      const id = s._id.toString();
      const v = vMap[id] || { totalVehicles: 0, availableVehicles: 0 };
      const b = bMap[id] || { activeRides: 0, totalRevenue: 0 };
      return { ...s, stats: { stationMaster: { name: masterMap[id] || null }, totalVehicles: v.totalVehicles, availableVehicles: v.availableVehicles, activeRides: b.activeRides, totalRevenue: b.totalRevenue } };
    });

    if (status === 'managed') result = result.filter((s) => s.stats.stationMaster.name);
    else if (status === 'unmanaged') result = result.filter((s) => !s.stats.stationMaster.name);
    if (vehicleCount === '0') result = result.filter((s) => s.stats.totalVehicles === 0);
    else if (vehicleCount === '1-5') result = result.filter((s) => s.stats.totalVehicles >= 1 && s.stats.totalVehicles <= 5);
    else if (vehicleCount === '6-10') result = result.filter((s) => s.stats.totalVehicles >= 6 && s.stats.totalVehicles <= 10);
    else if (vehicleCount === '10+') result = result.filter((s) => s.stats.totalVehicles > 10);
    if (minRevenue || maxRevenue) {
      result = result.filter((s) => {
        const r = s.stats.totalRevenue;
        if (minRevenue && r < parseFloat(minRevenue)) return false;
        if (maxRevenue && r > parseFloat(maxRevenue)) return false;
        return true;
      });
    }

    result.sort((a, b) => {
      let av, bv;
      if (sortBy === 'name') { av = a.name; bv = b.name; }
      else if (sortBy === 'totalVehicles') { av = a.stats.totalVehicles; bv = b.stats.totalVehicles; }
      else if (sortBy === 'totalRevenue') { av = a.stats.totalRevenue; bv = b.stats.totalRevenue; }
      else if (sortBy === 'activeRides') { av = a.stats.activeRides; bv = b.stats.activeRides; }
      if (typeof av === 'string') return sortOrder === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortOrder === 'asc' ? av - bv : bv - av;
    });

    res.json(result);
  } catch (error) {
    logger.error('Error in getStationOverview', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateStation = async (req, res) => {
  try {
    const { name, location } = req.body;
    if (!name || !location) return res.status(400).json({ message: 'Name and location are required' });

    const station = await Station.findById(req.params.id);
    if (!station) return res.status(404).json({ message: 'Station not found' });

    const duplicate = await Station.findOne({ name, _id: { $ne: req.params.id } });
    if (duplicate) return res.status(400).json({ message: 'Another station with this name already exists.' });

    station.name = name;
    station.location = location;
    await station.save();

    await cacheService.del('public:stations');
    logger.info('Station updated, cache evicted', { stationId: station._id });

    res.json(station);
  } catch (error) {
    logger.error('Error updating station', { message: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

// ── Vehicles ──────────────────────────────────────────────────────────────────

export const addVehicle = async (req, res) => {
  const { modelName, pricePerHour, stationId } = req.body;
  const imageUrl = req.file ? `/images/${req.file.filename}` : null;

  if (!modelName || !imageUrl || !pricePerHour || !stationId) {
    return res.status(400).json({ message: 'All fields including image are required' });
  }

  try {
    const vehicle = await Vehicle.create({ modelName, imageUrl, pricePerHour, station: stationId });

    const [station, stationMasters] = await Promise.all([
      Station.findById(stationId),
      User.find({ station: stationId, role: 'station-master' }),
    ]);

    for (const master of stationMasters) {
      await createNotificationUtil(master._id, 'New Vehicle Added', `${modelName} has been added to ${station?.name ?? stationId} by administration.`, 'system', 'medium');
    }

    logger.info('Vehicle added', { vehicleId: vehicle._id, stationId });
    res.status(201).json(vehicle);
  } catch (error) {
    logger.error('Error adding vehicle', { message: error.message });
    res.status(500).json({ message: 'Server error adding vehicle' });
  }
};

export const getAllVehicles = async (req, res) => {
  try {
    const { sortBy = 'modelName', sortOrder = 'asc', status, station, minPrice, maxPrice } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (station) filter.station = station;
    if (minPrice || maxPrice) {
      filter.pricePerHour = {};
      if (minPrice) filter.pricePerHour.$gte = parseFloat(minPrice);
      if (maxPrice) filter.pricePerHour.$lte = parseFloat(maxPrice);
    }
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const vehicles = await Vehicle.find(filter).populate('station', 'name').sort(sort);
    res.json(vehicles);
  } catch (error) {
    logger.error('Error fetching all vehicles', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching vehicles.' });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { modelName, pricePerHour } = req.body;
    const vehicle = await Vehicle.findById(req.params.vehicleId);
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    if (modelName) vehicle.modelName = modelName;
    if (pricePerHour) vehicle.pricePerHour = pricePerHour;
    if (req.file) vehicle.imageUrl = `/images/${req.file.filename}`;

    await vehicle.save();
    logger.info('Vehicle updated', { vehicleId: vehicle._id });
    res.json(vehicle);
  } catch (error) {
    logger.error('Error updating vehicle', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.vehicleId).populate('station');
    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

    const active = await Booking.findOne({ vehicle: req.params.vehicleId, status: { $in: ['active', 'confirmed', 'pending-confirmation'] } });
    if (active) return res.status(400).json({ message: 'Cannot delete vehicle that is part of an active or upcoming booking.' });

    const masters = await User.find({ station: vehicle.station?._id, role: 'station-master' });
    for (const master of masters) {
      await createNotificationUtil(master._id, 'Vehicle Removed', `${vehicle.modelName} has been removed from ${vehicle.station?.name ?? ''} by administration.`, 'system', 'medium');
    }

    await Vehicle.findByIdAndDelete(req.params.vehicleId);
    logger.info('Vehicle deleted', { vehicleId: req.params.vehicleId });
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    logger.error('Error deleting vehicle', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

// ── Station Masters ───────────────────────────────────────────────────────────

export const getAllStationMasters = async (_req, res) => {
  try {
    const masters = await User.find({ role: 'station-master' }).populate('station', 'name').select('name email station');
    res.json(masters);
  } catch (error) {
    logger.error('Error fetching station masters', { message: error.message });
    res.status(500).json({ message: 'Server error' });
  }
};

export const createStationMaster = async (req, res) => {
  try {
    const { name, email, password, stationId } = req.body;
    if (!name || !email || !password || !stationId) return res.status(400).json({ message: 'All fields are required.' });

    const masterCount = await User.countDocuments({ station: stationId, role: 'station-master' });
    if (masterCount >= 3) return res.status(409).json({ message: 'This station already has the maximum of 3 masters assigned.' });

    const emailExists = await User.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'An account with this email already exists.' });

    const newMaster = await User.create({ name, email, password, role: 'station-master', station: stationId });
    const station = await Station.findById(stationId);

    await createNotificationUtil(newMaster._id, 'Welcome to Station Management', `You have been assigned as Station Master for ${station?.name ?? stationId}. Welcome to the team!`, 'system', 'high');

    const superAdmins = await User.find({ role: 'super-admin' });
    for (const admin of superAdmins) {
      if (admin._id.toString() !== req.user._id.toString()) {
        await createNotificationUtil(admin._id, 'New Station Master Assigned', `${name} has been assigned as Station Master for ${station?.name ?? stationId}.`, 'system', 'medium');
      }
    }

    logger.info('Station master created', { masterId: newMaster._id, stationId });
    res.status(201).json({ message: 'Station Master account created successfully.' });
  } catch (error) {
    logger.error('Error creating station master', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateStationMaster = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findById(req.params.id);

    if (!user || user.role !== 'station-master') return res.status(404).json({ message: 'Station Master not found.' });

    if (email && email !== user.email) {
      const taken = await User.findOne({ email });
      if (taken) return res.status(400).json({ message: 'This email is already in use by another account.' });
    }

    const emailChanged = email && email !== user.email;
    if (name) user.name = name;
    if (email) user.email = email;
    await user.save();

    // Force logout via Socket.IO if email changed (req.io available after Sprint 3 Socket.IO setup)
    if (emailChanged && req.io) {
      req.io.to(user._id.toString()).emit('force_logout', {
        message: 'Your account details have been updated by an administrator. Please log in again with your new credentials.',
      });
    }

    logger.info('Station master updated', { masterId: user._id, emailChanged });
    res.json(user);
  } catch (error) {
    logger.error('Error updating station master', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const removeStationMaster = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user || user.role !== 'station-master') return res.status(404).json({ message: 'Station Master not found.' });

    const stationId = user.station;
    await User.findByIdAndDelete(req.params.userId);

    logger.info('Station master removed', { userId: req.params.userId, stationId });
    res.json({ message: 'Station Master removed successfully.' });
  } catch (error) {
    logger.error('Error removing station master', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const calculateAndCacheSystemAnalytics = async () => {
  const cacheKey = 'super_admin_analytics';

  const [revenueStats, totalVehicles, activeRentals, loyaltyDistribution, topStations, monthlyRevenue, ticketCounts] = await Promise.all([
    Booking.aggregate([{ $match: { paymentStatus: 'completed' } }, { $group: { _id: null, totalRevenue: { $sum: '$totalCost' }, averageCost: { $avg: '$totalCost' }, totalBookings: { $sum: 1 } } }]),
    Vehicle.countDocuments({}),
    Booking.countDocuments({ status: 'active' }),
    User.aggregate([{ $group: { _id: '$loyaltyTier', count: { $sum: 1 } } }]),
    Booking.aggregate([{ $match: { paymentStatus: 'completed' } }, { $group: { _id: '$station', revenue: { $sum: '$totalCost' }, bookingsCount: { $sum: 1 } } }, { $sort: { revenue: -1 } }, { $limit: 5 }]),
    Booking.aggregate([{ $match: { paymentStatus: 'completed' } }, { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, revenue: { $sum: '$totalCost' }, count: { $sum: 1 } } }, { $sort: { '_id.year': 1, '_id.month': 1 } }, { $limit: 12 }]),
    Promise.all([SupportTicket.countDocuments({}), SupportTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } })]),
  ]);

  const populatedTopStations = await Station.populate(topStations, { path: '_id', select: 'name address' });
  const formattedTopStations = populatedTopStations.map(i => ({ stationId: i._id?._id || null, name: i._id?.name || 'Unknown', revenue: i.revenue || 0, bookingsCount: i.bookingsCount || 0 }));
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const formattedMonthly = monthlyRevenue.map(i => ({ label: `${monthNames[i._id.month-1]} ${i._id.year}`, revenue: i.revenue || 0, bookingsCount: i.count || 0 }));
  const revData = revenueStats[0] || { totalRevenue: 0, averageCost: 0, totalBookings: 0 };
  const utilizationRate = totalVehicles > 0 ? (activeRentals / totalVehicles) * 100 : 0;
  const [totalTickets, resolvedTickets] = ticketCounts;
  const loyaltyMap = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  loyaltyDistribution.forEach(t => { if (t._id) loyaltyMap[t._id] = t.count; });

  const analytics = {
    financials: { totalRevenue: revData.totalRevenue || 0, averageRevenuePerBooking: Math.round((revData.averageCost || 0) * 100) / 100, totalBookings: revData.totalBookings || 0 },
    fleet: { totalVehicles, activeRentals, utilizationRate: Math.round(utilizationRate * 10) / 10 },
    loyaltyTiers: loyaltyMap,
    topStations: formattedTopStations,
    monthlyRevenue: formattedMonthly,
    support: { totalTickets, resolvedTickets, resolutionRate: totalTickets > 0 ? Math.round((resolvedTickets / totalTickets) * 100 * 10) / 10 : 100 },
    calculatedAt: new Date(),
  };

  await cacheService.set(cacheKey, analytics, 43200);
  return analytics;
};

export const getSystemAnalytics = async (req, res) => {
  try {
    const cacheKey = 'super_admin_analytics';
    const cached = await cacheService.get(cacheKey);
    if (cached) return res.json(cached);
    const analytics = await calculateAndCacheSystemAnalytics();
    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching system analytics', { message: error.message });
    res.status(500).json({ message: 'Server Error loading analytics' });
  }
};
