import express from 'express';
import { protectRoute, superAdmin } from '../middleware/protectRoute.js';
import { createStation, removeStationMaster, getStationOverview, getStationDetails, updateStation, getAllRegularUsers, deleteRegularUser, getAllStationMasters, createStationMaster, getAllStations, getAllVehicles, getUserDetails, updateStationMaster, updateVehicle, deleteVehicle, getAllActiveRides, cancelRide, getStaffManagementData, cleanupUnmanagedStations, addVehicle, upload, getSystemAnalytics } from '../controllers/superAdminController.js';

const router = express.Router();
router.use(protectRoute, superAdmin);

router.get('/analytics', getSystemAnalytics);
router.post('/stations', createStation);
router.get('/stations',getAllStations);
router.get('/stations/overview', getStationOverview); 
router.get('/stations/:id',getStationDetails);
router.put('/stations/:id',updateStation);
router.get('/staff-data',getStaffManagementData);
router.post('/cleanup-unmanaged', cleanupUnmanagedStations);

router.get('/users/regular',getAllRegularUsers);
router.delete('/users/regular/:userId', deleteRegularUser);
router.get('/users/:id/details',getUserDetails);
router.get('/users/masters',getAllStationMasters);
router.post('/users/masters', createStationMaster);
router.put('/users/masters/:id', updateStationMaster); // NEW
router.delete('/users/masters/:userId', removeStationMaster);

router.post('/vehicles', upload.single('image'), addVehicle);
router.get('/vehicles',getAllVehicles);
router.put('/vehicles/:vehicleId', upload.single('image'), updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);
router.get('/rides/active', getAllActiveRides);
router.put('/rides/:bookingId/cancel', cancelRide);



export default router;