import Booking from '../models/Booking.js';
import Vehicle from '../models/Vehicle.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { queueService } from '../services/queueService.js';

export const createBooking = async (req, res) => {
    // Issue #3: Use database transaction for concurrent booking protection (Issue #16)
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const {vehicleId,stationId,startTime,endTime,emergencyContacts,returnStationId}=req.body;
        if (!vehicleId || !stationId || !startTime || !endTime) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Missing required booking details." });
        }

        const requestedStartTime = new Date(startTime);
        const requestedEndTime = new Date(endTime);
        const now = new Date();
        
        // Real-world validations
        if (requestedStartTime < now) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Cannot book in the past." });
        }
        
        // Minimum 30 minutes lead time
        const minLeadTime = new Date(now.getTime() + 30 * 60 * 1000);
        if (requestedStartTime < minLeadTime) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Bookings must be made at least 30 minutes in advance." });
        }
        
        // Check duration limits (1 hour minimum, 7 days maximum)
        const durationHours = (requestedEndTime - requestedStartTime) / (1000 * 60 * 60);
        if (durationHours < 1) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Minimum booking duration is 1 hour." });
        }
        if (durationHours > 168) { // 7 days
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Maximum booking duration is 7 days." });
        }
        
        // Check station operating hours (6 AM to 11 PM)
        const startHour = requestedStartTime.getHours();
        const endHour = requestedEndTime.getHours();
        if (startHour < 6 || startHour > 23 || endHour < 6 || (endHour > 23 && requestedEndTime.getMinutes() > 0)) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: "Station operates from 6 AM to 11 PM only." });
        }

        // Check if station has at least one master
        const stationMasterCount = await User.countDocuments({
            station: stationId,
            role: 'station-master'
        });
        
        if (stationMasterCount === 0) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ 
                message: "This station is currently unmanaged and not accepting bookings." 
            });
        }
        
        // Issue #2: Calculate totalCost server-side (security fix)
        const vehicle = await Vehicle.findById(vehicleId).session(session);
        if (!vehicle) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: "Vehicle not found." });
        }
        
        const totalCost = durationHours * vehicle.pricePerHour;
        
        // Issue #5: Calculate security deposit (10% of total cost, min 500, max 5000)
        const securityDepositAmount = Math.min(Math.max(totalCost * 0.1, 500), 5000);
        
        // Issue #15: Handle one-way trip with different return station
        let oneWayFee = 0;
        let returnStation = stationId;
        if (returnStationId && returnStationId !== stationId) {
            if (vehicle.allowOneWayTrip) {
                oneWayFee = vehicle.oneWayDropOffFee || 500; // Default 500 if not set
                returnStation = returnStationId;
            } else {
                await session.abortTransaction();
                session.endSession();
                return res.status(400).json({ message: "This vehicle does not support one-way trips." });
            }
        }
        
        // Check for conflicts with transaction lock
        const conflictingBooking = await Booking.findOne({
            vehicle: vehicleId,
            status: { $ne: 'cancelled' },
            $or: [
                { startTime: { $lt: requestedEndTime }, endTime: { $gt: requestedStartTime } }
            ]
        }).session(session);

        if (conflictingBooking) {
            await session.abortTransaction();
            session.endSession();
            return res.status(409).json({
                message: 'Sorry, this vehicle is not available for the selected time slot. It may have just been booked by another user.' 
            });
        }
        
        const isAdvanceBooking = requestedStartTime.getTime() > (now.getTime() + 12 * 60 * 60 * 1000); // 12+ hours ahead
        const paymentWindow = isAdvanceBooking ? 2 * 60 * 60 * 1000 : 30 * 60 * 1000; // 2 hours vs 30 minutes
        const paymentDeadline = new Date(now.getTime() + paymentWindow);

        const booking = await Booking.create([{ 
            user: req.user._id, 
            vehicle: vehicleId,
            station: stationId,
            returnStation: returnStation,
            oneWayFee: oneWayFee,
            startTime: requestedStartTime, 
            endTime: requestedEndTime,
            originalEndTime: requestedEndTime,
            totalCost: totalCost + oneWayFee,
            status:'confirmed',
            paymentDeadline: paymentDeadline,
            emergencyContacts: emergencyContacts || [],
            // Security deposit
            securityDeposit: {
                amount: securityDepositAmount,
                status: 'pending'
            },
            // Overtime settings
            overtimeCharges: {
                overtimeRate: vehicle.pricePerHour * 1.5, // 1.5x rate for overtime
                gracePeriodMinutes: 15
            }
        }], { session });
        
        // Update vehicle status to reserved
        await Vehicle.findByIdAndUpdate(vehicleId, { status: 'reserved' }, { session });
        
        // Commit transaction
        await session.commitTransaction();
        session.endSession();
        
        // Schedule exact payment timeout timer (fires at precise paymentDeadline)
        await queueService.schedulePaymentTimeoutJob(booking[0]._id, paymentDeadline);
        
        // Notify station master dashboard to refresh
        const io = req.io;
        if (io) {
            io.to(`station_${stationId}`).emit('dashboard_refresh', {
                message: 'New booking request received'
            });
            
            // Schedule reminder 1 hour before ride
            const reminderTime = new Date(requestedStartTime.getTime() - 60 * 60 * 1000);
            if (reminderTime > new Date()) {
                setTimeout(() => {
                    io.to(req.user._id.toString()).emit('booking_reminder', {
                        message: 'Your ride starts in 1 hour!',
                        booking: booking[0]._id
                    });                                                                                       
                }, reminderTime.getTime() - Date.now());
            }
        }
        
        res.status(201).json(booking[0]);
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.error("--- ERROR IN createBookingRequest ---");
        console.error(error);
        console.error("------------------------------------");
        res.status(500).json({ message: 'Server Error creating booking' });
    }
};

