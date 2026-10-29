import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import NotificationBell from './NotificationBell';
import { useTheme } from '../context/ThemeContext';
import { useState } from 'react';

const Navbar = () => {
    const { authUser, setAuthUser } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);

    const handleLogout = async () => {
        await api.post('/auth/logout');
        localStorage.removeItem('token');
        setAuthUser(null);
        navigate('/login');
        setShowUserMenu(false);
    };

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="glass sticky top-4 z-50 my-4 mx-auto max-w-6xl rounded-full border border-gray-200/80 dark:border-gray-800/80 shadow-sm transition-all duration-300">
            <div className="px-6">
                <div className="flex justify-between items-center h-14">
                    
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center group-hover:bg-primary-700 transition-colors shadow-sm">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                            </svg>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">EV-Go</span>
                    </Link>

                    {/* Main Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {/* Only show Browse Vehicles for regular users and non-logged in users */}
                        {(!authUser || authUser.role === 'user') && (
                            <Link 
                                to="/vehicles" 
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                                    isActive('/vehicles') 
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Browse Vehicles
                            </Link>
                        )}
                        
                        {authUser?.role === 'user' && (
                            <>
                                <Link 
                                    to="/favorites" 
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                                        isActive('/favorites') 
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    Favorites
                                </Link>
                                <Link 
                                    to="/profile" 
                                    className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                                        isActive('/profile') 
                                            ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                            : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    My Bookings
                                </Link>
                            </>
                        )}
                        
                        {authUser?.role === 'station-master' && (
                            <Link 
                                to="/dashboard" 
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                                    isActive('/dashboard') 
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Station Dashboard
                            </Link>
                        )}
                        
                        {authUser?.role === 'super-admin' && (
                            <Link 
                                to="/super-admin" 
                                className={`px-4 py-1.5 rounded-full text-sm font-semibold tracking-wide transition-all duration-200 ${
                                    isActive('/super-admin') 
                                        ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' 
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                                }`}
                            >
                                Super Admin Dashboard
                            </Link>
                        )}
                    </div>

                    {/* User Actions */}
                    <div className="flex items-center space-x-3">
                        <button 
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {isDark ? (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                                </svg>
                            )}
                        </button>

                        {authUser ? (
                            <>
                                <NotificationBell />
                                
                                {/* User Menu */}
                                <div className="relative">
                                    <button 
                                        onClick={() => setShowUserMenu(!showUserMenu)}
                                        className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                    >
                                        <div className="w-7 h-7 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                                            <span className="text-white text-xs font-semibold">
                                                {authUser.name.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="hidden sm:block text-left pr-1">
                                            <div className="text-sm font-semibold text-gray-900 dark:text-white leading-none">{authUser.name}</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400 capitalize leading-none mt-1">{authUser.role.replace('-', ' ')}</div>
                                        </div>
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    
                                    {showUserMenu && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-800 py-1.5 animate-slide-up z-50">
                                            {authUser.role === 'user' && (
                                                <>
                                                    <Link to="/profile" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        My Profile
                                                    </Link>
                                                    <Link to="/loyalty" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        Loyalty Program
                                                    </Link>
                                                    <Link to="/support" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        Support & Tickets
                                                    </Link>
                                                    <Link to="/refunds" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        Refund Tracking
                                                    </Link>
                                                    <Link to="/analytics" className="block px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => setShowUserMenu(false)}>
                                                        Analytics
                                                    </Link>
                                                </>
                                            )}
                                            <hr className="my-1.5 border-gray-100 dark:border-gray-800" />
                                            <button 
                                                onClick={handleLogout}
                                                className="block w-full text-left px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                                            >
                                                Sign Out
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <Link 
                                    to="/login" 
                                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-semibold text-sm px-3 py-1.5 rounded-full transition-colors"
                                >
                                    Sign In
                                </Link>
                                <Link 
                                    to="/register" 
                                    className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-full font-bold text-sm shadow-premium hover:shadow-glow transition-all"
                                >
                                    Get Started
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;