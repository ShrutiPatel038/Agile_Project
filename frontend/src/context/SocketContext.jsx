import { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';
import api from '../services/api'; // We need this for the logout call

const SocketContext = createContext();
export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const { authUser, setAuthUser } = useAuth();
    const navigate = useNavigate();
    const socketBaseUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000')
        .replace(/\/+$/, '')
        .replace(/\/api$/, '');

    useEffect(() => {
        if (authUser) {
            console.log('Connecting to socket for user:', authUser._id);
            const newSocket = io(socketBaseUrl, {
                // Bearer token only (no shared localhost cookie) so each frontend port keeps its own session
                withCredentials: false,
                transports: ['websocket', 'polling'],
                auth: {
                    token: localStorage.getItem('token')
                }
            });
            
            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                // Personal room is auto-joined by backend
                // Only need to join role-based rooms
                newSocket.emit('joinAdminRooms', authUser);
            });
            
            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
            });
            
            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error);
            });
            
            setSocket(newSocket);

            const handleRoleChange = (data) => {
                alert(data.message);
                const logout = async () => {
                    await api.post('/auth/logout');
                    localStorage.removeItem('token');
                    setAuthUser(null);
                    navigate('/login');
                };
                logout();
            };
            
            // --- ADD THE NEW EVENT LISTENER ---
            const handleForceLogout = (data) => {
                alert(data.message);
                // We can reuse the same logout logic
                const logout = async () => {
                    await api.post('/auth/logout');
                    localStorage.removeItem('token');
                    setAuthUser(null);
                    navigate('/login');
                };
                logout();
            };

            // Listen for both events
            newSocket.on('role_changed', handleRoleChange);
            newSocket.on('force_logout', handleForceLogout);
            // ------------------------------------

            return () => {
                // Clean up both listeners
                newSocket.off('role_changed', handleRoleChange);
                newSocket.off('force_logout', handleForceLogout);
                newSocket.close();
            }
        } else {
            if (socket) {
                socket.close();
                setSocket(null);
            }
        }
    }, [authUser, setAuthUser, navigate]);

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    );
};