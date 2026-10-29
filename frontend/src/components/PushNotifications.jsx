import { useEffect, useState } from 'react'
import { useSocket } from '../context/SocketContext'

const NotificationToast = ({ notification, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000) // Auto close after 5 seconds
    return () => clearTimeout(timer)
  }, [onClose])

  const getIcon = (type) => {
    switch (type) {
      case 'booking': return '📅'
      case 'payment': return '💳'
      case 'emergency': return '🚨'
      case 'reminder': return '⏰'
      default: return '📢'
    }
  }

  const getColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'high': return 'bg-orange-500'
      case 'medium': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 ${getColor(notification.priority)} animate-slide-in`}>
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-2xl">{getIcon(notification.type)}</span>
          </div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-gray-900">
              {notification.title}
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {notification.message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const PushNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const socket = useSocket()

  useEffect(() => {
    if (!socket) return

    const handleNotification = (notification) => {
      setNotifications(prev => [...prev, { ...notification, id: Date.now() }])
      
      // Play notification sound
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: '/favicon.ico'
        })
      }
    }

    socket.on('notification', handleNotification)
    socket.on('booking_update', (data) => {
      handleNotification({
        title: 'Booking Update',
        message: data.message,
        type: 'booking',
        priority: 'medium'
      })
    })

    return () => {
      socket.off('notification', handleNotification)
      socket.off('booking_update')
    }
  }, [socket])

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  return (
    <div className="fixed top-0 right-0 z-50 p-4 space-y-2">
      {notifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  )
}

export default PushNotifications