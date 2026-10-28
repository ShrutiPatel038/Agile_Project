import express from 'express';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoriteController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);
router.get('/', getFavorites);
router.post('/:vehicleId', toggleFavorite);
router.get('/:vehicleId/check', checkFavorite);

export default router;
