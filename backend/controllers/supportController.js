import SupportTicket from '../models/SupportTicket.js';
import logger from '../utils/logger.js';

const slaDeadlines = (priority, now) => {
  const h = (hrs) => new Date(now.getTime() + hrs * 60 * 60 * 1000);
  const map = { urgent: [1, 4], high: [4, 24], medium: [8, 48], low: [24, 72] };
  const [r, res] = map[priority] || map.medium;
  return { responseDeadline: h(r), resolutionDeadline: h(res) };
};

export const createTicket = async (req, res) => {
  try {
    const { subject, description, category, priority = 'medium', bookingId } = req.body;
    if (!subject || !description || !category) return res.status(400).json({ message: 'Subject, description, and category are required' });
    const now = new Date();
    const ticket = await SupportTicket.create({
      user: req.user._id, booking: bookingId || undefined, subject, description, category, priority,
      sla: slaDeadlines(priority, now),
      messages: [{ sender: req.user._id, message: description, timestamp: now }],
    });
    res.status(201).json(ticket);
  } catch (error) {
    logger.error('Error creating ticket', { message: error.message });
    res.status(500).json({ message: 'Server Error creating ticket' });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id })
      .populate('booking', 'vehicle startTime endTime')
      .sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getTicketById = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId)
      .populate('user', 'name email').populate('booking').populate('assignedTo', 'name email')
      .populate('messages.sender', 'name email role');
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isOwner = ticket.user._id.toString() === req.user._id.toString();
    const isStaff = ['station-master', 'super-admin'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'Unauthorized' });
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const addMessageToTicket = async (req, res) => {
  try {
    const { message, isInternal } = req.body;
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    const isOwner = ticket.user.toString() === req.user._id.toString();
    const isStaff = ['station-master', 'super-admin'].includes(req.user.role);
    if (!isOwner && !isStaff) return res.status(403).json({ message: 'Unauthorized' });

    const isInternalMsg = isInternal && isStaff;
    ticket.messages.push({ sender: req.user._id, message, isInternal: isInternalMsg, timestamp: new Date() });

    if (!ticket.sla.firstResponseAt && isStaff) {
      ticket.sla.firstResponseAt = new Date();
      if (ticket.sla.firstResponseAt > ticket.sla.responseDeadline) ticket.sla.isBreached = true;
    }
    if (ticket.status === 'waiting-customer' && isOwner) ticket.status = 'in-progress';
    await ticket.save();

    if (global.io) {
      if (isInternalMsg) {
        global.io.to('support_staff').emit('ticket_update', { ticketId: ticket._id, message: 'New internal note' });
      } else {
        global.io.to(ticket.user.toString()).emit('ticket_update', { ticketId: ticket._id, message: 'New message' });
        if (ticket.assignedTo) global.io.to(ticket.assignedTo.toString()).emit('ticket_update', { ticketId: ticket._id, message: 'New message' });
      }
    }
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    if (!['station-master', 'super-admin'].includes(req.user.role)) return res.status(403).json({ message: 'Unauthorized' });
    const { status, assignedTo } = req.body;
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    if (status) {
      ticket.status = status;
      if (status === 'resolved' && !ticket.sla.resolvedAt) {
        ticket.sla.resolvedAt = new Date();
        if (ticket.sla.resolvedAt > ticket.sla.resolutionDeadline) ticket.sla.isBreached = true;
      }
    }
    if (assignedTo) { ticket.assignedTo = assignedTo; ticket.assignedAt = new Date(); }
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const escalateTicket = async (req, res) => {
  try {
    if (!['station-master', 'super-admin'].includes(req.user.role)) return res.status(403).json({ message: 'Unauthorized' });
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    ticket.escalation = { isEscalated: true, escalatedAt: new Date(), escalatedTo: req.body.escalateTo, reason: req.body.reason };
    ticket.priority = 'urgent';
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const rateTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.ticketId);
    if (!ticket || ticket.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Ticket not found' });
    if (!['resolved', 'closed'].includes(ticket.status)) return res.status(400).json({ message: 'Can only rate resolved/closed tickets' });
    ticket.rating = { score: req.body.score, feedback: req.body.feedback };
    ticket.status = 'closed';
    await ticket.save();
    res.json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    if (!['station-master', 'super-admin'].includes(req.user.role)) return res.status(403).json({ message: 'Unauthorized' });
    const { status, priority, category } = req.query;
    const filter = {};
    if (status)   filter.status   = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    const tickets = await SupportTicket.find(filter)
      .populate('user', 'name email').populate('assignedTo', 'name email')
      .sort({ priority: -1, createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
