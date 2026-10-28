import Message from '../models/Message.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const sendMessage = async (req, res) => {
  try {
    const { bookingId, message, type = 'text' } = req.body;
    const booking = await Booking.findById(bookingId).populate('user station');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    let receiverId;
    if (req.user._id.toString() === booking.user._id.toString()) {
      const sm = await User.findOne({ station: booking.station._id, role: 'station-master' });
      if (!sm) return res.status(404).json({ message: 'Station master not found' });
      receiverId = sm._id;
    } else {
      receiverId = booking.user._id;
    }

    const newMsg = await Message.create({ booking: bookingId, sender: req.user._id, receiver: receiverId, message, type });
    const populated = await Message.findById(newMsg._id).populate('sender', 'name').populate('receiver', 'name');

    if (req.io) req.io.to(receiverId.toString()).emit('new_message', populated);
    res.status(201).json(populated);
  } catch (error) {
    logger.error('Error sending message', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getBookingMessages = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const isUser = req.user._id.toString() === booking.user.toString();
    const isSM   = req.user.role === 'station-master' && req.user.station?.toString() === booking.station.toString();
    const isAdmin = req.user.role === 'super-admin';
    if (!isUser && !isSM && !isAdmin) return res.status(403).json({ message: 'Access denied' });

    const messages = await Message.find({ booking: bookingId }).populate('sender', 'name').sort({ createdAt: 1 });
    await Message.updateMany({ booking: bookingId, receiver: req.user._id, isRead: false }, { isRead: true });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const count = await Message.countDocuments({ receiver: req.user._id, isRead: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
