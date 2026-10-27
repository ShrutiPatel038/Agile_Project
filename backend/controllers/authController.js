import User from '../models/User.js';
import jwt from 'jsonwebtoken';
import logger from '../utils/logger.js';

const getCookieOptions = () => {
  const frontendUrl = (process.env.FRONTEND_URL || '').trim().replace(/\/+$/, '');
  const isCrossSite = Boolean(frontendUrl) &&
    !frontendUrl.includes('localhost') &&
    !frontendUrl.includes('127.0.0.1');
  return {
    httpOnly: true,
    secure: isCrossSite,
    sameSite: isCrossSite ? 'none' : 'lax',
  };
};

const generateTokenAndSetCookie = (res, user) => {
  const token = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
  res.cookie('jwt', token, {
    ...getCookieOptions(),
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return token;
};

export const registerUser = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password });
    const token = generateTokenAndSetCookie(res, user);
    logger.info('User registered', { userId: user._id, role: user.role });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
  } catch (error) {
    logger.error('registerUser error', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      const token = generateTokenAndSetCookie(res, user);
      logger.info('User logged in', { userId: user._id, role: user.role });
      res.status(200).json({ _id: user._id, name: user.name, email: user.email, role: user.role, token });
    } else {
      logger.warn('Failed login attempt', { email });
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    logger.error('loginUser error', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const logoutUser = (req, res) => {
  res.cookie('jwt', '', { ...getCookieOptions(), expires: new Date(0) });
  logger.info('User logged out', { userId: req.user?._id });
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getMe = async (req, res) => {
  res.status(200).json(req.user);
};
