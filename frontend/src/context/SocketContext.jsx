import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api';

const SocketContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const { authUser, setAuthUser } = useAuth();
  const navigate = useNavigate();

  const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
    .replace(/\/+$/, '')
    .replace(/\/api$/, '');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!authUser) {
      if (socket) { socket.close(); setSocket(null); }
      return;
    }

    const newSocket = io(socketBaseUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      auth: { token: localStorage.getItem('token') },
    });

    newSocket.on('connect', () => {
      newSocket.emit('joinAdminRooms', authUser);
    });

    const handleRoleChange = (data) => {
      alert(data.message);
      api.post('/auth/logout').finally(() => { setAuthUser(null); navigate('/login'); });
    };
    const handleForceLogout = (data) => {
      alert(data.message);
      api.post('/auth/logout').finally(() => { setAuthUser(null); navigate('/login'); });
    };

    newSocket.on('role_changed', handleRoleChange);
    newSocket.on('force_logout', handleForceLogout);
    setSocket(newSocket);

    return () => {
      newSocket.off('role_changed', handleRoleChange);
      newSocket.off('force_logout', handleForceLogout);
      newSocket.close();
    };
  }, [authUser]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
};
