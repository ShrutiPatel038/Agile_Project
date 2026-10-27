import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const protectRoute = async (req, res, next) => {
  let token;
  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  } else {
    token = req.cookies.jwt;
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) {
      return res.status(404).json({ message: 'User not found' });
    }
    next();
  } catch (error) {
    logger.warn('Token verification failed', { message: error.message });
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const stationMaster = (req, res, next) => {
  if (req.user && (req.user.role === 'station-master' || req.user.role === 'super-admin')) {
    return next();
  }
  res.status(403).json({ message: 'Not authorized as a Station Master or Super Admin' });
};

export const superAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'super-admin') {
    return next();
  }
  res.status(403).json({ message: 'Not authorized as a Super Admin' });
};
