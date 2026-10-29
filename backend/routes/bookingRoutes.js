import express from 'express';
import { createBooking, getMyBookings, getVehicleAvailability, modifyBooking, getUserAnalytics } from '../controllers/bookingController.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { bookingLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// @desc    Create a new booking
// @route   POST /api/bookings
router.post('/', protectRoute, bookingLimiter, createBooking);

// @desc    Get bookings for the logged-in user
// @route   GET /api/bookings/mybookings
router.get('/mybookings', protectRoute, getMyBookings);

// @desc    Get user analytics
// @route   GET /api/bookings/analytics
router.get('/analytics', protectRoute, getUserAnalytics);

// @desc    Get vehicle availability
// @route   GET /api/bookings/vehicle/:vehicleId/availability
router.get('/vehicle/:vehicleId/availability', protectRoute, getVehicleAvailability);

// @desc    Modify booking
// @route   PUT /api/bookings/:bookingId/modify
router.put('/:bookingId/modify', protectRoute, modifyBooking);

export default router;