export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user._id }).populate('vehicle', 'modelName imageUrl');
        res.status(200).json(bookings);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching bookings' });
    }
};

export const getVehicleAvailability = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        // Get all non-cancelled bookings for this vehicle
        const bookings = await Booking.find({
            vehicle: vehicleId,
            status: { $in: ['pending-confirmation', 'confirmed', 'active'] }
        }).select('startTime endTime');
        
        // Return the booked time slots
        const bookedSlots = bookings.map(booking => ({
            start: booking.startTime,
            end: booking.endTime
        }));
        
        res.json({ bookedSlots });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching availability' });
    }
};

export const modifyBooking = async (req, res) => {
    try {
        const { bookingId } = req.params;
        const { newEndTime, type } = req.body; // type: 'extend' or 'shorten'
        
        const booking = await Booking.findById(bookingId).populate('vehicle');
        if (!booking || booking.user.toString() !== req.user._id.toString()) {
            return res.status(404).json({ message: 'Booking not found' });
        }
        
        // Issue #13: Allow modification for active rides
        if (!['pending-confirmation', 'confirmed', 'active'].includes(booking.status)) {
            return res.status(400).json({ message: 'Cannot modify completed or cancelled bookings' });
        }
        
        const newEnd = new Date(newEndTime);
        const oldEnd = booking.endTime;
        const now = new Date();
        
        // For active rides, must extend beyond current time
        if (booking.status === 'active' && newEnd <= now) {
            return res.status(400).json({ message: 'Extension must be in the future' });
        }
        
        // Check if new time slot is available
        const conflictingBooking = await Booking.findOne({
            vehicle: booking.vehicle._id,
            _id: { $ne: bookingId },
            status: { $ne: 'cancelled' },
            $or: [
                { startTime: { $lt: newEnd }, endTime: { $gt: booking.startTime } }
            ]
        });
        
        if (conflictingBooking) {
            return res.status(409).json({ message: 'Time slot not available for modification' });
        }
        
        // Calculate cost difference (server-side calculation Issue #2)
        const oldDuration = (oldEnd - booking.startTime) / (1000 * 60 * 60);
        const newDuration = (newEnd - booking.startTime) / (1000 * 60 * 60);
        const additionalCost = (newDuration - oldDuration) * booking.vehicle.pricePerHour;
        
        // Update booking
        booking.endTime = newEnd;
        booking.totalCost += additionalCost;
        booking.modifications.push({
            type,
            oldEndTime: oldEnd,
            newEndTime: newEnd,
            additionalCost
        });
        
        // For active rides, if extending, require immediate payment
        if (booking.status === 'active' && type === 'extend') {
            booking.paymentStatus = 'pending';
            booking.paymentDeadline = new Date(now.getTime() + 10 * 60 * 1000); // 10 minutes to pay for extension
        }
        
        await booking.save();
        res.json({ 
            message: 'Booking modified successfully', 
            additionalCost,
            requiresPayment: booking.status === 'active' && type === 'extend',
            paymentDeadline: booking.paymentDeadline
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error modifying booking' });
    }
};

export const getUserAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const bookings = await Booking.find({ user: userId }).populate('vehicle');
        
        const totalBookings = bookings.length;
        const totalSpent = bookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
        const totalHours = bookings.reduce((sum, booking) => {
            const duration = (new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60);
            return sum + duration;
        }, 0);
        
        const vehicleCount = {};
        bookings.forEach(booking => {
            const vehicleId = booking.vehicle._id.toString();
            vehicleCount[vehicleId] = (vehicleCount[vehicleId] || 0) + 1;
        });
        
        const topVehicles = Object.entries(vehicleCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([vehicleId, count]) => {
                const booking = bookings.find(b => b.vehicle._id.toString() === vehicleId);
                return {
                    _id: vehicleId,
                    modelName: booking.vehicle.modelName,
                    bookingCount: count
                };
            });
        
        const monthlySpending = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
            const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
            
            const monthBookings = bookings.filter(booking => {
                const bookingDate = new Date(booking.createdAt);
                return bookingDate >= monthStart && bookingDate <= monthEnd;
            });
            
            const monthAmount = monthBookings.reduce((sum, booking) => sum + (booking.totalCost || 0), 0);
            
            monthlySpending.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                amount: monthAmount
            });
        }
        
        res.json({
            totalBookings,
            totalSpent,
            totalHours: Math.round(totalHours),
            avgRating: 4.2,
            topVehicles,
            monthlySpending
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching analytics' });
    }
};




