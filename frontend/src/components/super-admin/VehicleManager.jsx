import { useState, useEffect } from 'react';
import api from '../../services/api';
import VehicleModal from './VehicleModal';

const VehicleManager = () => {
    const [vehicles, setVehicles] = useState([]);
    const [stations, setStations] = useState([]);
    const [masters, setMasters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState({ key: 'modelName', direction: 'asc' });
    
    // Filters
    const [statusFilter, setStatusFilter] = useState('');
    const [stationFilter, setStationFilter] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedVehicle, setSelectedVehicle] = useState(null);

    const columns = [
        { key: 'modelName', label: 'Model', sortable: true },
        { key: 'station.name', label: 'Station', sortable: true },
        { key: 'pricePerHour', label: 'Price/Hour', sortable: true },
        { key: 'status', label: 'Status', sortable: true }
    ];

    const fetchData = async () => {
        setLoading(true);
        try {
            const timer = setTimeout(async () => {
                const params = {
                    sortBy: sortConfig.key,
                    sortOrder: sortConfig.direction,
                    status: statusFilter,
                    station: stationFilter,
                    minPrice: priceRange.min,
                    maxPrice: priceRange.max
                };
                
                const [vehiclesRes, stationsRes, mastersRes] = await Promise.all([
                    api.get('/super-admin/vehicles', { params }),
                    api.get('/super-admin/stations'),
                    api.get('/super-admin/users/masters')
                ]);
                setVehicles(vehiclesRes.data);
                setStations(stationsRes.data);
                setMasters(mastersRes.data);
                setLoading(false);
            }, 300);
            
            return () => clearTimeout(timer);
        } catch(error){
            console.error("Failed to fetch fleet data", error);
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [sortConfig, statusFilter, stationFilter, priceRange]);

    const handleSort = (key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const clearFilters = () => {
        setStatusFilter('');
        setStationFilter('');
        setPriceRange({ min: '', max: '' });
    };

    const hasActiveFilters = statusFilter || stationFilter || priceRange.min || priceRange.max;

    const managedStationIds = masters.map(master => master.station?._id);
    const managedStations = stations.filter(station => managedStationIds.includes(station._id));

    const handleAddVehicle = () => {
        setSelectedVehicle(null);
        setIsModalOpen(true);
    };

    const handleEditVehicle = (vehicle) => {
        setSelectedVehicle(vehicle);
        setIsModalOpen(true);
    };

    const handleSuccess = () => {
        setIsModalOpen(false);
        fetchData();
    };

    const handleDeleteVehicle = async (vehicleId) => {
        if (!confirm('Are you sure you want to delete this vehicle?')) return;
        try {
            console.log('Attempting to delete vehicle with ID:', vehicleId);
            console.log('Making request to:', `/super-admin/vehicles/${vehicleId}`);
            const response = await api.delete(`/super-admin/vehicles/${vehicleId}`);
            console.log('Delete response:', response);
            fetchData();
        } catch (error) {
            console.error('Delete error details:', error);
            console.error('Error response:', error.response);
            alert('Failed to delete vehicle: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white">
                        Vehicle Fleet Management
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Manage vehicles across all stations in your network
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    {hasActiveFilters && (
                        <button 
                            onClick={clearFilters} 
                            className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-700 px-3 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                            Clear Filters
                        </button>
                    )}
                    <button 
                        onClick={handleAddVehicle} 
                        disabled={managedStations.length === 0} 
                        className="btn btn-primary transform hover:scale-105 transition-all duration-200 shadow-md disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                        title={managedStations.length === 0 ? "You must assign a master to a station before adding vehicles." : ""}
                    >
                        + Add Vehicle
                    </button>
                </div>
            </div>
            
            {/* Enhanced Filters */}
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-6 space-y-4">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Vehicle Filters
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Status</label>
                        <select 
                            value={statusFilter} 
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="">All Status</option>
                            <option value="available">Available</option>
                            <option value="in-use">In Use</option>
                            <option value="maintenance">Maintenance</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Station</label>
                        <select 
                            value={stationFilter} 
                            onChange={(e) => setStationFilter(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                        >
                            <option value="">All Stations</option>
                            {stations.map(station => (
                                <option key={station._id} value={station._id}>{station.name}</option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Price Range (₹/hr)</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                            />
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                            <input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
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
                                <option value="modelName">Model Name</option>
                                <option value="pricePerHour">Price</option>
                                <option value="status">Status</option>
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
            
            {/* Enhanced Vehicle Table */}
             <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white">Vehicle Fleet</h3>
                    </div>
                </div>
                
                <div className="p-6">
                    {loading ? (
                        <div className="flex justify-center items-center py-12">
                            <div className="text-center space-y-4">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                                <p className="text-gray-600 dark:text-gray-400 font-medium">Loading vehicles...</p>
                            </div>
                        </div>
                    ) : vehicles.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-gray-200 dark:border-gray-600">
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Model</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Station</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price/Hour</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vehicles.map((v, index) => (
                                        <tr key={v._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{v.modelName}</td>
                                            <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{v.station?.name || 'N/A'}</td>
                                            <td className="px-4 py-3 font-semibold text-green-600 dark:text-green-400">₹{v.pricePerHour?.toLocaleString('en-IN') || '0'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                                                    v.status === 'available' ? 'bg-green-100 text-green-800 border border-green-200' : 
                                                    v.status === 'in-use' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                                    'bg-red-100 text-red-800 border border-red-200'
                                                }`}>
                                                    {v.status?.replace('-', ' ')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => handleEditVehicle(v)} 
                                                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all duration-200"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteVehicle(v._id)} 
                                                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <h3 className="text-lg font-semibold text-gray-600 dark:text-gray-300 mb-2">No vehicles found</h3>
                            <p className="text-gray-500 dark:text-gray-400">Add vehicles to start managing your fleet</p>
                        </div>
                    )}
                </div>
            </div>

            {isModalOpen && (
                <VehicleModal 
                    vehicle={selectedVehicle}
                    stations={managedStations}
                    allStations={stations}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

export default VehicleManager;