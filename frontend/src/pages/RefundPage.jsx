import { useEffect, useState } from 'react'
import api from '../services/api'

export default function RefundPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/mybookings')
      // Only display cancelled or completed bookings that were paid
      const eligible = (data || []).filter(
        (b) => ['cancelled', 'completed'].includes(b.status) && b.paymentStatus === 'completed'
      )
      setBookings(eligible)
    } catch (err) {
      console.error('Failed to load eligible bookings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  const handleSubmitRefund = async (e) => {
    e.preventDefault()
    if (!selectedBooking || !reason.trim()) return

    setSubmitting(true)
    try {
      await api.post('/refund/request', {
        bookingId: selectedBooking._id,
        reason
      })
      alert('Refund request submitted successfully!')
      setReason('')
      setSelectedBooking(null)
      fetchBookings()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit refund request')
    } finally {
      setSubmitting(false)
    }
  }

  const getRefundBadgeColor = (status) => {
    switch (status) {
      case 'none': return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
      case 'pending': return 'bg-accent-100 text-accent-800 dark:bg-accent-900/25 dark:text-accent-400 animate-pulse font-bold'
      case 'processing': return 'bg-primary-100 text-primary-800 dark:bg-primary-900/20 dark:text-primary-400'
      case 'completed': return 'bg-primary-600 text-white font-bold'
      case 'failed': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/25 dark:text-rose-400'
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between pb-4">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Refund Tracking</h1>
      </div>

      <div className="card p-6">
        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4">Refund Requests & Eligible Bookings</h3>

        {bookings.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-12">
            No completed or cancelled bookings eligible for refunds.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold uppercase text-xs tracking-wide border-0">
                <tr>
                  <th className="p-4 rounded-l-2xl">Booking Info</th>
                  <th className="p-4">Booking Total</th>
                  <th className="p-4">Refund Status</th>
                  <th className="p-4">Refund Amount</th>
                  <th className="p-4 text-right rounded-r-2xl">Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-100 dark:hover:bg-gray-800/50 transition-colors border-b border-gray-200 dark:border-gray-800">
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">{b.vehicle?.modelName || 'Vehicle'}</div>
                      <div className="text-xs text-gray-500 mt-0.5 font-medium">
                        Start: {new Date(b.startTime).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-gray-800 dark:text-white">
                      ₹{b.totalCost?.toLocaleString('en-IN')}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase ${getRefundBadgeColor(b.refund?.status || 'none')}`}>
                        {b.refund?.status === 'none' ? 'No Refund Requested' : b.refund?.status}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-gray-900 dark:text-white">
                      {b.refund?.amount > 0 ? `₹${b.refund.amount.toLocaleString('en-IN')}` : '—'}
                    </td>
                    <td className="p-4 text-right">
                      {b.refund?.status === 'none' ? (
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                        >
                          Request Refund
                        </button>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">
                          {b.refund?.status === 'completed'
                            ? `Processed on ${new Date(b.refund.processedAt).toLocaleDateString()}`
                            : 'Request under review'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Request Form Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-xs p-4">
          <div className="card w-full max-w-md p-8 space-y-4 animate-slide-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Submit Refund Request</h3>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-2 text-xs text-gray-700 dark:text-gray-300">
              <div className="flex justify-between">
                <span>Vehicle:</span>
                <span className="font-bold text-gray-900 dark:text-white">{selectedBooking.vehicle?.modelName}</span>
              </div>
              <div className="flex justify-between">
                <span>Paid Amount:</span>
                <span className="font-bold text-gray-900 dark:text-white">₹{selectedBooking.totalCost?.toLocaleString('en-IN')}</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic leading-relaxed">
                Note: Refund values are calculated dynamically according to cancellation times. Security deposit is always 100% refunded for cancellations.
              </div>
            </div>

            <form onSubmit={handleSubmitRefund} className="space-y-4">
              <div>
                <label className="label">Reason for Refund</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Why are you requesting a refund? (e.g. Booking cancelled early, vehicle issue)"
                  rows={4}
                  required
                  className="input"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBooking(null)}
                  className="btn btn-ghost px-4 py-2 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary px-5 py-2 text-xs font-bold"
                >
                  {submitting ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
