import rateLimit from 'express-rate-limit';

// Issue #8: Rate limiting for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many login attempts, please try again after 15 minutes',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});

// Rate limiter for payment endpoints
export const paymentLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute
    message: 'Too many payment requests, please slow down',
    standardHeaders: true,
    legacyHeaders: false
});

// Rate limiter for booking endpoints
export const bookingLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 20, // 20 bookings per 10 minutes
    message: 'Too many booking requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// General API rate limiter
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
});

// OTP rate limiter (strict)
export const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 OTP requests per hour
    message: 'Too many OTP requests, please try again after an hour',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false
});
