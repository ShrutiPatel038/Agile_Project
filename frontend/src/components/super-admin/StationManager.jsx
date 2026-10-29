import { useEffect, useState } from "react"
import api from "../../services/api";
import StationCard from "../StationCard";
import StationModal from "./StationModal";

const StationManager = () => {
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [initialLoadDone, setInitialLoadDone] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    
    // Filters
    const [statusFilter, setStatusFilter] = useState(''); // managed/unmanaged
    const [vehicleCountFilter, setVehicleCountFilter] = useState('');
    const [revenueRange, setRevenueRange] = useState({ min: '', max: '' });

    const fetchStationsOverview = async (showPageLoader = false) => {
        if (showPageLoader) {
            setLoading(true);
        } else {
            setRefreshing(true);
        }

        try {
            const params = {
                sortBy: sortConfig.key,
                sortOrder: sortConfig.direction,
                status: statusFilter,
                vehicleCount: vehicleCountFilter,
                minRevenue: revenueRange.min,
                maxRevenue: revenueRange.max
            };
            
            const { data } = await api.get('/super-admin/stations/overview', { params });
            setStations(data);
        } catch(error) {
            console.error("Failed to fetch stations overview", error);
        } finally { 
            setLoading(false);
            setRefreshing(false);
            setInitialLoadDone(true);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchStationsOverview(!initialLoadDone);
        }, 300);

        return () => clearTimeout(timer);
    }, [sortConfig, statusFilter, vehicleCountFilter, revenueRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setStatusFilter('');
        setVehicleCountFilter('');
        setRevenueRange({ min: '', max: '' });
    };

    const hasActiveFilters = statusFilter || vehicleCountFilter || revenueRange.min || revenueRange.max;

    const handleEdit = (station) => {
        setSelectedStation(station);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setSelectedStation(null);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        fetchStationsOverview();
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading stations...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header with Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Stations Overview
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage and monitor all charging stations across the network
                    </p>
                    {refreshing && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-2">Updating results...</p>
                    )}
                </div>
                <div className="flex items-center gap-3">
                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters} 
                            className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-medium transition-colors duration-200 border border-red-200 dark:border-red-700"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button 
                        onClick={handleAdd} 
                        className="btn btn-primary transform hover:scale-105 transition-all duration-200 shadow-md"
                    >
                        <span className="flex items-center space-x-2">
                            <span>+</span>
                            <span>Add Station</span>
                        </span>
                    </button>
                </div>
            </div>
            
            {/* Enhanced Filters */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Filters & Search
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Management Status
                        </label>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="">All Stations</option>
                            <option value="managed">Managed</option>
                            <option value="unmanaged">Unmanaged</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Vehicle Count</label>
                        <select 
                            value={vehicleCountFilter} 
                            onChange={(e) => setVehicleCountFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="">Any Count</option>
                            <option value="0">No Vehicles</option>
                            <option value="1-5">1-5 Vehicles</option>
                            <option value="6-10">6-10 Vehicles</option>
                            <option value="10+">10+ Vehicles</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Revenue Range (₹)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={revenueRange.min}
                                onChange={(e) => setRevenueRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={revenueRange.max}
                                onChange={(e) => setRevenueRange(prev => ({ ...prev, max: e.target.value }))}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
                        <div className="flex items-center gap-2">
                            <select 
                                value={sortConfig.key} 
                                onChange={(e) => setSortConfig(prev => ({ ...prev, key: e.target.value }))}
                                className="flex-1 px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            >
                                <option value="name">Name</option>
                                <option value="totalVehicles">Vehicle Count</option>
                                <option value="totalRevenue">Revenue</option>
                                <option value="activeRides">Active Rides</option>
                            </select>
                            <button
                                onClick={() => setSortConfig(prev => ({ ...prev, direction: prev.direction === 'asc' ? 'desc' : 'asc' }))}
                                className="px-3 py-3 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 bg-white dark:bg-gray-900 text-gray-950 dark:text-white text-sm transition-all duration-200 focus:ring-2 focus:ring-primary-500"
                            >
                                {sortConfig.direction === 'asc' ? 'ASC' : 'DESC'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {stations.length > 0 ? (
                    stations.map(stationWithStats => (
                        <StationCard key={stationWithStats._id} stationData={stationWithStats} onEdit={() => handleEdit(stationWithStats)} />
                    ))
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 col-span-full">
                        {hasActiveFilters ? 'No stations found matching the filters.' : 'No stations have been created yet.'}
                    </p>
                )}
            </div>

            {isModalOpen && (
                <StationModal 
                    station={selectedStation}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
}

export default StationManager;