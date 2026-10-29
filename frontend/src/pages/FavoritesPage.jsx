import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import StarRating from '../components/StarRating'

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    try {
      const { data } = await api.get('/favorites')
      setFavorites(data)
    } catch (error) {
      console.error('Failed to fetch favorites')
    } finally {
      setLoading(false)
    }
  }

  const removeFavorite = async (vehicleId) => {
    try {
      await api.post(`/favorites/toggle/${vehicleId}`)
      setFavorites(favorites.filter(fav => fav.vehicle._id !== vehicleId))
    } catch (error) {
      console.error('Failed to remove favorite')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (favorites.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">No Favorites Yet</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Start adding vehicles to your favorites for quick access!</p>
        <Link 
          to="/vehicles" 
          className="inline-block px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Browse Vehicles
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">My Favorite Vehicles</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {favorites.map((favorite) => (
          <div key={favorite._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <img 
              src={favorite.vehicle.imageUrl || '/placeholder-vehicle.jpg'} 
              alt={favorite.vehicle.modelName}
              className="w-full h-48 object-cover"
            />
            <div className="p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{favorite.vehicle.modelName}</h3>
                <button
                  onClick={() => removeFavorite(favorite.vehicle._id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <svg className="w-6 h-6 fill-current" viewBox="0 0 20 20">
                    <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"/>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center mb-3">
                <StarRating rating={4.2} readonly size="sm" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">(24 reviews)</span>
              </div>
              
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mb-4">
                ₹{favorite.vehicle.pricePerHour}/hour
              </p>
              
              <Link
                to="/vehicles"
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 text-center block"
              >
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default FavoritesPage