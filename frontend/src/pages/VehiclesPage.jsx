import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import VehicleCard from '../components/VehicleCard';
import BookingModal from '../components/BookingModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const roundToNext10Min = (date) => {
  const minutes = date.getMinutes();
  const rounded = Math.ceil(minutes / 10) * 10;
  const d = new Date(date);
  if (rounded >= 60) { d.setHours(d.getHours() + 1, 0, 0, 0); }
  else { d.setMinutes(rounded, 0, 0); }
  return d;
};

const VehiclesPage = () => {
  const [stations, setStations] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingVehicle, setBookingVehicle] = useState(null);
  const navigate = useNavigate();

  const [filters, setFilters] = useState({
    stationId: '',
    startTime: roundToNext10Min(new Date()),
    endTime: new Date(Date.now() + 60 * 60 * 1000),
    search: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'name',
  });

  useEffect(() => {
    api.get('/public/stations').then(({ data }) => {
      setStations(data);
      if (data.length > 0) setFilters((prev) => ({ ...prev, stationId: data[0]._id }));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (filters.stationId) findVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.stationId]);

  const handleFilterChange = (name, value) => setFilters((prev) => ({ ...prev, [name]: value }));

  const findVehicles = async () => {
    if (!filters.stationId || !filters.startTime || !filters.endTime) {
      alert('Please select a station and a time slot.');
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.get('/public/vehicles', {
        params: { stationId: filters.stationId, startTime: filters.startTime.toISOString(), endTime: filters.endTime.toISOString() },
      });
      setVehicles(data);
    } catch {
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSuccess = () => {
    alert('Booking request sent! Awaiting confirmation.');
    setBookingVehicle(null);
    navigate('/profile');
  };

  const filtered = vehicles
    .filter((v) => {
      const matchSearch = v.modelName.toLowerCase().includes(filters.search.toLowerCase());
      const matchMin = !filters.minPrice || v.pricePerHour >= parseInt(filters.minPrice);
      const matchMax = !filters.maxPrice || v.pricePerHour <= parseInt(filters.maxPrice);
      return matchSearch && matchMin && matchMax;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'price') return a.pricePerHour - b.pricePerHour;
      return a.modelName.localeCompare(b.modelName);
    });

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mb-8 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Find Your Perfect Ride</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Discover our eco-friendly fleet and book the perfect electric vehicle for your journey.</p>
      </div>

      <div className="space-y-8">
        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">Search &amp; Filters</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Station</label>
                <select value={filters.stationId} onChange={(e) => handleFilterChange('stationId', e.target.value)} className="input w-full">
                  {stations.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Time</label>
                <DatePicker selected={filters.startTime} onChange={(d) => handleFilterChange('startTime', d)} showTimeSelect dateFormat="Pp" className="input w-full" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Time</label>
                <DatePicker selected={filters.endTime} onChange={(d) => handleFilterChange('endTime', d)} showTimeSelect dateFormat="Pp" className="input w-full" />
              </div>
              <div className="flex items-end">
                <button onClick={findVehicles} disabled={loading} className="w-full btn btn-primary py-3 text-xs font-bold disabled:opacity-50">
                  {loading ? 'Searching…' : 'Find Vehicles'}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
              <input type="text" placeholder="Search vehicles…" value={filters.search} onChange={(e) => handleFilterChange('search', e.target.value)} className="input" />
              <input type="number" placeholder="Min price" value={filters.minPrice} onChange={(e) => handleFilterChange('minPrice', e.target.value)} className="input" />
              <input type="number" placeholder="Max price" value={filters.maxPrice} onChange={(e) => handleFilterChange('maxPrice', e.target.value)} className="input" />
              <select value={filters.sortBy} onChange={(e) => handleFilterChange('sortBy', e.target.value)} className="input">
                <option value="name">Sort by Name</option>
                <option value="price">Sort by Price</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent" />
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.length > 0 && (
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Available Fleet</h2>
                <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-full">{filtered.length} vehicles found</span>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filtered.length > 0 ? (
                filtered.map((v) => <VehicleCard key={v._id} vehicle={v} onBookNow={setBookingVehicle} />)
              ) : (
                <div className="col-span-full text-center py-16 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                  <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-300 mb-2">No vehicles available</h3>
                  <p className="text-gray-500 dark:text-gray-400">Try different criteria or check back later.</p>
                  <button onClick={() => setFilters((p) => ({ ...p, search: '', minPrice: '', maxPrice: '' }))} className="mt-4 px-6 py-2 bg-indigo-500 text-white rounded-xl hover:bg-indigo-600 transition-colors">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {bookingVehicle && (
        <BookingModal vehicle={bookingVehicle} onClose={() => setBookingVehicle(null)} onBookingSuccess={handleBookingSuccess} />
      )}
    </div>
  );
};

export default VehiclesPage;
