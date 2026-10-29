"use client"

import { useEffect, useState } from "react"
import api from "../services/api.js"
import PaymentModal from "./PaymentModal.jsx"

export default function BookingModal({ vehicle, onClose, onBookingSuccess }) {
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [duration, setDuration] = useState(1)
  const [bookedSlots, setBookedSlots] = useState([])
  const [stations, setStations] = useState([])
  const [returnStationId, setReturnStationId] = useState(vehicle.station)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '', relation: '' })
  const [showPayment, setShowPayment] = useState(false)
  const [createdBooking, setCreatedBooking] = useState(null)

  const durationOptions = [1, 2, 4, 8, 12, 24]

  useEffect(() => {
    fetchBookedSlots()
    fetchStations()
  }, [])

  const fetchStations = async () => {
    try {
      const { data } = await api.get('/public/stations')
      setStations(data)
    } catch (err) {
      console.error('Failed to load stations', err)
    }
  }

  const fetchBookedSlots = async () => {
    try {
      const { data } = await api.get(`/bookings/vehicle/${vehicle._id}/availability`)
      setBookedSlots(data.bookedSlots)
    } catch (err) {
      setError('Failed to load availability')
    } finally {
      setLoading(false)
    }
  }

  const isSlotAvailable = (slotTime, duration) => {
    const slotEnd = new Date(slotTime)
    slotEnd.setHours(slotEnd.getHours() + duration)
    
    return !bookedSlots.some(booked => {
      const bookedStart = new Date(booked.start)
      const bookedEnd = new Date(booked.end)
      
      // Check if there's any overlap
      return slotTime < bookedEnd && slotEnd > bookedStart
    })
  }

  const generateTimeSlots = () => {
    const slots = []
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Generate slots for next 3 days
    for (let day = 0; day < 3; day++) {
      const date = new Date(today)
      date.setDate(today.getDate() + day)
      
      // Generate hourly slots from 6 AM to 10 PM
      for (let hour = 6; hour <= 22; hour++) {
        const slotTime = new Date(date)
        slotTime.setHours(hour, 0, 0, 0)
        
        // Skip past slots for today
        if (slotTime > now) {
          slots.push({
            time: slotTime,
            label: slotTime.toLocaleString('en-IN', {
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              hour: 'numeric',
              minute: '2-digit'
            })
          })
        }
      }
    }
    return slots
  }

  const timeSlots = generateTimeSlots()
  const oneWayFee = returnStationId && returnStationId !== vehicle.station ? (vehicle.oneWayDropOffFee || 500) : 0
  const totalCost = selectedSlot ? (duration * vehicle.pricePerHour) + oneWayFee : 0

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!selectedSlot) {
      setError('Please select a time slot')
      return
    }
    
    setSubmitting(true)
    try {
      const endTime = new Date(selectedSlot.time)
      endTime.setHours(endTime.getHours() + duration)
      
      const { data } = await api.post("/bookings", {
        vehicleId: vehicle._id,
        stationId: vehicle.station,
        returnStationId: returnStationId,
        startTime: selectedSlot.time,
        endTime: endTime,
        emergencyContacts: emergencyContact.name ? [emergencyContact] : []
      })
      
      setCreatedBooking({ ...data, vehicle })
      setShowPayment(true)
    } catch (err) { 
      setError(err.response?.data?.message || "Booking failed.") 
    } finally { 
      setSubmitting(false) 
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Book {vehicle.modelName}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">₹{vehicle.pricePerHour}/hour • Minimum 1 hour</p>
        </div>
        
        <form className="p-4 space-y-4" onSubmit={onSubmit}>
            {/* Duration Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {durationOptions.map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => {
                      setDuration(hrs)
                      setSelectedSlot(null) // Reset selection when duration changes
                    }}
                    className={`p-2 text-sm rounded border transition-colors duration-200 ${
                      duration === hrs 
                        ? 'bg-indigo-600 dark:bg-indigo-500 text-white border-indigo-600 dark:border-indigo-500' 
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                    }`}
                  >
                    {hrs} {hrs === 1 ? 'hour' : 'hours'}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Slot Selection */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Available Time Slots</label>
              {loading ? (
                <div className="p-4 text-center text-gray-600 dark:text-gray-400">Loading availability...</div>
              ) : (
                <div className="max-h-48 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700">
                  {timeSlots.map((slot, index) => {
                    const available = isSlotAvailable(slot.time, duration)
                    return (
                      <button
                        key={index}
                        type="button"
                        onClick={() => available && setSelectedSlot(slot)}
                        disabled={!available}
                        className={`w-full p-3 text-left text-sm border-b border-gray-200 dark:border-gray-600 last:border-b-0 transition-colors duration-200 ${
                          !available
                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                            : selectedSlot?.time?.getTime() === slot.time.getTime()
                            ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                        }`}
                      >
                        {slot.label} {!available && '(Booked)'}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Return Station Selection (One-Way Trips) */}
            {vehicle.allowOneWayTrip && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Return Station (One-Way Trip)</label>
                <select
                  value={returnStationId}
                  onChange={(e) => setReturnStationId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value={vehicle.station}>Same as pickup ({stations.find(s => s._id === vehicle.station)?.name || 'Return to pickup'})</option>
                  {stations.filter(s => s._id !== vehicle.station).map(s => (
                    <option key={s._id} value={s._id}>{s.name} (One-way fee: +₹{vehicle.oneWayDropOffFee || 500})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Emergency Contact */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Emergency Contact (Optional)</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={emergencyContact.name}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, name: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={emergencyContact.phone}
                  onChange={(e) => setEmergencyContact(prev => ({ ...prev, phone: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <input
                type="text"
                placeholder="Relation (e.g., Spouse, Friend)"
                value={emergencyContact.relation}
                onChange={(e) => setEmergencyContact(prev => ({ ...prev, relation: e.target.value }))}
                className="mt-2 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Booking Summary */}
            {selectedSlot && (
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Start:</span>
                    <span className="text-gray-900 dark:text-white">{selectedSlot.label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="text-gray-900 dark:text-white">{duration} {duration === 1 ? 'hour' : 'hours'}</span>
                  </div>
                  {oneWayFee > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">One-way Trip Fee:</span>
                      <span className="text-gray-900 dark:text-white">₹{oneWayFee.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg border-t border-gray-200 dark:border-gray-600 pt-2">
                    <span className="text-gray-900 dark:text-white">Total:</span>
                    <span className="text-green-600 dark:text-green-400">₹{totalCost.toLocaleString('en-IN')}</span>
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
                disabled={submitting || !selectedSlot}
                className="px-4 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-md hover:bg-indigo-700 dark:hover:bg-indigo-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {submitting ? 'Booking...' : 'Book Now'}
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
            onBookingSuccess()
            onClose()
          }}
        />
      )}
    </div>
  )
}
