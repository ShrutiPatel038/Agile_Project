import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    station: { type: mongoose.Schema.Types.ObjectId, ref: 'Station', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, maxlength: 500 },
    type: { type: String, enum: ['vehicle', 'station'], required: true }
}, { timestamps: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;