import Booking from "../models/Booking.js";
import Favorite from "../models/Favorite.js";
import LoyaltyTransaction from "../models/LoyaltyTransaction.js";
import Message from "../models/Message.js";
import Notification from "../models/Notification.js";
import Review from "../models/Review.js";
import Station from "../models/Station.js";
import SupportTicket from "../models/SupportTicket.js";
import User from "../models/User.js";
import Vehicle from "../models/Vehicle.js";
import { createNotificationUtil } from './notificationController.js';
import { cacheService } from '../services/cacheService.js';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for image uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, '../images'));
    },
    filename: (req, file, cb) => {
        const uniqueName = `${req.body.modelName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

export const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export const createStation = async (req,res) => {
    try{
        const {name,location} = req.body;
        if (!name || !location) return res.status(400).json({ message: 'Name and location are required' });

        const stationExists=await Station.findOne({name});
        if(stationExists){
            return res.status(400).json({message: 'A station with this name already exists.'})
        }
        const station = await Station.create({name,location});
        
        // Invalidate stations list cache
        await cacheService.del('public:stations');
        console.log('🧹 Cache Evicted: stations list cache cleared (create)');
        
        // Notify all super admins about new station
        const superAdmins = await User.find({ role: 'super-admin' });
        for (const admin of superAdmins) {
            if (admin._id.toString() !== req.user._id.toString()) {
                await createNotificationUtil(
                    admin._id,
                    'New Station Created',
                    `${name} station has been created at ${location}.`,
                    'system',
                    'medium'
                );
            }
        }
        
        res.status(201).json(station);
    }
    catch(error){
        console.error("Error creating station:",error);
        res.status(500).json({message: "Server error"});
    }
};

export const updateStation = async(req,res) => {
    try{
        const {name,location} = req.body;
        const stationId = req.params.id;

        if(!name || !location) {
            return res.status(400).json({message: 'Name and location are required'});
        }

        const station=await Station.findById(stationId);

        if(!station) {
            return res.status(404).json({message:'Station not found'});
        }

        //Check if the new name is already taken by another station
        const duplicate=await Station.findOne({name,_id:{$ne: stationId}});
        if(duplicate){
            return res.status(400).json({message:'Another station with this name already exists.'});
        }

        station.name=name || station.name;
        station.location=location || station.location;
        await station.save();

        // Invalidate stations list cache
        await cacheService.del('public:stations');
        console.log('🧹 Cache Evicted: stations list cache cleared (update)');

        res.json(station);
    } catch(error){
        console.error("Enter updating station:",error);
        res.status(500).json({message:"Server error"});
    }
}

// NEW: Get detailed stats for a single station
export const getStationOverview = async (req, res) => {
    try {
        const { sortBy = 'name', sortOrder = 'asc', status, vehicleCount, minRevenue, maxRevenue } = req.query;
        
        // 1. Fetch all stations and all masters in parallel
        const [stations, masters] = await Promise.all([
            Station.find({}).lean(),
            User.find({ role: 'station-master' }).select('name station').lean(),
        ]);

        // Create a map for quick master lookup: { stationId: masterName }
        const masterMap = masters.reduce((acc, master) => {
            if (master.station) {
                acc[master.station.toString()] = master.name;
            }
            return acc;
        }, {});

        // 2. Use a single aggregation pipeline to get all vehicle stats
        const vehicleStats = await Vehicle.aggregate([
            {
                $group: {
                    _id: '$station',
                    totalVehicles: { $sum: 1 },
                    availableVehicles: {
                        $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
                    }
                }
            }
        ]);
        const vehicleStatsMap = vehicleStats.reduce((acc, item) => { acc[item._id] = item; return acc; }, {});

        // 3. Use a single aggregation pipeline to get all booking stats
        const bookingStats = await Booking.aggregate([
            {
                $group: {
                    _id: '$station',
                    activeRides: {
                        $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
                    },
                    totalRevenue: {
                        $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalCost', 0] }
                    }
                }
            }
        ]);
        const bookingStatsMap = bookingStats.reduce((acc, item) => { acc[item._id] = item; return acc; }, {});

        // 4. Combine all the pre-calculated data
        let stationsWithStats = stations.map(station => {
            const stationIdStr = station._id.toString();
            const vStats = vehicleStatsMap[stationIdStr] || { totalVehicles: 0, availableVehicles: 0 };
            const bStats = bookingStatsMap[stationIdStr] || { activeRides: 0, totalRevenue: 0 };
            
            return {
                ...station,
                stats: {
                    stationMaster: { name: masterMap[stationIdStr] || null },
                    totalVehicles: vStats.totalVehicles,
                    availableVehicles: vStats.availableVehicles,
                    activeRides: bStats.activeRides,
                    totalRevenue: bStats.totalRevenue,
                }
            };
        });
        
        // 5. Apply filters
        if (status) {
            if (status === 'managed') {
                stationsWithStats = stationsWithStats.filter(s => s.stats.stationMaster.name);
            } else if (status === 'unmanaged') {
                stationsWithStats = stationsWithStats.filter(s => !s.stats.stationMaster.name);
            }
        }
        
        if (vehicleCount) {
            if (vehicleCount === '0') {
                stationsWithStats = stationsWithStats.filter(s => s.stats.totalVehicles === 0);
            } else if (vehicleCount === '1-5') {
                stationsWithStats = stationsWithStats.filter(s => s.stats.totalVehicles >= 1 && s.stats.totalVehicles <= 5);
            } else if (vehicleCount === '6-10') {
                stationsWithStats = stationsWithStats.filter(s => s.stats.totalVehicles >= 6 && s.stats.totalVehicles <= 10);
            } else if (vehicleCount === '10+') {
                stationsWithStats = stationsWithStats.filter(s => s.stats.totalVehicles > 10);
            }
        }
        
        if (minRevenue || maxRevenue) {
            stationsWithStats = stationsWithStats.filter(s => {
                const revenue = s.stats.totalRevenue;
                if (minRevenue && revenue < parseFloat(minRevenue)) return false;
                if (maxRevenue && revenue > parseFloat(maxRevenue)) return false;
                return true;
            });
        }
        
        // 6. Apply sorting
        stationsWithStats.sort((a, b) => {
            let aVal, bVal;
            
            if (sortBy === 'name') {
                aVal = a.name;
                bVal = b.name;
            } else if (sortBy === 'totalVehicles') {
                aVal = a.stats.totalVehicles;
                bVal = b.stats.totalVehicles;
            } else if (sortBy === 'totalRevenue') {
                aVal = a.stats.totalRevenue;
                bVal = b.stats.totalRevenue;
            } else if (sortBy === 'activeRides') {
                aVal = a.stats.activeRides;
                bVal = b.stats.activeRides;
            }
            
            if (typeof aVal === 'string') {
                return sortOrder === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
            } else {
                return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
            }
        });
        
        res.json(stationsWithStats);

    } catch (error) {
        console.error("Error in getStationsOverview:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// NEW: Update Station Master details
export const updateStationMaster = async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findById(req.params.id);

        if (!user || user.role !== 'station-master') {
            return res.status(404).json({ message: 'Station Master not found.' });
        }
         // Check if the new email is already taken by another user
        if (email && email !== user.email) {
            const emailExists = await User.findOne({ email });
            if (emailExists) {
                return res.status(400).json({ message: 'This email is already in use by another account.' });
            }
        }
        
        const emailChanged = email && email !== user.email;

        user.name = name || user.name;
        user.email = email || user.email;
        
        await user.save();
        
        // --- THIS IS THE NEW LOGIC ---
        if (emailChanged) {
            const io = req.io;
            const targetUserId = user._id.toString();
            
            // Emit an event to force the user to log out
            io.to(targetUserId).emit('force_logout', {
                message: 'Your account details have been updated by an administrator. Please log in again with your new credentials.'
            });
        }
        // -----------------------------

        res.json(user);
    } catch (error) { console.error("Error updating station master:", error); res.status(500).json({ message: "Server Error" }); }
};

export const addVehicle = async(req,res) => {
    const {modelName, pricePerHour, stationId} = req.body;
    const imageUrl = req.file ? `/images/${req.file.filename}` : null;

    if(!modelName || !imageUrl || !pricePerHour || !stationId){
        return res.status(400).json({message: 'All fields including image are required'});
    }

    try{
        const vehicle=await Vehicle.create({
            modelName,
            imageUrl,
            pricePerHour,
            station: stationId
        });
        
        // Notify station masters about new vehicle
        const [station, stationMasters] = await Promise.all([
            Station.findById(stationId),
            User.find({ station: stationId, role: 'station-master' })
        ]);
        
        for (const master of stationMasters) {
            await createNotificationUtil(
                master._id,
                'New Vehicle Added',
                `${modelName} has been added to ${station.name} by administration.`,
                'system',
                'medium'
            );
        }
        
        res.status(201).json(vehicle);
    } catch(error){
        console.error('Error adding vehicle:', error);
        res.status(500).json({message: 'Server error adding vehicle'});
    }
}

export const getAllVehicles = async (req, res) => {
    try {
        const { sortBy = 'modelName', sortOrder = 'asc', status, station, minPrice, maxPrice } = req.query;
        
        // Build filter query
        const filterQuery = {};
        
        if (status) filterQuery.status = status;
        if (station) filterQuery.station = station;
        if (minPrice || maxPrice) {
            filterQuery.pricePerHour = {};
            if (minPrice) filterQuery.pricePerHour.$gte = parseFloat(minPrice);
            if (maxPrice) filterQuery.pricePerHour.$lte = parseFloat(maxPrice);
        }
        
        // Build sort query
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;
        
        const vehicles = await Vehicle.find(filterQuery)
            .populate('station', 'name')
            .sort(sortQuery);

        res.json(vehicles);
    } catch (error) {
        console.error("Error in getAllVehicles:", error);
        res.status(500).json({ message: 'Server Error fetching vehicles.' });
    }
};

// NEW: Update Vehicle details
export const updateVehicle = async (req, res) => {
    try {
        const { modelName, pricePerHour } = req.body;
        const imageUrl = req.file ? `/images/${req.file.filename}` : null;
        
        const vehicle = await Vehicle.findById(req.params.vehicleId);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        
        vehicle.modelName = modelName || vehicle.modelName;
        vehicle.pricePerHour = pricePerHour || vehicle.pricePerHour;
        if (imageUrl) vehicle.imageUrl = imageUrl;
        
        await vehicle.save();
        res.json(vehicle);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// NEW: Delete Vehicle
export const deleteVehicle = async (req, res) => {
    try {
        const vehicleId = req.params.vehicleId;
        const vehicle = await Vehicle.findById(vehicleId).populate('station');
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
        
        // Optional: Check if vehicle is in an active booking before deleting
        const activeBooking = await Booking.findOne({ vehicle: vehicleId, status: { $in: ['active', 'confirmed', 'pending-confirmation'] } });
        if (activeBooking) {
            return res.status(400).json({ message: 'Cannot delete vehicle that is part of an active or upcoming booking.' });
        }
        
        // Notify station masters before deleting
        const stationMasters = await User.find({
            station: vehicle.station._id,
            role: 'station-master'
        });
        
        for (const master of stationMasters) {
            await createNotificationUtil(
                master._id,
                'Vehicle Removed',
                `${vehicle.modelName} has been removed from ${vehicle.station.name} by administration.`,
                'system',
                'medium'
            );
        }
        
        await Vehicle.findByIdAndDelete(vehicleId);
        res.json({ message: 'Vehicle deleted successfully' });
    } catch (error) { 
        console.error('Error deleting vehicle:', error);
        res.status(500).json({ message: 'Server Error' }); 
    }
};


export const getAllActiveRides = async (req, res) => {
    try {
        const activeRides = await Booking.find({ status: 'active' })
            .populate('user', 'name email')       // Get the customer's name and email
            .populate('vehicle', 'modelName')   // Get the vehicle's model name
            .populate('station', 'name');       // Get the station's name
            
        res.json(activeRides);
    } catch (error) {
        console.error("Error in getAllActiveRides:", error);
        res.status(500).json({ message: 'Server Error fetching active rides.' });
    }
};

export const cancelRide = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.bookingId);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // A Super Admin can cancel a confirmed or active ride.
        if (booking.status === 'confirmed' || booking.status === 'active') {
            booking.status = 'cancelled';
            await booking.save();

            // IMPORTANT: Make the vehicle available again.
            await Vehicle.findByIdAndUpdate(booking.vehicle, { 
                status: 'available', 
                availableAfter: null 
            });

            // Notify the user their ride was cancelled by an admin
            const io = req.io;
            const userId = booking.user.toString();
            io.to(userId).emit('booking_update', {
                bookingId: booking._id,
                newStatus: 'cancelled',
                message: 'Your ride has been cancelled by an administrator. Please check your bookings for details.'
            });

            res.json({ message: 'The ride has been successfully cancelled.' });
        } else {
            // Prevent cancelling a ride that is already completed, cancelled, or pending.
            res.status(400).json({ message: `Cannot cancel a ride with status: ${booking.status}` });
        }
    } catch (error) {
        console.error("Error in cancelRide:", error);
        res.status(500).json({ message: 'Server Error while cancelling ride.' });
    }
};


export const getAllStations = async (req, res) => {
    try {
        const stations = await Station.find({});
        res.json(stations);
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getStationDetails = async(req,res) => {
    try{
        const stationId=req.params.id;

        //1. Fetch the primary station document
        const station=await Station.findById(stationId);
        if(!station) {
            return res.status(404).json({message: 'Station not found'});
        }

        //2. Fetch all realted data for this station in parallel for efficiency
        const [master,vehicles,bookings] = await Promise.all([
            //Find the user who is a 'station-master' and assigned to this station
            User.findOne({station: stationId,role: 'station-master'}).select('name email'),

            //Find all vehicles belonging to this station
            Vehicle.find({station: stationId}),

            //Find all bookings related to this station
            Booking.find({station: stationId}).populate('user','name email').populate('vehicle','modelName'),
        ]);

        // 3. Calculate the statistics from the fetched data
        const availableVehicles=vehicles.filter(v=>v.status==='available').length;
        const activeRides=bookings.filter(b=>b.status==='active').length;
        const totalRevenue=bookings
            .filter(b=>b.status==='completed')
            .reduce((acc,booking)=>acc+booking.totalCost,0);

        //4. Assemble the final response object
        res.json({
            station,
            stats: {
                stationMaster: master, //This will be the user object or null if unassigned
                totalVehicles: vehicles.length,
                availableVehicles,
                activeRides,
                totalRevenue: totalRevenue.toFixed(2),
            },
            vehicles,
            bookings,
        })
    } catch(error) {
        console.error("Error in getStationDetails:",error);
        res.status(500).json({message: 'Server Error'});
    }
}

// 1. Get all REGULAR USERS (for viewing)
export const getAllRegularUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const { sortBy = 'createdAt', sortOrder = 'desc', dateFilter, startDate, endDate } = req.query;

        // Build filter query
        const filterQuery = { role: 'user' };
        
        // Handle date filtering
        if (dateFilter) {
            const now = new Date();
            let filterStart, filterEnd;
            
            switch (dateFilter) {
                case 'today':
                    filterStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    filterEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
                    break;
                case 'week': {
                    const weekStart = new Date(now);
                    weekStart.setDate(now.getDate() - now.getDay());
                    weekStart.setHours(0, 0, 0, 0);
                    filterStart = weekStart;
                    filterEnd = now;
                    break;
                }
                case 'month':
                    filterStart = new Date(now.getFullYear(), now.getMonth(), 1);
                    filterEnd = now;
                    break;
                case 'custom':
                    if (startDate) filterStart = new Date(startDate);
                    if (endDate) {
                        filterEnd = new Date(endDate);
                        filterEnd.setHours(23, 59, 59, 999);
                    }
                    break;
            }
            
            if (filterStart || filterEnd) {
                filterQuery.createdAt = {};
                if (filterStart) filterQuery.createdAt.$gte = filterStart;
                if (filterEnd) filterQuery.createdAt.$lte = filterEnd;
            }
        }

        // Build sort query
        const sortQuery = {};
        sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

        const users = await User.find(filterQuery)
            .sort(sortQuery)
            .select('name email createdAt')
            .skip(skip)
            .limit(limit);

        const totalUsers = await User.countDocuments(filterQuery);

        res.json({
            users,
            totalPages: Math.ceil(totalUsers / limit),
            currentPage: page,
        });
    } catch (error) {
        console.error('Error in getAllRegularUsers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a regular user account (only if they have no booking history)
export const deleteRegularUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId).select('name role');
        if (!user || user.role !== 'user') {
            return res.status(404).json({ message: 'Regular user not found.' });
        }

        const bookingCount = await Booking.countDocuments({ user: userId });
        if (bookingCount > 0) {
            return res.status(409).json({
                message: 'Cannot delete user with booking history. Please cancel or archive related records first.'
            });
        }

        await Promise.all([
            Favorite.deleteMany({ user: userId }),
            LoyaltyTransaction.deleteMany({ user: userId }),
            Message.deleteMany({ $or: [{ sender: userId }, { receiver: userId }] }),
            Notification.deleteMany({ user: userId }),
            Review.deleteMany({ user: userId }),
            SupportTicket.deleteMany({ user: userId }),
            SupportTicket.updateMany(
                { 'messages.sender': userId },
                { $pull: { messages: { sender: userId } } }
            ),
            SupportTicket.updateMany(
                { assignedTo: userId },
                { $unset: { assignedTo: 1, assignedAt: 1 } }
            ),
            SupportTicket.updateMany(
                { 'escalation.escalatedTo': userId },
                { $unset: { 'escalation.escalatedTo': 1 } }
            ),
            User.updateMany({ referredBy: userId }, { $unset: { referredBy: 1 } })
        ]);

        await User.findByIdAndDelete(userId);

        res.json({ message: `${user.name} deleted successfully.` });
    } catch (error) {
        console.error('Error in deleteRegularUser:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

//Get the full details and booking history for a single user
export const getUserDetails=async(req,res)=>{
    try{
        const userId=req.params.id;
        const { 
            sortBy = 'createdAt', 
            sortOrder = 'desc', 
            statusFilters, 
            minCost, 
            maxCost, 
            dateFilter, 
            startDate, 
            endDate 
        } = req.query;
        
        const [user, bookings] = await Promise.all([
            User.findById(userId).select('-password'),
            (() => {
                // Build the query object for bookings
                const bookingQuery = { user: userId };

                // Status filter
                if (statusFilters) {
                    const parsedStatusFilters = JSON.parse(statusFilters);
                    if (parsedStatusFilters.length > 0) {
                        bookingQuery.status = { $in: parsedStatusFilters };
                    }
                }

                // Cost range filter
                if (minCost || maxCost) {
                    bookingQuery.totalCost = {};
                    if (minCost) bookingQuery.totalCost.$gte = parseFloat(minCost);
                    if (maxCost) bookingQuery.totalCost.$lte = parseFloat(maxCost);
                }

                // Date filter
                if (dateFilter) {
                    const now = new Date();
                    let filterStart, filterEnd;
                    
                    switch (dateFilter) {
                        case 'week':
                            filterStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                            filterEnd = now;
                            break;
                        case 'month':
                            filterStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                            filterEnd = now;
                            break;
                        case 'custom':
                            if (startDate) filterStart = new Date(startDate);
                            if (endDate) {
                                filterEnd = new Date(endDate);
                                filterEnd.setHours(23, 59, 59, 999);
                            }
                            break;
                    }
                    
                    if (filterStart || filterEnd) {
                        bookingQuery.createdAt = {};
                        if (filterStart) bookingQuery.createdAt.$gte = filterStart;
                        if (filterEnd) bookingQuery.createdAt.$lte = filterEnd;
                    }
                }

                // Build sort query
                const sortQuery = {};
                sortQuery[sortBy] = sortOrder === 'asc' ? 1 : -1;

                // Execute the query
                return Booking.find(bookingQuery)
                    .populate('vehicle', 'modelName')
                    .populate('station', 'name')
                    .sort(sortQuery);
            })()
        ]);
        
        if(!user || user.role!=='user'){
            return res.status(404).json({message:'User not found'});
        }
        
        res.json({user,bookings});

    } catch(error){
        console.error('Error in getUserDetails:', error);
        res.status(500).json({message: 'Server Error'});
    }
}

// Get all current station master
export const getAllStationMasters=async(req,res)=>{
    try{
        const masters=await User.find({role:'station-master'}).populate('station','name').select('name email station');
        res.json(masters);
    } catch(error) {
        res.status(500).json({message:'Server error'})
    }
}

//Create a new Station master account from scratch
export const createStationMaster = async (req, res) => {
    try {
        const { name, email, password, stationId } = req.body;
        if (!name || !email || !password || !stationId) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const masterCount = await User.countDocuments({ 
            station: stationId, 
            role: 'station-master' 
        });

        if (masterCount >= 3) {
            return res.status(409).json({
                message: `This station already has the maximum of 3 masters assigned. Please choose another station.`
            });
        }

        const emailExists = await User.findOne({ email });
        if (emailExists) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }
        
        const newMaster = await User.create({ name, email, password, role: 'station-master', station: stationId });
        const station = await Station.findById(stationId);
        
        // Notify the new station master
        await createNotificationUtil(
            newMaster._id,
            'Welcome to Station Management',
            `You have been assigned as Station Master for ${station.name}. Welcome to the team!`,
            'system',
            'high'
        );
        
        // Notify other super admins
        const superAdmins = await User.find({ role: 'super-admin' });
        for (const admin of superAdmins) {
            if (admin._id.toString() !== req.user._id.toString()) {
                await createNotificationUtil(
                    admin._id,
                    'New Station Master Assigned',
                    `${name} has been assigned as Station Master for ${station.name}.`,
                    'system',
                    'medium'
                );
            }
        }
        
        res.status(201).json({ message: 'Station Master account created successfully.' });

    } catch (error) {
        console.error("Error in createStationMaster:", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const removeStationMaster = async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);
        if (user && user.role === 'station-master') {
            const oldStationId = user.station?.toString();
            user.role = 'user';
            user.station = undefined;
            await user.save();

            // Check if this was the last master for the station
            if (oldStationId) {
                const remainingMasters = await User.countDocuments({
                    station: oldStationId,
                    role: 'station-master'
                });
                
                // If no masters left, remove all vehicles from the station
                if (remainingMasters === 0) {
                    const removedVehicles = await Vehicle.find({ station: oldStationId });
                    await Vehicle.deleteMany({ station: oldStationId });
                    
                    // Notify the demoted user about vehicle removal
                    if (removedVehicles.length > 0) {
                        await createNotificationUtil(
                            user._id,
                            'Station Vehicles Removed',
                            `All ${removedVehicles.length} vehicles have been removed from the station as it no longer has any station masters.`,
                            'system',
                            'high'
                        );
                    }
                }
            }

            const io = req.io;
            const targetUserId = user._id.toString();
            io.to(targetUserId).emit('role_changed', {
                message: 'Your Station Master role has been revoked. You now have standard user access.',
                newRole: 'user'
            });

            io.to('super_admin_room').emit('dashboard_refresh', {
                message: `Station Master ${user.name} was demoted.`
            });

            if (oldStationId) {
                io.to(`station_${oldStationId}`).emit('dashboard_refresh');
            }
            res.json({ message: 'Station Master demoted successfully' });
        } else {
            res.status(400).json({ message: 'User is not a Station Master' });
        }
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

export const getStaffManagementData = async (req, res) => {
    try {
        // 1. Get all stations
        const stations = await Station.find({}).lean();
        
        // 2. Get all current masters and populate their station name
        const masters = await User.find({ role: 'station-master' })
            .populate('station', 'name')
            .select('name email station');

        // 3. Calculate the number of masters per station
        const masterCounts = masters.reduce((acc, master) => {
            if (master.station) {
                const stationId = master.station._id.toString();
                acc[stationId] = (acc[stationId] || 0) + 1;
            }
            return acc;
        }, {});

        // 4. Combine the data for the frontend
        const stationsWithCounts = stations.map(station => ({
            ...station,
            masterCount: masterCounts[station._id.toString()] || 0
        }));

        res.json({
            masters,
            stations: stationsWithCounts,
        });
    } catch (error) { res.status(500).json({ message: 'Server Error' }); }
};

// Cleanup function to remove vehicles from unmanaged stations
export const cleanupUnmanagedStations = async (req, res) => {
    try {
        // Find all stations without masters
        const allStations = await Station.find({}).select('_id');
        const managedStationIds = await User.distinct('station', { role: 'station-master' });
        
        const unmanagedStationIds = allStations
            .map(s => s._id.toString())
            .filter(id => !managedStationIds.map(mid => mid.toString()).includes(id));
        
        // Remove all vehicles from unmanaged stations
        const result = await Vehicle.deleteMany({ 
            station: { $in: unmanagedStationIds } 
        });
        
        res.json({ 
            message: `Cleanup completed. Removed ${result.deletedCount} vehicles from ${unmanagedStationIds.length} unmanaged stations.`,
            deletedVehicles: result.deletedCount,
            unmanagedStations: unmanagedStationIds.length
        });
    } catch (error) { 
        console.error('Cleanup error:', error);
        res.status(500).json({ message: 'Server Error during cleanup' }); 
    }
};

/**
 * Calculates system-wide metrics and caches them in memory
 * @returns {Promise<object>} The calculated analytics object
 */
export const calculateAndCacheSystemAnalytics = async () => {
    const cacheKey = 'super_admin_analytics';
    
    const [
        revenueStats,
        totalVehicles,
        activeRentals,
        loyaltyDistribution,
        topStations,
        monthlyRevenue,
        ticketStats
    ] = await Promise.all([
        // Financials (completed bookings)
        Booking.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: {
                _id: null,
                totalRevenue: { $sum: '$totalCost' },
                averageCost: { $avg: '$totalCost' },
                totalBookings: { $sum: 1 }
            }}
        ]),
        // Total Vehicles
        Vehicle.countDocuments({}),
        // Active Rentals
        Booking.countDocuments({ status: 'active' }),
        // Loyalty Tier distribution
        User.aggregate([
            { $group: {
                _id: '$loyaltyTier',
                count: { $sum: 1 }
            }}
        ]),
        // Top Stations by Revenue
        Booking.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: {
                _id: '$station',
                revenue: { $sum: '$totalCost' },
                bookingsCount: { $sum: 1 }
            }},
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]),
        // Monthly Revenue
        Booking.aggregate([
            { $match: { paymentStatus: 'completed' } },
            { $group: {
                _id: {
                    year: { $year: '$createdAt' },
                    month: { $month: '$createdAt' }
                },
                revenue: { $sum: '$totalCost' },
                count: { $sum: 1 }
            }},
            { $sort: { '_id.year': 1, '_id.month': 1 } },
            { $limit: 12 }
        ]),
        // Ticket Stats
        Promise.all([
            SupportTicket.countDocuments({}),
            SupportTicket.countDocuments({ status: { $in: ['resolved', 'closed'] } })
        ])
    ]);

    // Post-process Top Stations to include station names
    const populatedTopStations = await Station.populate(topStations, {
        path: '_id',
        select: 'name address'
    });

    const formattedTopStations = populatedTopStations.map(item => ({
        stationId: item._id?._id || null,
        name: item._id?.name || 'Unknown Station',
        revenue: item.revenue || 0,
        bookingsCount: item.bookingsCount || 0
    }));

    // Format Monthly Revenue for charting
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedMonthlyRevenue = monthlyRevenue.map(item => ({
        label: `${monthNames[item._id.month - 1]} ${item._id.year}`,
        revenue: item.revenue || 0,
        bookingsCount: item.count || 0
    }));

    const revData = revenueStats[0] || { totalRevenue: 0, averageCost: 0, totalBookings: 0 };
    const utilizationRate = totalVehicles > 0 ? ((activeRentals / totalVehicles) * 100) : 0;
    
    const totalTickets = ticketStats[0];
    const resolvedTickets = ticketStats[1];
    const ticketResolutionRate = totalTickets > 0 ? ((resolvedTickets / totalTickets) * 100) : 100;

    // Loyalty Tier counts
    const loyaltyMap = { platinum: 0, gold: 0, silver: 0, regular: 0, bronze: 0 };
    loyaltyDistribution.forEach(tier => {
        if (tier._id) {
            loyaltyMap[tier._id] = tier.count;
        }
    });

    const analytics = {
        financials: {
            totalRevenue: revData.totalRevenue || 0,
            averageRevenuePerBooking: Math.round((revData.averageCost || 0) * 100) / 100,
            totalBookings: revData.totalBookings || 0
        },
        fleet: {
            totalVehicles,
            activeRentals,
            utilizationRate: Math.round(utilizationRate * 10) / 10
        },
        loyaltyTiers: loyaltyMap,
        topStations: formattedTopStations,
        monthlyRevenue: formattedMonthlyRevenue,
        support: {
            totalTickets,
            resolvedTickets,
            resolutionRate: Math.round(ticketResolutionRate * 10) / 10
        },
        calculatedAt: new Date()
    };

    // Save to cache (expires in 12 hours)
    await cacheService.set(cacheKey, analytics, 43200);
    return analytics;
};

/**
 * Controller endpoint for returning system-wide admin analytics
 */
export const getSystemAnalytics = async (req, res) => {
    try {
        const cacheKey = 'super_admin_analytics';
        const cachedAnalytics = await cacheService.get(cacheKey);
        
        if (cachedAnalytics) {
            console.log('⚡ Cache Hit: Serving super-admin analytics from cache.');
            return res.json(cachedAnalytics);
        }
        
        console.log('🔄 Cache Miss: Computing super-admin analytics...');
        const analytics = await calculateAndCacheSystemAnalytics();
        return res.json(analytics);
    } catch (error) {
        console.error('Error fetching system analytics:', error);
        return res.status(500).json({ message: 'Server Error loading analytics' });
    }
};




