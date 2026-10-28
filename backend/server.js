import http from 'http';
import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'ioredis';

dotenv.config();

import logger, { morganMiddleware } from './utils/logger.js';
import connectDB from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { socketAuthMiddleware, validateRoomAccess } from './middleware/socketAuth.js';
import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import stationMasterRoutes from './routes/stationMasterRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import { handlePaymentWebhook } from './controllers/paymentController.js';
import { startEmailWorker } from './jobs/emailWorker.js';
import { startPaymentTimeoutWorker } from './jobs/paymentTimeoutWorker.js';
import { startOvertimeWorker } from './jobs/overtimeWorker.js';
import { startCronJobs } from './jobs/cronJobs.js';

connectDB();

const app = express();
const server = http.createServer(app);

const clientURL = process.env.FRONTEND_URL || 'http://localhost:5173';
const localhostOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
];
const normalizeOrigin = (url) => url.replace(/\/+$/, '');
const allowedOrigins =
  process.env.NODE_ENV === 'production'
    ? clientURL.split(',').map((o) => normalizeOrigin(o.trim())).filter(Boolean)
    : localhostOrigins;

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(normalizeOrigin(origin))) {
        cb(null, true);
      } else {
        logger.warn('CORS blocked request', { origin });
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

// Webhook must receive raw body for Razorpay HMAC verification — mount before express.json()
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), handlePaymentWebhook);

app.use(morganMiddleware);
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Inject Socket.IO instance into requests
app.use((req, _res, next) => { req.io = global.io; next(); });

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/station-master', stationMasterRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Socket.IO setup
const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
  transports: ['websocket', 'polling'],
});
global.io = io;

// Redis adapter for multi-instance deployments
const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
try {
  const pubClient = createClient(redisUrl);
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  logger.info('Socket.IO Redis adapter connected');
} catch (err) {
  logger.warn('Socket.IO Redis adapter unavailable, running in-memory', { message: err.message });
}

io.use(socketAuthMiddleware);

io.on('connection', (socket) => {
  logger.debug('Socket connected', { socketId: socket.id, userId: socket.userId });

  // Auto-join personal room
  socket.join(socket.userId);

  socket.on('joinAdminRooms', (user) => {
    if (user?.role === 'super-admin') socket.join('super_admin_room');
    if ((user?.role === 'station-master' || user?.role === 'super-admin') && user?.managedStation) {
      socket.join(`station_${user.managedStation}`);
    }
    if (user?.role === 'station-master' || user?.role === 'super-admin') socket.join('support_staff');
  });

  socket.on('joinRoom', (roomName) => {
    if (validateRoomAccess(socket, roomName)) {
      socket.join(roomName);
    } else {
      socket.emit('error', { message: 'Access denied to room' });
    }
  });

  socket.on('disconnect', () => {
    logger.debug('Socket disconnected', { socketId: socket.id });
  });
});

// Start background workers and cron jobs after server is set up
startEmailWorker();
startPaymentTimeoutWorker();
startOvertimeWorker();
startCronJobs();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV });
});

export default app;
