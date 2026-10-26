import mongoose from 'mongoose';
import logger from '../utils/logger.js';

const connectDB = async () => {
  const options = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    retryWrites: true,
    retryReads: true,
  };

  try {
    await mongoose.connect(process.env.MONGO_URI, options);
    logger.info('MongoDB connected', { uri: process.env.MONGO_URI?.split('@').pop() });
  } catch (err) {
    logger.error('MongoDB connection error', { message: err.message });
    logger.info('Retrying MongoDB connection in 5 seconds…');
    setTimeout(connectDB, 5000);
  }
};

mongoose.connection.on('disconnected', () =>
  logger.warn('MongoDB disconnected — attempting to reconnect')
);
mongoose.connection.on('error', (err) =>
  logger.error('MongoDB error', { message: err.message })
);
mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

export default connectDB;
