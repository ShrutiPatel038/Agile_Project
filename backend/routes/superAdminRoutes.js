import express from 'express';
import { protectRoute, superAdmin } from '../middleware/protectRoute.js';
import {
  createStation,
  getAllStations,
  getStationDetails,
  getStationOverview,
  updateStation,
  addVehicle,
  getAllVehicles,
  updateVehicle,
  deleteVehicle,
  getAllStationMasters,
  createStationMaster,
  updateStationMaster,
  removeStationMaster,
  upload,
} from '../controllers/superAdminController.js';

const router = express.Router();

router.use(protectRoute, superAdmin);

// Stations
router.post('/stations', createStation);
router.get('/stations', getAllStations);
router.get('/stations/overview', getStationOverview);
router.get('/stations/:id', getStationDetails);
router.put('/stations/:id', updateStation);

// Vehicles
router.post('/vehicles', upload.single('image'), addVehicle);
router.get('/vehicles', getAllVehicles);
router.put('/vehicles/:vehicleId', upload.single('image'), updateVehicle);
router.delete('/vehicles/:vehicleId', deleteVehicle);

// Station Masters
router.get('/users/masters', getAllStationMasters);
router.post('/users/masters', createStationMaster);
router.put('/users/masters/:id', updateStationMaster);
router.delete('/users/masters/:userId', removeStationMaster);

export default router;
