import express from 'express';
import { createBooking, getMyBookings, getVehicleAvailability, modifyBooking, getUserAnalytics } from '../controllers/bookingController.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', protectRoute, bookingLimiter, createBooking);
router.get('/mybookings', protectRoute, getMyBookings);
router.get('/analytics', protectRoute, getUserAnalytics);
router.get('/vehicle/:vehicleId/availability', protectRoute, getVehicleAvailability);
router.put('/:bookingId/modify', protectRoute, modifyBooking);

export default router;
