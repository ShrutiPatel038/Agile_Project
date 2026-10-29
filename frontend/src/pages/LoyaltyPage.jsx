import { useEffect, useState } from 'react'
import api from '../services/api'

export default function LoyaltyPage() {
  const [profile, setProfile] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [referralCodeInput, setReferralCodeInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [referralSuccess, setReferralSuccess] = useState('')
  const [referralError, setReferralError] = useState('')
  const [submittingReferral, setSubmittingReferral] = useState(false)

  const fetchLoyaltyData = async () => {
    try {
      const [profileRes, txnRes] = await Promise.all([
        api.get('/loyalty/profile'),
        api.get('/loyalty/transactions')
      ])
      setProfile(profileRes.data)
      setTransactions(txnRes.data || [])
    } catch (err) {
      console.error('Failed to fetch loyalty details', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLoyaltyData()
  }, [])

  const handleApplyReferral = async (e) => {
    e.preventDefault()
    if (!referralCodeInput.trim()) return

    setSubmittingReferral(true)
    setReferralError('')
    setReferralSuccess('')
    try {
      const { data } = await api.post('/loyalty/apply-referral', {
        referralCode: referralCodeInput
      })
      setReferralSuccess(data.message || 'Referral applied successfully! 200 points added.')
      setReferralCodeInput('')
      fetchLoyaltyData() // Reload profile data
    } catch (err) {
      setReferralError(err.response?.data?.message || 'Failed to apply referral code')
    } finally {
      setSubmittingReferral(false)
    }
  }

  const getTierDetails = (tier) => {
    switch (tier) {
      case 'platinum':
        return {
          name: 'Platinum',
          bg: 'bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white',
          badge: 'bg-blue-600 text-white',
          benefits: ['2.0x points multiplier', '15% ride discount', 'Priority support line', '5 free ride extensions']
        }
      case 'gold':
        return {
          name: 'Gold',
          bg: 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white',
          badge: 'bg-yellow-400 text-amber-950',
          benefits: ['1.5x points multiplier', '10% ride discount', 'Priority support line', '2 free ride extensions']
        }
      case 'silver':
        return {
          name: 'Silver',
          bg: 'bg-gradient-to-r from-slate-400 to-slate-600 text-white',
          badge: 'bg-slate-300 text-slate-800',
          benefits: ['1.25x points multiplier', '5% ride discount', '1 free ride extension']
        }
      case 'bronze':
      default:
        return {
          name: 'Bronze',
          bg: 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white',
          badge: 'bg-orange-200 dark:bg-orange-900 text-orange-950 dark:text-orange-200',
          benefits: ['1.0x points multiplier', 'Standard support services']
        }
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  const tier = getTierDetails(profile?.loyaltyTier || 'bronze')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Loyalty Dashboard</h1>
      </div>

      {/* Tier Card */}
      <div className={`p-6 rounded-2xl shadow-xl transition-all duration-300 ${tier.bg}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${tier.badge}`}>
              {tier.name} Member
            </span>
            <h2 className="text-4xl font-black mt-2">₹{profile?.totalSpent?.toLocaleString('en-IN') || 0} Spent</h2>
            <p className="text-sm opacity-90 mt-1">Earn points on every trip and progress to next tiers for massive savings</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl text-center min-w-[150px]">
            <span className="text-xs uppercase font-semibold opacity-90">Points Balance</span>
            <div className="text-3xl font-black mt-1">{profile?.loyaltyPoints || 0}</div>
            <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full inline-block mt-2">100 points = ₹100</span>
          </div>
        </div>

        <div className="mt-6 border-t border-white/20 pt-4">
          <h4 className="font-semibold text-sm uppercase tracking-wider mb-2">My Tier Benefits:</h4>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm opacity-95">
            {tier.benefits.map((benefit, i) => (
              <li key={i} className="flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Referral System */}
        <div className="card p-6 space-y-4">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Refer & Earn</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            Share your unique referral code. When a friend signs up using your code, they get **200 points** instantly, and you get **500 points** after their first booking!
          </p>

          <div className="bg-gray-50 dark:bg-gray-800/40 p-4 rounded-2xl flex items-center justify-between border border-gray-200 dark:border-gray-800">
            <div>
              <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider block">My Referral Code</span>
              <span className="text-2xl font-extrabold text-gray-900 dark:text-gray-200 tracking-wider font-mono">{profile?.referralCode || 'N/A'}</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(profile?.referralCode || '')
                alert('Copied to clipboard!')
              }}
              className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              Copy Code
            </button>
          </div>

          <form onSubmit={handleApplyReferral} className="space-y-3 pt-3">
            <label className="block text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">Got a referral code?</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCodeInput}
                onChange={(e) => setReferralCodeInput(e.target.value)}
                placeholder="Enter referral code"
                className="input py-2 flex-1"
              />
              <button
                type="submit"
                disabled={submittingReferral || !referralCodeInput}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-xl text-xs font-bold disabled:opacity-50 transition-all"
              >
                Apply
              </button>
            </div>
            {referralSuccess && <p className="text-xs text-green-600 dark:text-green-400 font-semibold">{referralSuccess}</p>}
            {referralError && <p className="text-xs text-red-600 dark:text-red-400 font-semibold">{referralError}</p>}
          </form>
        </div>

        {/* Level Progression Progress */}
        <div className="card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tier Level Status</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Track your progress toward upgrading your tier.</p>
          </div>

          <div className="space-y-4 my-6">
            <div>
              <div className="flex justify-between text-xs font-bold text-gray-600 dark:text-gray-400 mb-2">
                <span>Total Spent Progress</span>
                <span>₹{profile?.totalSpent || 0} / {profile?.loyaltyTier === 'bronze' ? '₹10,000' : profile?.loyaltyTier === 'silver' ? '₹25,000' : profile?.loyaltyTier === 'gold' ? '₹50,000' : 'Max Level'}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      ((profile?.totalSpent || 0) /
                        (profile?.loyaltyTier === 'bronze'
                          ? 10000
                          : profile?.loyaltyTier === 'silver'
                          ? 25000
                          : 50000)) *
                        100
                    )}%`
                  }}
                ></div>
              </div>
            </div>
            <div className="text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              Upgrade to higher tiers (Silver, Gold, Platinum) by completing more bookings. Higher tiers enjoy higher point multipliers and higher base discounts!
            </div>
          </div>

          <div className="pt-4 flex justify-between text-xs text-gray-600 dark:text-gray-400 font-medium">
            <div>Total Bookings: <span className="font-bold text-gray-900 dark:text-white">{profile?.totalRides || 0}</span></div>
          </div>
        </div>
      </div>

      {/* Point History */}
      <div className="card p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Point Transactions History</h3>
        
        {transactions.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-8">No loyalty point transactions found.</p>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-800 max-h-80 overflow-y-auto pr-2">
            {transactions.map((txn) => (
              <div key={txn._id} className="py-3.5 flex justify-between items-center text-xs">
                <div>
                  <p className="font-bold text-gray-800 dark:text-gray-200 capitalize">{txn.description}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{new Date(txn.createdAt).toLocaleDateString()} {new Date(txn.createdAt).toLocaleTimeString()}</p>
                </div>
                <div className={`font-bold text-sm ${txn.type === 'earned' ? 'text-accent-600 dark:text-accent-400' : 'text-red-600 dark:text-red-400'}`}>
                  {txn.type === 'earned' ? '+' : '-'}{txn.points} pts
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
