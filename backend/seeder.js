import mongoose from 'mongoose';
import dotenv from 'dotenv';
import colors from 'colors';

// Load env vars
dotenv.config();

// Load models
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import Booking from './models/Booking.js';
import Station from './models/Station.js'; // Good to clear stations too

// Load data files
import users from './data/users.js';
import vehiclesData from './data/vehicles.js';
import stationsData from './data/stations.js';

// Connect to DB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected for Seeder...'.cyan.underline);
    } catch (err) {
        console.error(`Error: ${err.message}`.red.bold);
        process.exit(1);
    }
};

const importData = async () => {
    await connectDB();
    try {
        // 1. Clear everything
        await Booking.deleteMany();
        await Vehicle.deleteMany();
        await User.deleteMany();
        await Station.deleteMany();

        // 2. Insert Stations (insertMany is fine here, no hooks needed)
        const createdStations = await Station.insertMany(stationsData);
        console.log('Stations Imported!'.yellow);

        // 3. Insert Users (CHANGE THIS LINE)
        // From: await User.insertMany(users);
        // To:
        await User.create(users); // This triggers the pre('save') hook for hashing!
        console.log('Users Imported and Hashed!'.yellow);

        // 4. Prepare and insert Vehicles
        const vehiclesWithStations = vehiclesData.map((vehicle, index) => ({
            ...vehicle,
            station: createdStations[index % createdStations.length]._id,
        }));
        await Vehicle.insertMany(vehiclesWithStations);
        console.log('Vehicles Imported!'.yellow);

        console.log('All Data Imported Successfully!'.green.inverse);
        process.exit();

    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

// Destroy all data
const destroyData = async () => {
    await connectDB();
    try {
        await User.deleteMany();
        await Vehicle.deleteMany();
        await Booking.deleteMany();
        await Station.deleteMany();

        console.log('All Data Destroyed!'.red.inverse);
        process.exit();
    } catch (error) {
        console.error(`${error}`.red.inverse);
        process.exit(1);
    }
};

// Check command-line arguments to decide which function to run
if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}