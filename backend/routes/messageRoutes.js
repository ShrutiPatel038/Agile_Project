import express from 'express';
import { sendMessage, getBookingMessages, getUnreadCount } from '../controllers/messageController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);
router.post('/', sendMessage);
router.get('/unread-count', getUnreadCount);
router.get('/booking/:bookingId', getBookingMessages);

export default router;
