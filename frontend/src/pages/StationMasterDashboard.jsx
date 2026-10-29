import { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import ChatModal from '../components/ChatModal';

// Enhanced Stat Card with modern styling
const StatCard = ({ title, value, color }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-300 transform hover:-translate-y-0.5 group">
        <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</div>
        </div>
        <p className={`text-3xl font-bold ${color} transition-transform duration-300`}>{value}</p>
        <div className="mt-2 h-1 bg-primary-500 dark:bg-primary-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
    </div>
);

// Enhanced Table Section with modern styling
const TableSection = ({ title, children }) => (
    <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
            </div>
        </div>
        <div className="p-6">
            <div className="overflow-x-auto">
                {children}
            </div>
        </div>
    </div>
);

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-primary-600"></div>
    </div>
);


const StationMasterDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeRideSearch,setActiveRideSearch]=useState('');
    const [error, setError] = useState('');
    const [chatModal, setChatModal] = useState(null);

    // Debug chatModal state
    useEffect(() => {
        console.log('ChatModal state changed:', chatModal);
    }, [chatModal]);

    const socket = useSocket(); // Get the socket connection

    const fetchData = async () => {
        //Not setting loading to true here, so the page doesn't flicker on refresh
        try {
            const { data } = await api.get('/station-master/dashboard-data');
            setDashboardData(data);
        } catch (err) {
            setError('Failed to load dashboard data.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => { fetchData(); }, []);

    // --- NEW: Effect to listen for refresh events ---
    useEffect(() => {
        if (!socket) return;

        const handleDashboardRefresh = (data) => {
            console.log('Dashboard refresh event received:', data.message);
            // Simply re-fetch all data when a refresh event comes in
            fetchData();
        };

        socket.on('dashboard_refresh', handleDashboardRefresh);

        return () => {
            socket.off('dashboard_refresh', handleDashboardRefresh);
        };
    }, [socket]); // Dependency on the socket object


    const handleUpdateBooking=async(bookingId,status)=>{
        const action=status.charAt(0).toUpperCase()+status.slice(1);
        if(!window.confirm(`Are you sure you want to ${action} this booking?`)) return;

        try{
            await api.put(`/station-master/bookings/${bookingId}`,{status});
            // Refresh data immediately after successful update
            fetchData();
        } catch(error){
            console.error(error);
        }
    }

    if (loading) return <Spinner />;
    if (error) return <div className="text-red-500 dark:text-red-400">{error}</div>;
    if (!dashboardData) return <div className="text-gray-600 dark:text-gray-400">No data available.</div>;

    const { stationName, stats, vehicles, pendingBookings, confirmedBookings, activeRides } = dashboardData;

    const filteredActiveRides=dashboardData.activeRides.filter(ride=>
        ride.user.name.toLowerCase().includes(activeRideSearch.toLowerCase()) ||
        ride.vehicle.modelName.toLowerCase().includes(activeRideSearch.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-transparent space-y-8 animate-fade-in">
            {/* Sleek Hero Header Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 relative overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary-200/25 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-accent-300/20 dark:bg-accent-900/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Station Dashboard
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                            Real-time monitoring and management of your station operations, vehicles availability, and active bookings.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                        <div className="inline-flex items-center space-x-3 bg-accent-50 dark:bg-accent-950/20 px-5 py-2.5 rounded-2xl border border-accent-200 dark:border-accent-800 font-semibold text-sm text-accent-700 dark:text-accent-400 shadow-sm">
                            <div className="w-2.5 h-2.5 bg-accent-500 rounded-full animate-pulse"></div>
                            <span>{stationName}</span>
                        </div>
                        <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900/60 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 font-semibold text-xs text-gray-600 dark:text-gray-300 shadow-sm">
                            <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>
                                {new Date().toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric' 
                                })}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Enhanced Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                    <StatCard 
                        title="Total Vehicles" 
                        value={stats.totalVehicles} 
                        color="text-gray-900 dark:text-white"
                    />
                    <StatCard 
                        title="Available Now" 
                        value={stats.availableVehicles} 
                        color="text-green-600 dark:text-green-400"
                    />
                    <StatCard 
                        title="Upcoming Rides" 
                        value={stats.confirmedBookingsCount} 
                        color="text-blue-600 dark:text-blue-400"
                    />
                    <StatCard 
                        title="Active Rides" 
                        value={stats.activeRidesCount} 
                        color="text-purple-600 dark:text-purple-400"
                    />
                    <StatCard 
                        title="Pending Requests" 
                        value={stats.pendingBookingsCount} 
                        color="text-orange-600 dark:text-orange-400"
                    />
                    <StatCard 
                        title="Overdue Rides" 
                        value={stats.overdueRidesCount || 0} 
                        color="text-red-600 dark:text-red-400"
                    />
                </div>

                <TableSection title="Pending Booking Requests">
                 {pendingBookings.length > 0 ? (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendingBookings.map((booking, index) => (
                                <tr key={booking._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center font-semibold border border-primary-200/50 dark:border-primary-800/30">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white">{booking.user.name}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">{booking.user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-600 dark:text-gray-300">
                                            <div className="font-medium">{new Date(booking.startTime).toLocaleDateString()}</div>
                                            <div>{new Date(booking.startTime).toLocaleTimeString()} - {new Date(booking.endTime).toLocaleTimeString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'confirmed')}
                                                className="px-3.5 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                                            >
                                                Confirm
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'cancelled')}
                                                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    console.log('Chat button clicked for booking:', booking._id);
                                                    setChatModal(booking);
                                                }}
                                                className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No pending booking requests</p>
                        <p className="text-sm text-gray-400 dark:text-gray-500">New requests will appear here</p>
                    </div>
                )}
                </TableSection>

                <TableSection title="Confirmed & Upcoming Rides">
                    {confirmedBookings.length > 0 ? (
                        <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Time</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Payment</th>
                                <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {confirmedBookings.map((booking, index) => (
                                <tr key={booking._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full flex items-center justify-center font-semibold border border-indigo-200/50 dark:border-indigo-800/30">
                                                {booking.user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="font-semibold text-gray-900 dark:text-white">{booking.user.name}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{booking.vehicle.modelName}</td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm">
                                            <div className="font-medium text-gray-900 dark:text-white">{new Date(booking.startTime).toLocaleDateString()}</div>
                                            <div className="text-gray-500 dark:text-gray-400">{new Date(booking.startTime).toLocaleTimeString()}</div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                                            booking.paymentStatus === 'completed' 
                                                ? 'bg-green-100 dark:bg-green-950/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800' 
                                                : 'bg-orange-100 dark:bg-orange-950/30 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-800'
                                        }`}>
                                            {booking.paymentStatus === 'completed' ? 'PAID' : 'PENDING'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex space-x-2">
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'active')} 
                                                disabled={booking.paymentStatus !== 'completed'}
                                                className={`px-3.5 py-1.5 rounded-lg font-semibold text-xs transition-all duration-200 ${
                                                    booking.paymentStatus === 'completed'
                                                        ? 'bg-primary-600 text-white hover:bg-primary-700 shadow-sm'
                                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                }`}
                                                title={booking.paymentStatus !== 'completed' ? 'Payment required before starting ride' : ''}
                                            >
                                                Start Ride
                                            </button>
                                            <button 
                                                onClick={() => handleUpdateBooking(booking._id, 'cancelled')} 
                                                className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                            >
                                                Cancel
                                            </button>
                                            <button 
                                                onClick={() => {
                                                    console.log('Chat button clicked for booking:', booking._id);
                                                    setChatModal(booking);
                                                }}
                                                className="px-3.5 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-all duration-200"
                                            >
                                                Chat
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No upcoming rides</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Confirmed bookings will appear here</p>
                        </div>
                    )}
                </TableSection>

                {/* Enhanced Vehicles Table */}
                <TableSection title="Fleet Overview">
                    {vehicles.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle Model</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Pricing</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map((v, index) => {
                                    const statusConfig = {
                                        available: { bg: 'bg-green-100 dark:bg-green-950/30', text: 'text-green-800 dark:text-green-400', border: 'border-green-200 dark:border-green-800' },
                                        pending: { bg: 'bg-orange-100 dark:bg-orange-950/30', text: 'text-orange-800 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
                                        booked: { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-800 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
                                        maintenance: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-800 dark:text-red-400', border: 'border-red-200 dark:border-red-800' }
                                    };
                                    const config = statusConfig[v.status] || statusConfig.available;
                                    
                                    return (
                                        <tr key={v._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">{v.modelName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text} ${config.border} border`}>
                                                    {v.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-gray-900 dark:text-white">
                                                    ₹{v.pricePerHour.toLocaleString('en-IN')}
                                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-normal">/hour</span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No vehicles assigned</p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">Contact super admin to add vehicles to this station</p>
                        </div>
                    )}
                </TableSection>
                
                <TableSection title="Active Rides Monitor">
                    {/* Enhanced Search */}
                    <div className="mb-6">
                        <div className="relative max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search by customer or vehicle..."
                                value={activeRideSearch}
                                onChange={e => setActiveRideSearch(e.target.value)}
                                className="w-full pl-4 pr-4 py-2.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    {filteredActiveRides.length > 0 ? (
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-600">
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Vehicle</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ends At</th>
                                    <th className="px-6 py-3.5 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredActiveRides.map((ride, index) => (
                                    <tr key={ride._id} className={`${ride.isOverdue ? 'bg-red-50 dark:bg-red-900/30' : index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold border ${
                                                    ride.isOverdue 
                                                        ? 'bg-red-600 border-red-500' 
                                                        : 'bg-green-600 border-green-500'
                                                }`}>
                                                    {ride.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-semibold text-gray-900 dark:text-white">{ride.user.name}</div>
                                                    {ride.isOverdue && (
                                                        <span className="inline-flex items-center px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full border border-red-200">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">{ride.vehicle.modelName}</td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm">
                                                <div className={`font-medium ${ride.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {new Date(ride.endTime).toLocaleDateString()}
                                                </div>
                                                <div className={`${ride.isOverdue ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                                    {new Date(ride.endTime).toLocaleTimeString()}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button 
                                                    onClick={() => handleUpdateBooking(ride._id, 'completed')} 
                                                    className="px-3.5 py-1.5 bg-accent-600 hover:bg-accent-700 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                                                >
                                                    Complete
                                                </button>
                                                <button 
                                                    onClick={() => handleUpdateBooking(ride._id, 'cancelled')} 
                                                    className="px-3 py-1.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                                >
                                                    Emergency Cancel
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        console.log('Chat button clicked for ride:', ride._id);
                                                        setChatModal(ride);
                                                    }}
                                                    className="px-3.5 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold text-xs transition-all duration-200 shadow-sm"
                                                >
                                                    Chat
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 font-medium">
                                {activeRideSearch ? 'No rides match your search' : 'No active rides'}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500">
                                {activeRideSearch ? 'Try adjusting your search terms' : 'Active rides will appear here'}
                            </p>
                        </div>
                    )}
                </TableSection>
           
                {chatModal && (
                    <ChatModal
                        booking={chatModal}
                        onClose={() => {
                            console.log('Closing chat modal');
                            setChatModal(null);
                        }}
                    />
                )}
        </div>
    );
};

export default StationMasterDashboard;
