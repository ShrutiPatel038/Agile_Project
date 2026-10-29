import { useState, useEffect } from 'react';
import api from '../../services/api';

const ActiveRidesManager = () => {
    const [rides, setRides] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchActiveRides = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/super-admin/rides/active');
            setRides(data);
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchActiveRides(); }, []);

    const handleCancelRide = async (bookingId) => {
        if (!window.confirm('Are you sure you want to cancel this active ride? This will make the vehicle available again.')) return;
        try {
            await api.put(`/super-admin/rides/${bookingId}/cancel`);
            fetchActiveRides();
        } catch (error) {
            alert('Failed to cancel ride.');
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/50 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM18 17a2 2 0 11-4 0 2 2 0 014 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9H6a4 4 0 00-4 4v3a1 1 0 001 1h1a3 3 0 016 0h4a3 3 0 016 0h1a1 1 0 001-1v-3a4 4 0 00-4-4z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 9V5a1 1 0 00-1-1H9a1 1 0 00-1 1v4" />
                    </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">All Active Rides (System-Wide)</h3>
            </div>
            <div className="overflow-x-auto">
                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400">Loading active rides...</p>
                        </div>
                    </div>
                ) : (
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Vehicle</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Station</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">End Time</th>
                                <th className="p-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rides.map((ride, index) => (
                                <tr key={ride._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="p-3 text-gray-900 dark:text-white font-medium">{ride.user.name}</td>
                                    <td className="p-3 font-semibold text-gray-900 dark:text-white">{ride.vehicle.modelName}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{ride.station.name}</td>
                                    <td className="p-3 text-gray-600 dark:text-gray-300">{new Date(ride.endTime).toLocaleString()}</td>
                                    <td className="p-3">
                                        <button 
                                            onClick={() => handleCancelRide(ride._id)} 
                                            className="px-3 py-1 text-xs bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors duration-200 font-medium"
                                        >
                                            Cancel Ride
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {rides.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        <div className="flex flex-col items-center space-y-2">
                                            <svg className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 17a2 2 0 11-4 0 2 2 0 014 0zM18 17a2 2 0 11-4 0 2 2 0 014 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9H6a4 4 0 00-4 4v3a1 1 0 001 1h1a3 3 0 016 0h4a3 3 0 016 0h1a1 1 0 001-1v-3a4 4 0 00-4-4z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 9V5a1 1 0 00-1-1H9a1 1 0 00-1 1v4" />
                                            </svg>
                                            <p className="font-medium">No rides are currently active.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default ActiveRidesManager;