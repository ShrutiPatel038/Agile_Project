import Favorite from '../models/Favorite.js';
import logger from '../utils/logger.js';

export const toggleFavorite = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const existing = await Favorite.findOne({ user: req.user._id, vehicle: vehicleId });
    if (existing) { await Favorite.deleteOne({ _id: existing._id }); return res.json({ isFavorite: false, message: 'Removed from favorites' }); }
    await Favorite.create({ user: req.user._id, vehicle: vehicleId });
    res.json({ isFavorite: true, message: 'Added to favorites' });
  } catch (error) {
    logger.error('Error toggling favorite', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getFavorites = async (req, res) => {
  try {
    const favorites = await Favorite.find({ user: req.user._id }).populate('vehicle').sort({ createdAt: -1 });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const checkFavorite = async (req, res) => {
  try {
    const favorite = await Favorite.findOne({ user: req.user._id, vehicle: req.params.vehicleId });
    res.json({ isFavorite: !!favorite });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
