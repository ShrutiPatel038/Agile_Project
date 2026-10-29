import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Checks if a user is logged in via cookie
export const protectRoute = async (req, res, next) => {
    // Prefer Authorization header for SPA calls; fall back to cookie for browser-session auth.
    let token;

    if (req.headers.authorization?.startsWith('Bearer ')) {
        token = req.headers.authorization.split(' ')[1];
    } else {
        token = req.cookies.jwt;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            // Attach the full user object (minus password) to the request
            req.user = await User.findById(decoded.userId).select('-password');
            if (req.user) {
                next();
            } else {
                return res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const stationMaster = (req,res,next) => {
    if(req.user && (req.user.role === 'station-master' || req.user.role === 'super-admin')){
        next();
    }
    else{
        res.status(403).json({message: 'Not authorized as a Station Master or a Super Admin'});
    }
}

// Checks if the logged-in user has the 'station-master' role
export const superAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'super-admin') {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as a Super Admin' });
    }
};