import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many payment requests, please slow down',
  standardHeaders: true,
  legacyHeaders: false,
});

export const bookingLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  message: 'Too many booking requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many OTP requests, please try again after an hour',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});
