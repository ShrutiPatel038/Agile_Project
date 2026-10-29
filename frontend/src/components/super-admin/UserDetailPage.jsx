import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const Spinner = () => (
    <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
    </div>
);

const StatusBadge = ({ status }) => {
    const colors = {
        'pending-confirmation': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800',
        'confirmed': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 border border-blue-200 dark:border-blue-800',
        'active': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-800',
        'completed': 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
        'cancelled': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-800',
    };
    return (
        <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
            {status.replace('-', ' ')}
        </span>
    );
};

const UserDetailPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    
    // Simplified filters
    const [statusFilters, setStatusFilters] = useState([]);
    const [costRange, setCostRange] = useState({ min: '', max: '' });
    const [dateFilter, setDateFilter] = useState('');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

    const columns = [
        { key: 'vehicle.modelName', label: 'Vehicle', sortable: true },
        { key: 'station.name', label: 'Station', sortable: true },
        { key: 'createdAt', label: 'Date Booked', sortable: true },
        { key: 'totalCost', label: 'Cost', sortable: true },
        { key: 'status', label: 'Status', sortable: true }
    ];

    const statusOptions = ['pending-confirmation', 'confirmed', 'active', 'completed', 'cancelled'];
    const datePresets = [
        { value: '', label: 'All Time' },
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    useEffect(() => {
        if (!id) return;

        const timer = setTimeout(() => {
            const fetchUserDetails = async () => {
                setLoading(true);
                try {
                    const params = {
                        sortBy: sortConfig.key,
                        sortOrder: sortConfig.direction,
                        statusFilters: JSON.stringify(statusFilters),
                        minCost: costRange.min,
                        maxCost: costRange.max,
                        dateFilter,
                        startDate: customDateRange.start,
                        endDate: customDateRange.end
                    };
                    
                    const { data } = await api.get(`/super-admin/users/${id}/details`, { params });
                    setUserData(data);
                } catch (err) {
                    setError('Failed to load user details.');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };

            fetchUserDetails();
        }, 500);

        return () => clearTimeout(timer);
    }, [id, sortConfig, statusFilters, costRange, dateFilter, customDateRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleStatusFilter = (status) => {
        setStatusFilters(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
    };

    const clearAllFilters = () => {
        setStatusFilters([]);
        setCostRange({ min: '', max: '' });
        setDateFilter('');
        setCustomDateRange({ start: '', end: '' });
    };

    const handleDeleteUser = async () => {
        if (!userData?.user?._id) return;
        if (!window.confirm(`Delete ${userData.user.name}'s account? This action cannot be undone.`)) return;

        setDeleting(true);
        try {
            await api.delete(`/super-admin/users/regular/${userData.user._id}`);
            navigate('/super-admin');
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setDeleting(false);
        }
    };

    const hasActiveFilters = statusFilters.length > 0 || costRange.min || costRange.max || dateFilter;

    if (loading) return <Spinner />;
    if (error) return <div className="text-center p-8 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800">{error}</div>;
    if (!userData) return <div className="text-center p-8 text-gray-900 dark:text-white">User not found.</div>;

    const { user, bookings } = userData;

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <Link to="/super-admin" className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4 inline-block transition-colors">&larr; Back to Dashboard</Link>
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{user.name}</h1>
                        <p className="text-lg text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <button
                        onClick={handleDeleteUser}
                        disabled={deleting}
                        className="self-start px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 transition-colors disabled:opacity-60"
                    >
                        {deleting ? 'Deleting...' : 'Delete User'}
                    </button>
                </div>
                <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Member Since:</span>
                        <p className="text-gray-800 dark:text-white">{new Date(user.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Total Bookings:</span>
                        <p className="text-gray-800 dark:text-white">{bookings.length}</p>
                    </div>
                    <div>
                        <span className="font-medium text-gray-600 dark:text-gray-400">Account Status:</span>
                        <p className="text-green-600 dark:text-green-400 font-medium">Active</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-800 dark:text-white">
                        Booking History ({bookings.length})
                    </h3>
                    {hasActiveFilters && (
                        <button
                            onClick={clearAllFilters}
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
                        >
                            Clear All Filters
                        </button>
                    )}
                </div>

                {/* Filter Controls */}
                <div className="mb-6">
                    <div className="flex flex-wrap gap-4 items-end">
                        {/* Status Filter */}
                        <div className="min-w-[200px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
                            <div className="flex flex-wrap gap-2">
                                {statusOptions.map(status => (
                                    <button
                                        key={status}
                                        onClick={() => handleStatusFilter(status)}
                                        className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                                            statusFilters.includes(status)
                                                ? 'bg-indigo-100 border-indigo-300 text-indigo-800'
                                                : 'bg-gray-100 border-gray-300 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {status.replace('-', ' ')}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Cost Range */}
                        <div className="min-w-[180px]">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Range</label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">₹</span>
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={costRange.min}
                                    onChange={(e) => setCostRange(prev => ({ ...prev, min: e.target.value }))}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                />
                                <span className="text-gray-400">-</span>
                                <span className="text-sm text-gray-500">₹</span>
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={costRange.max}
                                    onChange={(e) => setCostRange(prev => ({ ...prev, max: e.target.value }))}
                                    className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        {/* Date Filter */}
                        <div className="min-w-[150px]">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                            <select 
                                value={dateFilter} 
                                onChange={(e) => setDateFilter(e.target.value)}
                                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            >
                                {datePresets.map(preset => (
                                    <option key={preset.value} value={preset.value}>{preset.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Custom Date Range */}
                        {dateFilter === 'custom' && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={customDateRange.start}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                                <span className="text-gray-400 dark:text-gray-500 text-sm">to</span>
                                <input
                                    type="date"
                                    value={customDateRange.end}
                                    onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                    className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    {bookings.length > 0 ? (
                        <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    {columns.map(column => (
                                        <th key={column.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            <div className="flex items-center space-x-1">
                                                <span>{column.label}</span>
                                                {column.sortable && (
                                                    <button
                                                        onClick={() => handleSort(column.key)}
                                                        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                    >
                                                        {sortConfig.key === column.key ? (
                                                            sortConfig.direction === 'asc' ? (
                                                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                </svg>
                                                            )
                                                        ) : (
                                                            <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                                                                <path d="M5 12l5-5 5 5H5z" />
                                                            </svg>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {bookings.map(booking => (
                                    <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{booking.vehicle?.modelName || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-300">{booking.station?.name || 'N/A'}</td>
                                        <td className="px-4 py-3 text-gray-900 dark:text-gray-300">{new Date(booking.createdAt).toLocaleDateString()}</td>
                                        <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">₹{booking.totalCost?.toLocaleString('en-IN') || '0'}</td>
                                        <td className="px-4 py-3"><StatusBadge status={booking.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                            {hasActiveFilters ? 'No bookings found matching the filters.' : 'This user has not made any bookings yet.'}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserDetailPage;