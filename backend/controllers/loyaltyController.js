import User from '../models/User.js';
import LoyaltyTransaction from '../models/LoyaltyTransaction.js';

// Issue #33: Loyalty and rewards program

export const getLoyaltyProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('loyaltyPoints loyaltyTier totalRides totalSpent');
        
        // Calculate points expiring soon (within 90 days)
        const expiryDate = new Date();
        expiryDate.setDate(expiryDate.getDate() + 90);
        
        const expiringPoints = await LoyaltyTransaction.aggregate([
            {
                $match: {
                    user: req.user._id,
                    type: 'earned',
                    isExpired: false,
                    expiresAt: { $lte: expiryDate, $gte: new Date() }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$points' }
                }
            }
        ]);
        
        // Get tier benefits
        const tierBenefits = getTierBenefits(user.loyaltyTier);
        
        res.json({
            loyaltyPoints: user.loyaltyPoints,
            loyaltyTier: user.loyaltyTier,
            totalRides: user.totalRides,
            totalSpent: user.totalSpent,
            pointsExpiringSoon: expiringPoints[0]?.total || 0,
            tierBenefits,
            nextTier: getNextTier(user.loyaltyTier, user.totalSpent)
        });
    } catch (error) {
        console.error('Error fetching loyalty profile:', error);
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
        res.status(500).json({ message: 'Server Error fetching transactions' });
    }
};

export const redeemPoints = async (req, res) => {
    try {
        const { points, redemptionType } = req.body;
        
        if (!points || points <= 0) {
            return res.status(400).json({ message: 'Invalid points amount' });
        }
        
        const user = await User.findById(req.user._id);
        
        if (user.loyaltyPoints < points) {
            return res.status(400).json({ message: 'Insufficient loyalty points' });
        }
        
        // Minimum redemption: 100 points
        if (points < 100) {
            return res.status(400).json({ message: 'Minimum redemption is 100 points' });
        }
        
        // Calculate discount value (100 points = ₹100 discount)
        const discountValue = points;
        
        // Deduct points
        user.loyaltyPoints -= points;
        await user.save();
        
        // Record transaction
        await LoyaltyTransaction.create({
            user: user._id,
            type: 'redeemed',
            points: -points,
            description: `Redeemed ${points} points for ₹${discountValue} discount`
        });
        
        res.json({
            message: 'Points redeemed successfully',
            discountValue,
            remainingPoints: user.loyaltyPoints
        });
    } catch (error) {
        console.error('Error redeeming points:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

export const getReferralCode = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        
        // Generate referral code if not exists (user ID + random string)
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
        
        if (!referralCode) {
            return res.status(400).json({ message: 'Referral code required' });
        }
        
        const user = await User.findById(req.user._id);
        
        // Check if user already used a referral
        if (user.referredBy) {
            return res.status(400).json({ message: 'You have already used a referral code' });
        }
        
        // Find referrer
        const referrer = await User.findOne({ referralCode });
        
        if (!referrer) {
            return res.status(404).json({ message: 'Invalid referral code' });
        }
        
        if (referrer._id.toString() === user._id.toString()) {
            return res.status(400).json({ message: 'Cannot use your own referral code' });
        }
        
        // Award bonus points
        const referralBonus = 200;
        const referrerBonus = 500;
        
        // Award to new user
        user.loyaltyPoints += referralBonus;
        user.referredBy = referrer._id;
        await user.save();
        
        await LoyaltyTransaction.create({
            user: user._id,
            type: 'referral',
            points: referralBonus,
            description: `Referral bonus for using code ${referralCode}`
        });
        
        // Award to referrer
        referrer.loyaltyPoints += referrerBonus;
        await referrer.save();
        
        await LoyaltyTransaction.create({
            user: referrer._id,
            type: 'referral',
            points: referrerBonus,
            description: `Referral bonus for referring ${user.name}`
        });
        
        res.json({
            message: 'Referral code applied successfully',
            bonusPoints: referralBonus
        });
    } catch (error) {
        console.error('Error applying referral:', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Helper functions
function getTierBenefits(tier) {
    const benefits = {
        bronze: {
            pointsMultiplier: 1,
            discount: 0,
            prioritySupport: false,
            freeExtensions: 0
        },
        silver: {
            pointsMultiplier: 1.25,
            discount: 5,
            prioritySupport: false,
            freeExtensions: 1
        },
        gold: {
            pointsMultiplier: 1.5,
            discount: 10,
            prioritySupport: true,
            freeExtensions: 2
        },
        platinum: {
            pointsMultiplier: 2,
            discount: 15,
            prioritySupport: true,
            freeExtensions: 5
        }
    };
    
    return benefits[tier] || benefits.bronze;
}

function getNextTier(currentTier, totalSpent) {
    const tiers = {
        bronze: { next: 'silver', required: 10000, current: totalSpent },
        silver: { next: 'gold', required: 25000, current: totalSpent },
        gold: { next: 'platinum', required: 50000, current: totalSpent },
        platinum: { next: null, required: null, current: totalSpent }
    };
    
    return tiers[currentTier];
}
