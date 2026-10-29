import express from 'express';
import { protectRoute, stationMaster } from '../middleware/protectRoute.js';
import { addVehicleToStation, getDashboardData, getPendingBookings, updateBookingStatus } from '../controllers/stationMasterController.js';



const router=express.Router();
router.use(protectRoute,stationMaster);

router.post('/vehicles', addVehicleToStation);
router.get('/bookings/pending',getPendingBookings);
router.put('/bookings/:id',updateBookingStatus);
router.get('/dashboard-data', getDashboardData);

export default router;
