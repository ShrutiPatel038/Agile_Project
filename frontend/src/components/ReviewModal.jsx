import { useState } from 'react'
import api from '../services/api'
import StarRating from './StarRating'

const ReviewModal = ({ booking, onClose, onSuccess }) => {
  const [vehicleRating, setVehicleRating] = useState(0)
  const [stationRating, setStationRating] = useState(0)
  const [vehicleComment, setVehicleComment] = useState('')
  const [stationComment, setStationComment] = useState('')
  const [loading, setLoading] = useState(false)

  const submitReview = async (type, rating, comment) => {
    if (rating === 0) return
    
    try {
      await api.post('/reviews', {
        bookingId: booking._id,
        rating,
        comment,
        type
      })
    } catch (error) {
      console.error(`Failed to submit ${type} review`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (vehicleRating === 0 && stationRating === 0) {
      alert('Please provide at least one rating')
      return
    }

    setLoading(true)
    try {
      if (vehicleRating > 0) {
        await submitReview('vehicle', vehicleRating, vehicleComment)
      }
      if (stationRating > 0) {
        await submitReview('station', stationRating, stationComment)
      }
      
      onSuccess()
      onClose()
    } catch (error) {
      alert('Failed to submit reviews')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Your Experience</h3>
            <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200">✕</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Vehicle Rating</label>
              <StarRating rating={vehicleRating} onRatingChange={setVehicleRating} />
              <textarea
                value={vehicleComment}
                onChange={(e) => setVehicleComment(e.target.value)}
                placeholder="How was the vehicle? (optional)"
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="2"
                maxLength="500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Station Rating</label>
              <StarRating rating={stationRating} onRatingChange={setStationRating} />
              <textarea
                value={stationComment}
                onChange={(e) => setStationComment(e.target.value)}
                placeholder="How was the station service? (optional)"
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                rows="2"
                maxLength="500"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                Skip
              </button>
              <button
                type="submit"
                disabled={loading || (vehicleRating === 0 && stationRating === 0)}
                className="flex-1 px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReviewModal