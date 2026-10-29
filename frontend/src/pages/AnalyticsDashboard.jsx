import { useState, useEffect } from 'react'
import api from '../services/api'

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get('/bookings/analytics')
      setAnalytics(data)
    } catch (error) {
      console.error('Failed to fetch analytics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!analytics) {
    return <div className="text-center py-20 text-gray-600 dark:text-gray-400">No analytics data available</div>
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">My Booking Analytics</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Bookings</h3>
          <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{analytics.totalBookings || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</h3>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400">₹{analytics.totalSpent?.toLocaleString('en-IN') || 0}</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Hours Driven</h3>
          <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">{analytics.totalHours || 0}h</p>
        </div>
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Avg Rating Given</h3>
          <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">{analytics.avgRating || 0}★</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Most Used Vehicles</h3>
          {analytics.topVehicles?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topVehicles.map((vehicle, index) => (
                <div key={vehicle._id} className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">{vehicle.modelName}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">{vehicle.bookingCount} bookings</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No booking history yet</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Monthly Spending</h3>
          {analytics.monthlySpending?.length > 0 ? (
            <div className="space-y-3">
              {analytics.monthlySpending.map((month, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="font-medium text-gray-900 dark:text-white">{month.month}</span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">₹{month.amount.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">No spending data yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard