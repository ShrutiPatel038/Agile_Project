"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import ModifyBookingModal from "./ModifyBookingModal.jsx"
import ChatModal from "./ChatModal.jsx"
import EmergencyButton from "./EmergencyButton.jsx"
import ReviewModal from "./ReviewModal.jsx"
import PaymentModal from "./PaymentModal.jsx"
import CountdownTimer from "./CountdownTimer.jsx"
import { useSocket } from "../context/SocketContext.jsx"

export default function MyBookings() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [modifyModal, setModifyModal] = useState(null)
  const [chatModal, setChatModal] = useState(null)
  const [reviewModal, setReviewModal] = useState(null)
  const [paymentModal, setPaymentModal] = useState(null)
  const socket = useSocket()

  const fetchBookings = async () => {
    try {
      const { data } = await api.get("/bookings/mybookings")
      setItems(data || [])
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to load bookings.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookings()
  }, [])

  useEffect(() => {
    if (!socket) return

    const refreshBookings = () => fetchBookings()
    const handleNotification = (payload) => {
      if (payload?.type === 'payment' || payload?.type === 'booking') {
        refreshBookings()
      }
    }

    socket.on('booking_confirmed', refreshBookings)
    socket.on('notification', handleNotification)

    return () => {
      socket.off('booking_confirmed', refreshBookings)
      socket.off('notification', handleNotification)
    }
  }, [socket])

  const canModify = (booking) => {
    return ['pending-confirmation', 'confirmed'].includes(booking.status) && booking.paymentStatus === 'completed'
  }

  const needsPayment = (booking) => {
    return booking.status === 'confirmed' && booking.paymentStatus === 'pending'
  }

  const isActive = (booking) => {
    return booking.status === 'active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-sky-100 dark:bg-sky-950/45 text-sky-800 dark:text-sky-300'
      case 'active': return 'bg-accent-100 dark:bg-accent-900/40 text-accent-800 dark:text-accent-300 font-bold'
      case 'completed': return 'bg-gray-200 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300'
      case 'cancelled': return 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
      case 'pending-confirmation': return 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
      default: return 'bg-gray-200 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300'
    }
  }

  const getPaymentStatusBadge = (paymentStatus) => {
    switch (paymentStatus) {
      case 'pending': return { text: 'Payment Pending', color: 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 font-bold' }
      case 'processing': return { text: 'Payment Processing', color: 'bg-sky-100 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 animate-pulse' }
      case 'completed': return { text: 'Paid', color: 'bg-accent-600 text-white font-bold' }
      case 'failed': return { text: 'Payment Failed', color: 'bg-rose-50 dark:bg-rose-950/25 text-rose-700' }
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
          <span className="text-sm font-semibold">Loading bookings...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm">
        <div className="text-red-600 text-sm font-semibold">{error}</div>
      </div>
    )
  }

  if (!items.length) {
    return <div className="bg-transparent text-center py-10 text-gray-500 dark:text-gray-400 text-sm font-medium">No bookings yet. Start your journey by exploring the fleet!</div>
  }

  return (
    <>
      <div className="space-y-6">
        {items.map((booking) => (
          <div key={booking._id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-200 dark:border-gray-800 hover:-translate-y-0.5 transition-all duration-300">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white">{booking.vehicle?.modelName || "Vehicle"}</h3>
                  <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${getStatusColor(booking.status)}`}>
                    {booking.status.replace('-', ' ').toUpperCase()}
                  </span>
                  {getPaymentStatusBadge(booking.paymentStatus) && (
                    <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${getPaymentStatusBadge(booking.paymentStatus).color}`}>
                      {getPaymentStatusBadge(booking.paymentStatus).text}
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 space-y-2">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{new Date(booking.startTime).toLocaleString()} — {new Date(booking.endTime).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-bold text-gray-800 dark:text-gray-200">₹{booking.totalCost?.toLocaleString('en-IN')}</span>
                  </div>
                  {booking.paymentStatus === 'pending' && booking.paymentDeadline && (
                    <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Payment due: <CountdownTimer expiryTimestamp={booking.paymentDeadline} onExpire={() => fetchBookings()} /></span>
                    </div>
                  )}
                  {booking.securityDeposit?.amount > 0 && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span>Security Deposit: ₹{booking.securityDeposit.amount} ({booking.securityDeposit.status.toUpperCase()})</span>
                    </div>
                  )}
                  {booking.modifications?.length > 0 && (
                    <div className="flex items-center gap-2 text-primary-700 dark:text-primary-300 font-semibold">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Modified {booking.modifications.length} time(s)</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-col gap-2 min-w-0 lg:min-w-[200px]">
                {isActive(booking) && (
                  <EmergencyButton booking={booking} />
                )}
                
                <div className="flex gap-2">
                  {needsPayment(booking) && (
                    <button
                      onClick={() => setPaymentModal(booking)}
                      className="flex-1 btn btn-primary py-2 text-xs font-bold"
                    >
                      Pay Now
                    </button>
                  )}
                  
                  {canModify(booking) && (
                    <button
                      onClick={() => setModifyModal(booking)}
                      className="flex-1 btn btn-secondary py-2 text-xs font-bold"
                    >
                      Modify
                    </button>
                  )}

                  {isActive(booking) && booking.paymentStatus === 'completed' && (
                    <button
                      onClick={() => setModifyModal(booking)}
                      className="flex-1 btn btn-primary py-2 text-xs font-bold"
                    >
                      Extend Ride
                    </button>
                  )}
                  
                  {booking.status === 'completed' && (
                    <button
                      onClick={() => setReviewModal(booking)}
                      className="flex-1 btn btn-secondary py-2 text-xs font-bold"
                    >
                      Review
                    </button>
                  )}
                  
                  {(isActive(booking) || canModify(booking) || needsPayment(booking)) && (
                    <button
                      onClick={() => setChatModal(booking)}
                      className="flex-1 btn btn-ghost py-2 text-xs font-bold"
                    >
                      Chat
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modifyModal && (
        <ModifyBookingModal
          booking={modifyModal}
          onClose={() => setModifyModal(null)}
          onSuccess={() => {
            setModifyModal(null)
            fetchBookings()
          }}
        />
      )}

      {chatModal && (
        <ChatModal
          booking={chatModal}
          onClose={() => setChatModal(null)}
        />
      )}

      {reviewModal && (
        <ReviewModal
          booking={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            setReviewModal(null)
            fetchBookings()
          }}
        />
      )}

      {paymentModal && (
        <PaymentModal
          booking={paymentModal}
          onClose={() => setPaymentModal(null)}
          onSuccess={() => {
            setPaymentModal(null)
            fetchBookings()
          }}
        />
      )}
    </>
  )
}
