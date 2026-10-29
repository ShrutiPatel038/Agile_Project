import { useState } from 'react'
import api from '../services/api'
import PaymentModal from './PaymentModal'

const ModifyBookingModal = ({ booking, onClose, onSuccess }) => {
  const [newEndTime, setNewEndTime] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showPayment, setShowPayment] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  const currentEnd = new Date(booking.endTime)
  const minTime = new Date(currentEnd.getTime() - 2 * 60 * 60 * 1000) // 2 hours before current end
  const maxTime = new Date(currentEnd.getTime() + 24 * 60 * 60 * 1000) // 24 hours after current end

  const calculateCostDifference = () => {
    if (!newEndTime) return 0
    const newEnd = new Date(newEndTime)
    const oldDuration = (currentEnd - new Date(booking.startTime)) / (1000 * 60 * 60)
    const newDuration = (newEnd - new Date(booking.startTime)) / (1000 * 60 * 60)
    return (newDuration - oldDuration) * booking.vehicle.pricePerHour
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!newEndTime) return

    const newEnd = new Date(newEndTime)
    const type = newEnd > currentEnd ? 'extend' : 'shorten'

    setSubmitting(true)
    try {
      const { data } = await api.put(`/bookings/${booking._id}/modify`, {
        newEndTime,
        type
      })
      if (data.requiresPayment) {
        setCreatedBooking({
          ...booking,
          endTime: newEnd,
          totalCost: booking.totalCost + costDiff
        })
        setShowPayment(true)
      } else {
        onSuccess()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to modify booking')
    } finally {
      setSubmitting(false)
    }
  }

  const costDiff = calculateCostDifference()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Modify Booking</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{booking.vehicle.modelName}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Current End Time</label>
            <input
              type="text"
              value={currentEnd.toLocaleString()}
              readOnly
              className="w-full p-2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md text-sm text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">New End Time</label>
            <input
              type="datetime-local"
              value={newEndTime}
              onChange={(e) => setNewEndTime(e.target.value)}
              min={minTime.toISOString().slice(0, 16)}
              max={maxTime.toISOString().slice(0, 16)}
              required
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Can modify ±2 hours to +24 hours from current end time
            </p>
          </div>

          {newEndTime && (
            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-700 dark:text-gray-300">Cost Change:</span>
                  <span className={`font-semibold ${costDiff >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                    {costDiff >= 0 ? '+' : ''}₹{Math.abs(costDiff).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">New Total:</span>
                  <span className="text-gray-900 dark:text-white">₹{(booking.totalCost + costDiff).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          )}

          {error && <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-md text-sm border border-red-200 dark:border-red-800">{error}</div>}
          
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200">
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={submitting || !newEndTime}
              className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {submitting ? 'Modifying...' : 'Modify Booking'}
            </button>
          </div>
        </form>
      </div>
      {showPayment && createdBooking && (
        <PaymentModal
          booking={createdBooking}
          onClose={() => {
            setShowPayment(false)
            onClose()
          }}
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
        />
      )}
    </div>
  )
}

export default ModifyBookingModal