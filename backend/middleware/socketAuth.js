import jwt from 'jsonwebtoken';

const extractJwtFromCookieHeader = (cookieHeader) => {
    if (!cookieHeader) return null;
    const jwtCookie = cookieHeader
        .split(';')
        .map((part) => part.trim())
        .find((part) => part.startsWith('jwt='));
    return jwtCookie ? decodeURIComponent(jwtCookie.slice(4)) : null;
};

// Issue #28: Socket.IO authentication middleware
export const socketAuthMiddleware = (socket, next) => {
    try {
        // Get token from handshake auth, query, or cookies
        const tokenFromHandshake = socket.handshake.auth?.token || socket.handshake.query?.token;
        const tokenFromCookie = extractJwtFromCookieHeader(socket.handshake.headers?.cookie);
        const token = tokenFromHandshake || tokenFromCookie;
        
        if (!token) {
            console.warn('⚠️ Socket connection rejected: No token provided');
            return next(new Error('Authentication error: No token provided'));
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Attach user ID to socket
        socket.userId = decoded.userId;
        socket.userRole = decoded.role; // If role is included in JWT
        
        console.log(`✅ Socket authenticated: User ${socket.userId}`);
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            console.error('⚠️ Socket auth error: Invalid token format');
        } else if (error.name === 'TokenExpiredError') {
            console.error('⚠️ Socket auth error: Token expired');
        } else {
            console.error('⚠️ Socket auth error:', error.message);
        }
        return next(new Error('Authentication error: Invalid or expired token'));
    }
};

// Room access control middleware
export const validateRoomAccess = (socket, roomName) => {
    const userId = socket.userId;
    const userRole = socket.userRole;
    
    // Parse room name to determine type
    if (roomName.startsWith('station_')) {
        // Station rooms - only station masters and super admins for that station
        return userRole === 'station-master' || userRole === 'super-admin';
    } else if (roomName === 'super_admin_room') {
        // Super admin room - only super admins
        return userRole === 'super-admin';
    } else if (roomName === 'support_staff') {
        // Support staff room - station masters and super admins
        return userRole === 'station-master' || userRole === 'super-admin';
    } else if (roomName === userId) {
        // Personal room - only the user themselves
        return true;
    }
    
    // Default deny
    return false;
};
