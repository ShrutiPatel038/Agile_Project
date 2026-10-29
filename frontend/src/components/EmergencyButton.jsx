import { useState } from 'react'
import api from '../services/api'

const EmergencyButton = ({ booking }) => {
  const [showModal, setShowModal] = useState(false)
  const [emergency, setEmergency] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const emergencyTypes = [
    'Vehicle breakdown',
    'Accident',
    'Medical emergency',
    'Security concern',
    'Other'
  ]

  const handleEmergency = async () => {
    if (!emergency) return
    
    setSubmitting(true)
    try {
      // Send emergency message to station master
      await api.post('/messages', {
        bookingId: booking._id,
        message: `🚨 EMERGENCY: ${emergency}`,
        type: 'emergency'
      })
      
      // Also call emergency services API (placeholder)
      // await api.post('/emergency/alert', { bookingId: booking._id, type: emergency })
      
      alert('Emergency alert sent to station master!')
      setShowModal(false)
    } catch (error) {
      alert('Failed to send emergency alert')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full bg-red-600 dark:bg-red-500 text-white py-3 px-4 rounded-lg font-semibold hover:bg-red-700 dark:hover:bg-red-600 flex items-center justify-center gap-2 transition-colors duration-200"
      >
        🚨 Emergency Help
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
              <h3 className="font-semibold text-red-800 dark:text-red-400">Emergency Alert</h3>
              <p className="text-sm text-red-600 dark:text-red-300">This will immediately notify the station master</p>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Type of Emergency</label>
                <select
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  required
                >
                  <option value="">Select emergency type</option>
                  {emergencyTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-400">
                  📞 For life-threatening emergencies, call 112 immediately
                </p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  onClick={() => setShowModal(false)} 
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleEmergency}
                  disabled={submitting || !emergency}
                  className="px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-md hover:bg-red-700 dark:hover:bg-red-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  {submitting ? 'Sending...' : 'Send Alert'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default EmergencyButton