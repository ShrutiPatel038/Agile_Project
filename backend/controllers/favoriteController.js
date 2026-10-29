import Favorite from '../models/Favorite.js';

export const toggleFavorite = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        
        const existing = await Favorite.findOne({ user: req.user._id, vehicle: vehicleId });
        
        if (existing) {
            await Favorite.deleteOne({ _id: existing._id });
            res.json({ isFavorite: false, message: 'Removed from favorites' });
        } else {
            await Favorite.create({ user: req.user._id, vehicle: vehicleId });
            res.json({ isFavorite: true, message: 'Added to favorites' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server Error toggling favorite' });
    }
};

export const getFavorites = async (req, res) => {
    try {
        const favorites = await Favorite.find({ user: req.user._id })
            .populate('vehicle')
            .sort({ createdAt: -1 });
        res.json(favorites);
    } catch (error) {
        res.status(500).json({ message: 'Server Error fetching favorites' });
    }
};

export const checkFavorite = async (req, res) => {
    try {
        const { vehicleId } = req.params;
        const favorite = await Favorite.findOne({ user: req.user._id, vehicle: vehicleId });
        res.json({ isFavorite: !!favorite });
    } catch (error) {
        res.status(500).json({ message: 'Server Error checking favorite' });
    }
};