import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const extractJwtFromCookieHeader = (cookieHeader) => {
  if (!cookieHeader) return null;
  const jwtCookie = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith('jwt='));
  return jwtCookie ? decodeURIComponent(jwtCookie.slice(4)) : null;
};

export const socketAuthMiddleware = (socket, next) => {
  try {
    const tokenFromHandshake = socket.handshake.auth?.token || socket.handshake.query?.token;
    const tokenFromCookie    = extractJwtFromCookieHeader(socket.handshake.headers?.cookie);
    const token = tokenFromHandshake || tokenFromCookie;

    if (!token) {
      logger.warn('Socket connection rejected: no token');
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = decoded.userId;
    socket.userRole = decoded.role;
    logger.debug('Socket authenticated', { userId: socket.userId });
    next();
  } catch (error) {
    logger.warn('Socket auth error', { message: error.message });
    return next(new Error('Authentication error: Invalid or expired token'));
  }
};

export const validateRoomAccess = (socket, roomName) => {
  const { userId, userRole } = socket;
  if (roomName.startsWith('station_'))   return userRole === 'station-master' || userRole === 'super-admin';
  if (roomName === 'super_admin_room')   return userRole === 'super-admin';
  if (roomName === 'support_staff')      return userRole === 'station-master' || userRole === 'super-admin';
  if (roomName === userId)               return true;
  return false;
};
