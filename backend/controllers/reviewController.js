import Review from '../models/Review.js';
import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';

export const createReview = async (req, res) => {
    try {
        const { bookingId, rating, comment, type } = req.body;
        
        const booking = await Booking.findById(bookingId).populate('vehicle station');
        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        if (booking.status !== 'completed') {
            return res.status(400).json({ message: 'Can only review completed bookings' });
        }
        
        const existingReview = await Review.findOne({ booking: bookingId, type });
        if (existingReview) {
            return res.status(400).json({ message: 'Review already exists for this booking' });
        }
        
        const review = await Review.create({
            user: req.user._id,
            booking: bookingId,
            vehicle: booking.vehicle._id,
            station: booking.station._id,
            rating,
            comment,
            type
        });
        
        res.status(201).json(review);
    } catch (error) {
        res.status(500).json({ message: 'Server Error creating review' });
    }
};

export const getVehicleReviews = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const reviews = await Review.find({ vehicle: vehicleId, type: 'vehicle' })
            .populate('user', 'name')
            .sort({ createdAt: -1 });
        res.json(reviews);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching reviews' });
    }
};

export const getVehicleRating = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const reviews = await Review.find({ vehicle: vehicleId, type: 'vehicle' });
        
        if (reviews.length === 0) {
            return res.json({ averageRating: 0, totalReviews: 0 });
        }
        
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        res.json({ averageRating: Math.round(averageRating * 10) / 10, totalReviews: reviews.length });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching rating' });
    }
};