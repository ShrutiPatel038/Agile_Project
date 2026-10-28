import nodemailer from 'nodemailer';
import Notification from '../models/Notification.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import logger from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
});

export const createNotificationUtil = async (userId, title, message, type, priority = 'medium', channels = {}, io = null) => {
  try {
    const notification = await Notification.create({
      user: userId, title, message, type, priority,
      channels: { push: { sent: false }, email: { sent: false }, sms: { sent: false }, ...channels },
    });

    const socketIo = io || global.io;
    if (socketIo) {
      const payload = { _id: notification._id, title, message, type, priority, createdAt: notification.createdAt, isRead: false };
      socketIo.to(userId.toString()).emit('notification', payload);
      notification.channels.push = { sent: true, sentAt: new Date() };
      await notification.save();
    }

    return notification;
  } catch (error) {
    logger.error('Error creating notification', { userId, message: error.message });
    throw error;
  }
};

export const createNotification = async (req, res) => {
  try {
    const { userId, title, message, type, priority = 'medium', channels = {} } = req.body;
    const notification = await createNotificationUtil(userId, title, message, type, priority, channels, req.io);
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating notification' });
  }
};

export const getUserNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total] = await Promise.all([
      Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Notification.countDocuments({ user: req.user._id }),
    ]);
    res.json({ notifications, totalPages: Math.ceil(total / limit), currentPage: parseInt(page) });
  } catch (error) {
    logger.error('Error fetching notifications', { message: error.message });
    res.status(500).json({ message: 'Server Error fetching notifications' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.notificationId, { isRead: true });
    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const sendBookingConfirmationEmail = async (booking, user) => {
  try {
    let attachments = [];
    try {
      const pdfPath = await generateInvoicePDF(booking, user);
      attachments.push({ filename: `invoice_${booking._id}.pdf`, path: pdfPath });
    } catch (pdfErr) {
      logger.warn('PDF generation failed, sending email without invoice', { message: pdfErr.message });
    }

    const html = `
      <h2>Booking Confirmation</h2>
      <p>Dear ${user.name},</p>
      <p>Your booking has been confirmed!</p>
      <div style="background:#f5f5f5;padding:15px;margin:20px 0;">
        <h3>Booking Details:</h3>
        <p><strong>Vehicle:</strong> ${booking.vehicle?.modelName || 'EV Vehicle'}</p>
        <p><strong>Start:</strong> ${new Date(booking.startTime).toLocaleString()}</p>
        <p><strong>End:</strong> ${new Date(booking.endTime).toLocaleString()}</p>
        <p><strong>Total Cost:</strong> ₹${booking.totalCost?.toLocaleString('en-IN')}</p>
        <p><strong>Booking ID:</strong> ${booking._id}</p>
      </div>
      <p>Please arrive 15 minutes before your booking time. Thank you for choosing EV-Go!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Booking Confirmation – EV-Go',
      html,
      attachments,
    });

    logger.info('Booking confirmation email sent', { bookingId: booking._id, email: user.email });
  } catch (error) {
    logger.error('Email sending failed', { message: error.message });
  }
};
