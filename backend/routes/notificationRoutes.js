import express from 'express';
import { createNotification, getUserNotifications, markAsRead } from '../controllers/notificationController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protectRoute, createNotification);
router.get('/', protectRoute, getUserNotifications);
router.put('/:notificationId/read', protectRoute, markAsRead);

export default router;
