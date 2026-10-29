import { useState, useEffect } from 'react'
import api from '../services/api'

const PhoneVerification = () => {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState('phone') // 'phone' or 'otp'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    checkVerificationStatus()
  }, [])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const checkVerificationStatus = async () => {
    try {
      const { data } = await api.get('/otp/status')
      setIsVerified(data.isPhoneVerified)
      if (data.phone) setPhone(data.phone)
    } catch (error) {
      console.error('Failed to check verification status')
    }
  }

  const sendOTP = async (e) => {
    e.preventDefault()
    if (!phone || phone.length < 10) {
      setError('Please enter a valid phone number')
      return
    }

    console.log('Sending OTP to:', phone)
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/otp/send', { phone })
      console.log('OTP send response:', response.data)
      setStep('otp')
      setCountdown(60) // 60 seconds countdown
    } catch (err) {
      console.error('OTP send error:', err)
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (e) => {
    e.preventDefault()
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    setError('')
    try {
      await api.post('/otp/verify', { otp, phone })
      setIsVerified(true)
      alert('Phone number verified successfully!')
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  if (isVerified) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center">
          <span className="text-green-600 text-xl mr-2">✓</span>
          <div>
            <p className="text-green-800 font-medium">Phone Verified</p>
            <p className="text-green-600 text-sm">{phone}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Verify Phone Number</h3>
      <p className="text-sm text-gray-600 mb-4">
        Phone verification is required for booking vehicles and emergency contact.
      </p>

      {step === 'phone' ? (
        <form onSubmit={sendOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Phone Number</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 text-sm text-gray-900 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md">
                +91
              </span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit number"
                maxLength="10"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                required
              />
            </div>
          </div>
          
          {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 transition-colors"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyOTP}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Enter OTP</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="6-digit OTP"
              maxLength="6"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-indigo-500 text-center text-lg tracking-widest bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
              required
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              OTP sent to +91 {phone}
            </p>
          </div>
          
          {error && <div className="mb-4 text-sm text-red-600 dark:text-red-400">{error}</div>}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 dark:bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-700 disabled:bg-gray-400 dark:disabled:bg-gray-600 mb-2 transition-colors"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
          
          <button
            type="button"
            onClick={() => setStep('phone')}
            disabled={countdown > 0}
            className="w-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-colors"
          >
            {countdown > 0 ? `Resend in ${countdown}s` : 'Change Number'}
          </button>
        </form>
      )}
    </div>
  )
}

export default PhoneVerification