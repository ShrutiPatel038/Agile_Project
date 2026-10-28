import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import logger from '../utils/logger.js';

export const createReview = async (req, res) => {
  try {
    const { bookingId, rating, comment, type } = req.body;
    const booking = await Booking.findById(bookingId).populate('vehicle station');
    if (!booking || booking.user.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only review completed bookings' });
    if (await Review.findOne({ booking: bookingId, type })) return res.status(400).json({ message: 'Review already exists' });
    const review = await Review.create({ user: req.user._id, booking: bookingId, vehicle: booking.vehicle._id, station: booking.station._id, rating, comment, type });
    res.status(201).json(review);
  } catch (error) {
    logger.error('Error creating review', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getVehicleReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ vehicle: req.params.vehicleId, type: 'vehicle' })
      .populate('user', 'name').sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getVehicleRating = async (req, res) => {
  try {
    const reviews = await Review.find({ vehicle: req.params.vehicleId, type: 'vehicle' });
    if (!reviews.length) return res.json({ averageRating: 0, totalReviews: 0 });
    const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    res.json({ averageRating: Math.round(avg * 10) / 10, totalReviews: reviews.length });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
