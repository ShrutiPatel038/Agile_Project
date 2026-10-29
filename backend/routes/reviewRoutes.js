import express from 'express';
import { createReview, getVehicleReviews, getVehicleRating } from '../controllers/reviewController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/', protectRoute, createReview);
router.get('/vehicle/:vehicleId', getVehicleReviews);
router.get('/vehicle/:vehicleId/rating', getVehicleRating);

export default router;