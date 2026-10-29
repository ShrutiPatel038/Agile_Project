// Load .env before any other module reads process.env (ESM imports are hoisted)
import 'dotenv/config';

import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';
import { Server } from 'socket.io';

import logger, { morganMiddleware } from './utils/logger.js';
import connectDB from './config/db.js';
import { startEmailWorker } from './jobs/emailWorker.js';
import { startPaymentTimeoutWorker } from './jobs/paymentTimeoutWorker.js';
import { startOvertimeWorker } from './jobs/overtimeWorker.js';
import { startCronJobs } from './jobs/cronJobs.js';
import { startPaymentTimeoutJob } from './jobs/paymentTimeout.js';
import { socketAuthMiddleware, validateRoomAccess } from './middleware/socketAuth.js';

import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import stationMasterRoutes from './routes/stationMasterRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import otpRoutes from './routes/otpRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import favoriteRoutes from './routes/favoriteRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import refundRoutes from './routes/refundRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import loyaltyRoutes from './routes/loyaltyRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

connectDB();

const app = express();
const server = http.createServer(app);

const clientURL = process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:5173';
const normalizeOrigin = (url) => url.replace(/\/+$/, '');
const localhostOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
    'http://127.0.0.1:5175',
];

const isProduction = process.env.NODE_ENV === 'production';

// Local development allows several Vite ports; production adds the configured client URL(s).
const allowedOrigins = isProduction
    ? [
        ...clientURL.split(',').map((origin) => normalizeOrigin(origin.trim())).filter(Boolean),
        ...localhostOrigins,
    ]
    : [...localhostOrigins, 'https://ev-rental-system.onrender.com'];

// In development any localhost port is allowed, so several frontends (one per role) can run at once.
const devLocalhostPattern = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const isAllowedOrigin = (origin) => {
    const normalized = normalizeOrigin(origin);
    return allowedOrigins.includes(normalized) || (!isProduction && devLocalhostPattern.test(normalized));
};

const corsOptions = {
    origin: function (origin, callback) {
        // `!origin` allows requests from tools like Postman (which have no origin).
        if (!origin || isAllowedOrigin(origin)) {
            callback(null, true);
        } else {
            logger.warn('CORS blocked request', { origin });
            callback(new Error(`Not allowed by CORS. Origin: ${origin}`));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(morganMiddleware);

// Razorpay webhook needs raw body for signature verification.
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static images
app.use('/images', express.static(path.join(__dirname, 'images')));

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Socket.IO runs on the default in-memory adapter (single backend instance)
const io = new Server(server, {
    cors: {
        origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin)),
        methods: ['GET', 'POST'],
        credentials: true
    }
});

// Socket.IO authentication middleware
io.use(socketAuthMiddleware);

// Handle socket connections with room access control
io.on('connection', (socket) => {
    logger.debug('Socket connected', { userId: socket.userId, socketId: socket.id });

    // Automatically join user's personal room
    socket.join(socket.userId);

    // Handle generic room join requests with validation
    socket.on('join_room', (roomName) => {
        if (validateRoomAccess(socket, roomName)) {
            socket.join(roomName);
            logger.debug('Socket joined room', { userId: socket.userId, roomName });
        } else {
            socket.emit('error', { message: 'Unauthorized room access' });
            logger.warn('Socket room access denied', { userId: socket.userId, roomName });
        }
    });

    // Handle role-based room joining (for backward compatibility with frontend)
    socket.on('joinAdminRooms', (user) => {
        if (user.role === 'super-admin') {
            socket.join('super_admin_room');
        }
        if (user.role === 'station-master' && user.station) {
            socket.join(`station_${user.station}`);
        }
    });

    socket.on('disconnect', () => {
        logger.debug('Socket disconnected', { userId: socket.userId, socketId: socket.id });
    });
});

// Make 'io' accessible in controllers
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Make io globally available for cron jobs
global.io = io;

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/station-master', stationMasterRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/refund', refundRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/loyalty', loyaltyRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
    logger.error('Unhandled error', { message: err.message, stack: err.stack });
    res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

// Command-line options for running extra local instances:
//   node server.js --port=5001             → listen on another port (overrides PORT)
//   node server.js --port=5001 --no-jobs   → skip cron jobs so they don't run twice against the same DB
const argValue = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
const PORT = argValue('port') || process.env.PORT || 5000;
const runScheduledJobs = !process.argv.includes('--no-jobs');

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use. Stop the other process or start with --port=<another port>`);
        process.exit(1);
    }
    throw err;
});

server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV, scheduledJobs: runScheduledJobs });

    // Start background workers
    startEmailWorker();
    startPaymentTimeoutWorker();
    startOvertimeWorker();

    // Start the scheduled jobs after the server is successfully running
    if (runScheduledJobs) {
        startCronJobs();
        startPaymentTimeoutJob();
    } else {
        logger.info('Cron jobs disabled on this instance (--no-jobs)');
    }
});

export default app;
