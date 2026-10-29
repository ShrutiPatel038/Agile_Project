import { useEffect, useState } from "react"
import api from "../../services/api";
import { Link } from "react-router-dom";

const CustomerManager = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingUserId, setDeletingUserId] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
    const [dateFilter, setDateFilter] = useState('');
    const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

    const columns = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'createdAt', label: 'Registration Date', sortable: true }
    ];

    const datePresets = [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'This Week' },
        { value: 'month', label: 'This Month' },
        { value: 'custom', label: 'Custom Range' }
    ];

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const params = {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                    dateFilter,
                    startDate: customDateRange.start,
                    endDate: customDateRange.end
                };
                const { data } = await api.get(`/super-admin/users/regular`, { params });
                setUsers(data.users);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [sortConfig, dateFilter, customDateRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleDeleteUser = async (userId, userName) => {
        if (!window.confirm(`Delete ${userName}'s account? This action cannot be undone.`)) return;

        setDeletingUserId(userId);
        try {
            await api.delete(`/super-admin/users/regular/${userId}`);
            setUsers(prev => prev.filter(user => user._id !== userId));
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to delete user.';
            alert(message);
        } finally {
            setDeletingUserId(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex items-center space-x-3">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Customer Directory</h3>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                    <select 
                        value={dateFilter} 
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    >
                        {datePresets.map(preset => (
                            <option key={preset.value} value={preset.value}>{preset.label}</option>
                        ))}
                    </select>
                    
                    {dateFilter === 'custom' && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={customDateRange.start}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                            <span className="text-gray-500 dark:text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customDateRange.end}
                                onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                            />
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                        <p className="text-gray-600 dark:text-gray-400 font-medium">Loading customers...</p>
                    </div>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                {columns.map(column => (
                                    <th key={column.key} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        <div className="flex items-center space-x-1">
                                            <span>{column.label}</span>
                                            {column.sortable && (
                                                <button
                                                    onClick={() => handleSort(column.key)}
                                                    className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                                                >
                                                    {sortConfig.key === column.key ? (
                                                        sortConfig.direction === 'asc' ? (
                                                            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                                                            </svg>
                                                        ) : (
                                                            <svg className="w-4 h-4 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
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
                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.length > 0 ? users.map((user, index) => (
                                <tr key={user._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{user.email}</td>
                                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-2">
                                            <Link to={`/super-admin/user/${user._id}`} className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all duration-200">View Details</Link>
                                            <button
                                                onClick={() => handleDeleteUser(user._id, user.name)}
                                                disabled={deletingUserId === user._id}
                                                className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 disabled:opacity-60"
                                            >
                                                {deletingUserId === user._id ? 'Deleting...' : 'Delete'}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="4" className="px-4 py-12 text-center">
                                        <div className="flex flex-col items-center space-y-3">
                                            <p className="text-gray-500 dark:text-gray-400 font-medium">No customers found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CustomerManager;