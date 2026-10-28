import express from 'express';
import { createTicket, getMyTickets, getTicketById, addMessageToTicket, updateTicketStatus, escalateTicket, rateTicket, getAllTickets } from '../controllers/supportController.js';
import { protectRoute } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protectRoute);
router.post('/', createTicket);
router.get('/', getMyTickets);
router.get('/all', getAllTickets);
router.get('/:ticketId', getTicketById);
router.post('/:ticketId/messages', addMessageToTicket);
router.put('/:ticketId/status', updateTicketStatus);
router.put('/:ticketId/escalate', escalateTicket);
router.put('/:ticketId/rate', rateTicket);

export default router;
