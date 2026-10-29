import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import BookingModal from '../components/BookingModal';
import DatePicker from 'react-datepicker';

// It's good practice to have a reusable spinner
const Spinner = () => (
    <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
);

const roundToNext10Min = (date) => {
    const minutes = date.getMinutes();
    const roundedMinutes = Math.ceil(minutes / 10) * 10;
    const newDate = new Date(date);
    if (roundedMinutes >= 60) {
        newDate.setHours(newDate.getHours() + 1, 0, 0, 0);
    } else {
        newDate.setMinutes(roundedMinutes, 0, 0);
    }
    return newDate;
};

const VehiclesPage = () => {
    const [stations, setStations] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searched, setSearched] = useState(false);
    
    const [filters, setFilters] = useState({
        stationId: '',
        startTime: roundToNext10Min(new Date()),
        endTime: new Date(new Date().getTime() + 60 * 60 * 1000),
        search: '',
        minPrice: '',
        maxPrice: '',
        sortBy: 'name'
    });

    // --- MISSING LOGIC (ADDED BACK IN) ---
    const [bookingVehicle, setBookingVehicle] = useState(null);
    const navigate = useNavigate();
    // ------------------------------------

    // Fetch stations on initial load
    useEffect(() => {
        const fetchStations = async () => {
            try {
                const { data } = await api.get('/public/stations');
                setStations(data);
                if (data.length > 0) {
                    setFilters(prev => ({ ...prev, stationId: data[0]._id }));
                }
            } catch (error) {
                console.error("Failed to fetch stations", error);
            }
        };
        fetchStations();
    }, []);

    // --- NEW: Automatically run search on page load ---
    useEffect(() => {
        // Run the search only when the initial stationId is set
        if (filters.stationId) {
            findVehicles();
        }
    }, [filters.stationId]); // This effect runs once when the default station is loaded
    // ----------------------------------------------------

    const handleFilterChange = (name, value) => {
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const findVehicles = async () => {
        if (!filters.stationId || !filters.startTime || !filters.endTime) {
            alert("Please select a station and a time slot.");
            return;
        }
        setLoading(true);
        try {
            const { data } = await api.get('/public/vehicles', {
                params: {
                    stationId: filters.stationId,
                    startTime: filters.startTime.toISOString(),
                    endTime: filters.endTime.toISOString(),
                }
            });
            setVehicles(data);
        } catch (error) {
            console.error("Failed to find vehicles", error);
            setVehicles([]); // Clear vehicles on error
        } finally {
            setLoading(false);
        }
    };

    // --- MISSING HANDLERS (ADDED BACK IN) ---
    const handleOpenBookingModal = (vehicle) => {
        setBookingVehicle(vehicle);
    };

    const handleCloseBookingModal = () => {
        setBookingVehicle(null);
    };

    const handleBookingSuccess = () => {
        alert('Booking request sent! Awaiting confirmation.');
        handleCloseBookingModal();
        navigate('/profile');
    };
    // ---------------------------------------

    return (
        <div className="min-h-screen bg-transparent">
            {/* Beautiful Hero Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mb-8 relative overflow-hidden animate-fade-in shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary-200/25 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-accent-300/20 dark:bg-accent-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center shadow-inner-glow">
                        <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Find Your Perfect Ride
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                            Discover our eco-friendly fleet and book the perfect electric vehicle for your journey.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-8 animate-slide-up">
                {/* Enhanced Filter Section */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                    <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center space-x-3">
                        <svg className="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <h2 className="text-sm font-bold text-gray-900 dark:text-white">Search & Filters</h2>
                    </div>
                    
                    <div className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="label flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Select Station
                                </label>
                                <select 
                                    value={filters.stationId} 
                                    onChange={e => handleFilterChange('stationId', e.target.value)} 
                                    className="input"
                                >
                                    {stations.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
                                </select>
                            </div>
                            
                            <div>
                                <label className="label flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Start Time
                                </label>
                                <DatePicker 
                                    selected={filters.startTime} 
                                    onChange={date => handleFilterChange('startTime', date)} 
                                    showTimeSelect 
                                    dateFormat="Pp" 
                                    className="input"
                                />
                            </div>
                            
                            <div>
                                <label className="label flex items-center gap-1">
                                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    End Time
                                </label>
                                <DatePicker 
                                    selected={filters.endTime} 
                                    onChange={date => handleFilterChange('endTime', date)} 
                                    showTimeSelect 
                                    dateFormat="Pp" 
                                    className="input"
                                />
                            </div>
                            
                            <div className="flex items-end">
                                <button 
                                    onClick={findVehicles} 
                                    disabled={loading}
                                    className="w-full btn btn-primary py-3 text-xs font-bold shadow-premium hover:shadow-glow disabled:opacity-50"
                                >
                                    {loading ? (
                                        <span className="flex items-center justify-center space-x-2">
                                            <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                                            <span>Searching...</span>
                                        </span>
                                    ) : (
                                        <span className="flex items-center justify-center space-x-2">
                                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                            </svg>
                                            <span>Find Vehicles</span>
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>
                        
                        {/* Secondary Filters */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Search vehicles..."
                                    value={filters.search}
                                    onChange={e => handleFilterChange('search', e.target.value)}
                                    className="input"
                                />
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Min price"
                                    value={filters.minPrice}
                                    onChange={e => handleFilterChange('minPrice', e.target.value)}
                                    className="input"
                                />
                            </div>
                            
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Max price"
                                    value={filters.maxPrice}
                                    onChange={e => handleFilterChange('maxPrice', e.target.value)}
                                    className="input"
                                />
                            </div>
                            
                            <select
                                value={filters.sortBy}
                                onChange={e => handleFilterChange('sortBy', e.target.value)}
                                className="input"
                            >
                                <option value="name">Sort by Name</option>
                                                <option value="price">Sort by Price</option>
                                                <option value="rating">Sort by Rating</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Results Section */}
                {loading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="text-center space-y-4">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Finding perfect vehicles for you...</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {vehicles.length > 0 && (
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    Available Fleet
                                </h2>
                                <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">
                                    {vehicles.filter(vehicle => {
                                        const matchesSearch = vehicle.modelName.toLowerCase().includes(filters.search.toLowerCase());
                                        const matchesMinPrice = !filters.minPrice || vehicle.pricePerHour >= parseInt(filters.minPrice);
                                        const matchesMaxPrice = !filters.maxPrice || vehicle.pricePerHour <= parseInt(filters.maxPrice);
                                        return matchesSearch && matchesMinPrice && matchesMaxPrice;
                                    }).length} vehicles found
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {vehicles.length > 0 ? (
                                vehicles
                                    .filter(vehicle => {
                                        const matchesSearch = vehicle.modelName.toLowerCase().includes(filters.search.toLowerCase());
                                        const matchesMinPrice = !filters.minPrice || vehicle.pricePerHour >= parseInt(filters.minPrice);
                                        const matchesMaxPrice = !filters.maxPrice || vehicle.pricePerHour <= parseInt(filters.maxPrice);
                                        return matchesSearch && matchesMinPrice && matchesMaxPrice;
                                    })
                                    .sort((a, b) => {
                                        switch (filters.sortBy) {
                                            case 'price':
                                                return a.pricePerHour - b.pricePerHour;
                                            case 'rating':
                                                return 0; // Placeholder for rating sort
                                            default:
                                                return a.modelName.localeCompare(b.modelName);
                                        }
                                    })
                                    .map(vehicle => (
                                        <VehicleCard 
                                            key={vehicle._id} 
                                            vehicle={vehicle}
                                            onBookNow={handleOpenBookingModal}
                                        />
                                    ))
                            ) : (
                                <div className="col-span-full">
                                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                                        <div className="text-gray-400 mb-4 flex justify-center">
                                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">
                                            No vehicles available
                                        </h3>
                                        <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                                            No vehicles are available for the selected time and station. Please try different criteria or check back later.
                                        </p>
                                        <button 
                                            onClick={() => {
                                                setFilters(prev => ({
                                                    ...prev,
                                                    search: '',
                                                    minPrice: '',
                                                    maxPrice: ''
                                                }));
                                            }}
                                            className="mt-4 px-6 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors duration-200"
                                        >
                                            Clear Filters
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
            
            {bookingVehicle && (
                <BookingModal
                    vehicle={bookingVehicle}
                    onClose={handleCloseBookingModal}
                    onBookingSuccess={handleBookingSuccess}
                />
            )}
        </div>
    );
};

export default VehiclesPage;