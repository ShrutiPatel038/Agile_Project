import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';

dotenv.config();

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
        cb(new Error(`CORS blocked: ${origin}`));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
