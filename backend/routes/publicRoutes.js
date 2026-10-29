import express from 'express';
import Station from '../models/Station.js';
import Vehicle from '../models/Vehicle.js';
import Booking from '../models/Booking.js';

import { cacheService } from '../services/cacheService.js';

const router = express.Router();

// GET /api/public/stations
router.get('/stations', async(req,res) => {
    try {
        const cacheKey = 'public:stations';
        
        // Try getting cached stations list
        const cachedStations = await cacheService.get(cacheKey);
        if (cachedStations) {
            console.log('⚡ Cache Hit: serving stations list from memory cache');
            return res.json(cachedStations);
        }
        
        console.log('🐢 Cache Miss: fetching stations list from MongoDB');
        const stations = await Station.find({});
        
        // Cache the list for 1 hour (3600 seconds)
        await cacheService.set(cacheKey, stations, 3600);
        
        res.json(stations);
    } catch (error) {
        console.error("Error fetching stations:", error);
        res.status(500).json({ message: "Server Error: Could not fetch stations." });
    }
});

// GET /api/public/vehicles?stationId=...&startTime=...&endTime=...
router.get('/vehicles', async(req,res) => {
    try{
        const {stationId,startTime,endTime}=req.query;
        if(!stationId || !startTime || !endTime){
            return res.status(400).json({message:'Station ID, start time and end time is required'});
        }
        const requestedStartTime=new Date(startTime);
        const requestedEndTime=new Date(endTime);

        // Find all bookings that conflict with the requested time slot at this station. A conflict exists if an existing bookings overlaps with the requested time.
        const conflictingBookings=await Booking.find({
            station:stationId,
            //Find bookings that are not cancelled
            status: {$in: ['pending-confirmation','confirmed','active']},
            startTime: {$lt: requestedEndTime},
            endTime: {$gt: requestedStartTime}
        });

        // This is a much simpler and more robust way to check for overlaps.
        // It finds any booking that starts before the requested slot ends,
        // AND ends after the requested slot starts.

        //2. Get the IDs of all vehicles invlolved in these conflicts
        const conflictingVehicleIds=conflictingBookings.map(booking=>booking.vehicle);

        // We only check if the vehicle is NOT under maintenance.
        // We IGNORE the 'booked' or 'pending' status because the conflict check already handles it.
        const availableVehicles=await Vehicle.find({station:stationId,status: {$ne: 'maintenance'},_id: {$nin: conflictingVehicleIds}});
        res.json(availableVehicles);
    } catch(error){
        console.error("Error fetching vehicles:",error);
        res.status(500).json({message:"Server Error: Could not fetch vehicles."});
    }
})

export default router;

