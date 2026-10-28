import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();

import logger, { morganMiddleware } from './utils/logger.js';
import connectDB from './config/db.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import publicRoutes from './routes/publicRoutes.js';
import superAdminRoutes from './routes/superAdminRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

connectDB();

const app = express();

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

app.use(morganMiddleware);
app.use(generalLimiter);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/bookings', bookingRoutes);

// Global error handler
app.use((err, _req, res, _next) => {
  logger.error('Unhandled error', { message: err.message, stack: err.stack });
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, { env: process.env.NODE_ENV });
});

export default app;
