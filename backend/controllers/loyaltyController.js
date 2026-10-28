import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';
import logger from '../utils/logger.js';

const getTierBenefits = (tier) => ({
  bronze:   { pointsMultiplier: 1,    discount: 0,  prioritySupport: false, freeExtensions: 0 },
  silver:   { pointsMultiplier: 1.25, discount: 5,  prioritySupport: false, freeExtensions: 1 },
  gold:     { pointsMultiplier: 1.5,  discount: 10, prioritySupport: true,  freeExtensions: 2 },
  platinum: { pointsMultiplier: 2,    discount: 15, prioritySupport: true,  freeExtensions: 5 },
}[tier] || { pointsMultiplier: 1, discount: 0, prioritySupport: false, freeExtensions: 0 });

const getNextTier = (tier, totalSpent) => ({
  bronze: { next: 'silver', required: 10000, current: totalSpent },
  silver: { next: 'gold', required: 25000, current: totalSpent },
  gold:   { next: 'platinum', required: 50000, current: totalSpent },
  platinum: { next: null, required: null, current: totalSpent },
}[tier]);

export const getLoyaltyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('loyaltyPoints loyaltyTier totalRides totalSpent');
    const expiryDate = new Date(); expiryDate.setDate(expiryDate.getDate() + 90);
    const expiring = await LoyaltyTransaction.aggregate([
      { $match: { user: req.user._id, type: 'earned', isExpired: false, expiresAt: { $lte: expiryDate, $gte: new Date() } } },
      { $group: { _id: null, total: { $sum: '$points' } } },
    ]);
    res.json({
      loyaltyPoints: user.loyaltyPoints, loyaltyTier: user.loyaltyTier,
      totalRides: user.totalRides, totalSpent: user.totalSpent,
      pointsExpiringSoon: expiring[0]?.total || 0,
      tierBenefits: getTierBenefits(user.loyaltyTier),
      nextTier: getNextTier(user.loyaltyTier, user.totalSpent),
    });
  } catch (error) {
    logger.error('Error fetching loyalty profile', { message: error.message });
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getLoyaltyTransactions = async (req, res) => {
  try {
    const transactions = await LoyaltyTransaction.find({ user: req.user._id })
      .populate('booking', 'vehicle startTime')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const redeemPoints = async (req, res) => {
  try {
    const { points } = req.body;
    if (!points || points <= 0) return res.status(400).json({ message: 'Invalid points amount' });
    const user = await User.findById(req.user._id);
    if (user.loyaltyPoints < points) return res.status(400).json({ message: 'Insufficient loyalty points' });
    if (points < 100) return res.status(400).json({ message: 'Minimum redemption is 100 points' });

    user.loyaltyPoints -= points;
    await user.save();
    await LoyaltyTransaction.create({ user: user._id, type: 'redeemed', points: -points, description: `Redeemed ${points} points for ₹${points} discount` });
    res.json({ message: 'Points redeemed successfully', discountValue: points, remainingPoints: user.loyaltyPoints });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const getReferralCode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.referralCode) {
      user.referralCode = `EV${user._id.toString().slice(-6).toUpperCase()}${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
      await user.save();
    }
    res.json({ referralCode: user.referralCode });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

export const applyReferralCode = async (req, res) => {
  try {
    const { referralCode } = req.body;
    if (!referralCode) return res.status(400).json({ message: 'Referral code required' });
    const user = await User.findById(req.user._id);
    if (user.referredBy) return res.status(400).json({ message: 'You have already used a referral code' });
    const referrer = await User.findOne({ referralCode });
    if (!referrer) return res.status(404).json({ message: 'Invalid referral code' });
    if (referrer._id.toString() === user._id.toString()) return res.status(400).json({ message: 'Cannot use your own referral code' });

    user.loyaltyPoints += 200;
    user.referredBy = referrer._id;
    await user.save();
    await LoyaltyTransaction.create({ user: user._id, type: 'referral', points: 200, description: `Referral bonus for code ${referralCode}` });

    referrer.loyaltyPoints += 500;
    await referrer.save();
    await LoyaltyTransaction.create({ user: referrer._id, type: 'referral', points: 500, description: `Referral bonus for referring ${user.name}` });

    res.json({ message: 'Referral code applied successfully', bonusPoints: 200 });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};
