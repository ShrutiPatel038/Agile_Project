import express from 'express';
import { toggleFavorite, getFavorites, checkFavorite } from '../controllers/favoriteController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/toggle/:vehicleId', protectRoute, toggleFavorite);
router.get('/', protectRoute, getFavorites);
router.get('/check/:vehicleId', protectRoute, checkFavorite);

export default router;