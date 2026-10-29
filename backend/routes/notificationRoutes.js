import express from 'express';
import { createNotification, getUserNotifications, markAsRead, createNotificationUtil } from '../controllers/notificationController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/', protectRoute, createNotification);
router.get('/', protectRoute, getUserNotifications);
router.put('/:notificationId/read', protectRoute, markAsRead);

// Test endpoint
router.post('/test', protectRoute, async (req, res) => {
    try {
        await createNotificationUtil(
            req.user._id,
            'Test Notification',
            'This is a test notification to check if the system is working.',
            'system',
            'medium'
        );
        res.json({ message: 'Test notification sent' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending test notification' });
    }
});

export default router;