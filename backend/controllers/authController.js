import User from '../models/User.js';
import jwt from 'jsonwebtoken';

const getCookieOptions = () => {
    const frontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
    const isLocalFrontend = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1');
    const isCrossSiteProduction = Boolean(frontendUrl) && !isLocalFrontend;

    return {
        httpOnly: true,
        secure: isCrossSiteProduction,
        sameSite: isCrossSiteProduction ? 'none' : 'lax',
    };
};

// Helper function to create and set the cookie
const generateTokenAndSetCookie = (res, user) => {
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.cookie('jwt', token, {
        ...getCookieOptions(),
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export const registerUser = async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userExists = await User.findOne({ email });
        if (userExists) return res.status(400).json({ message: 'User already exists' });
        
        const user = await User.create({ name, email, password });
        generateTokenAndSetCookie(res, user);
        
        const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
        res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (user && (await user.matchPassword(password))) {
            generateTokenAndSetCookie(res, user);
            const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
            res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

export const logoutUser = (req, res) => {
    res.cookie('jwt', '', {
        ...getCookieOptions(),
        expires: new Date(0),
    });
    res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
    // req.user is attached by the protectRoute middleware
    res.status(200).json(req.user);
};