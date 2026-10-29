import express from 'express';
import { sendMessage, getBookingMessages, getUnreadCount } from '../controllers/messageController.js';
import { protectRoute } from '../middleware/protectRoute.js';

const router = express.Router();

router.post('/', protectRoute, sendMessage);
router.get('/booking/:bookingId', protectRoute, getBookingMessages);
router.get('/unread-count', protectRoute, getUnreadCount);

export default router;