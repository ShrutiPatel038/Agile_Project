import express from 'express';
import { registerUser, loginUser, logoutUser, getMe } from '../controllers/authController.js';
import { protectRoute } from '../middleware/protectRoute.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, registerUser);
router.post('/login',    authLimiter, loginUser);
router.post('/logout',   logoutUser);
router.get('/me',        protectRoute, getMe);

export default router;
