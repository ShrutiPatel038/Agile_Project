import express from 'express';
import Station from '../models/Station.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';
import { cacheService } from '../services/cacheService.js';
import logger from '../utils/logger.js';

const router = express.Router();

// GET /api/public/stations
router.get('/stations', async (_req, res) => {
  try {
    const cacheKey = 'public:stations';
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit: stations list');
      return res.json(cached);
    }
    logger.debug('Cache miss: fetching stations from MongoDB');
    const stations = await Station.find({});
    await cacheService.set(cacheKey, stations, 3600);
    res.json(stations);
  } catch (error) {
    logger.error('Error fetching stations', { message: error.message });
    res.status(500).json({ message: 'Server Error: Could not fetch stations.' });
  }
});

// GET /api/public/vehicles?stationId=&startTime=&endTime=
router.get('/vehicles', async (req, res) => {
  try {
    const { stationId, startTime, endTime } = req.query;
    if (!stationId || !startTime || !endTime) {
      return res.status(400).json({ message: 'Station ID, start time and end time are required' });
    }

    const start = new Date(startTime);
    const end   = new Date(endTime);

    // Find bookings that overlap with the requested slot at this station
    const conflictingBookings = await Booking.find({
      station: stationId,
      status:  { $in: ['pending-confirmation', 'confirmed', 'active'] },
      startTime: { $lt: end },
      endTime:   { $gt: start },
    });

    const conflictingVehicleIds = conflictingBookings.map((b) => b.vehicle);

    const available = await Vehicle.find({
      station: stationId,
      status:  { $ne: 'maintenance' },
      _id:     { $nin: conflictingVehicleIds },
    });

    res.json(available);
  } catch (error) {
    logger.error('Error fetching vehicles', { message: error.message });
    res.status(500).json({ message: 'Server Error: Could not fetch vehicles.' });
  }
});

export default router;
