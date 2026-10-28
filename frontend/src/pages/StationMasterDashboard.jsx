import { useState, useEffect } from 'react';
import api from '../services/api';

// Socket.IO real-time refresh wired in Sprint 3 (Commit 30).

const StatCard = ({ title, value, color }) => (
  <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{title}</p>
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
  </div>
);

const StationMasterDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    try {
      const { data } = await api.get('/station-master/dashboard-data');
      setDashboardData(data);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpdateBooking = async (bookingId, status) => {
    if (!window.confirm(`Are you sure you want to mark this booking as ${status}?`)) return;
    try {
      await api.put(`/station-master/bookings/${bookingId}`, { status });
      fetchData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Action failed.');
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" /></div>;
  if (error) return <div className="text-red-500 dark:text-red-400 p-4">{error}</div>;
  if (!dashboardData) return null;

  const { stationName, stats, vehicles, confirmedBookings, activeRides } = dashboardData;

  const filteredActive = activeRides.filter((r) =>
    r.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle?.modelName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-800">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{stationName}</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Station Master Dashboard</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Total Vehicles" value={stats.totalVehicles} color="text-gray-800 dark:text-white" />
        <StatCard title="Available" value={stats.availableVehicles} color="text-green-600" />
        <StatCard title="Confirmed Bookings" value={stats.confirmedBookingsCount} color="text-sky-600" />
        <StatCard title="Active Rides" value={stats.activeRidesCount} color="text-indigo-600" />
      </div>
      {stats.overdueRidesCount > 0 && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400 font-medium">
          ⚠ {stats.overdueRidesCount} ride(s) are overdue — please follow up.
        </div>
      )}

      {/* Confirmed Bookings */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4"><h3 className="text-lg font-bold text-gray-800 dark:text-white">Confirmed Bookings — Ready to Start</h3></div>
        <div className="p-4 overflow-x-auto">
          {confirmedBookings.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No confirmed bookings.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Vehicle</th><th className="p-2 text-left">Start</th><th className="p-2 text-left">Payment</th><th className="p-2 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {confirmedBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="p-2 font-medium text-gray-900 dark:text-white">{b.user?.name}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{b.vehicle?.modelName}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(b.startTime).toLocaleString()}</td>
                    <td className="p-2"><span className={`text-xs px-2 py-1 rounded-full ${b.paymentStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{b.paymentStatus}</span></td>
                    <td className="p-2 text-right">
                      {b.paymentStatus === 'completed' && (
                        <button onClick={() => handleUpdateBooking(b._id, 'active')} className="text-xs bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">Start Ride</button>
                      )}
                      <button onClick={() => handleUpdateBooking(b._id, 'cancelled')} className="ml-2 text-xs text-red-500 hover:text-red-700">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Active Rides */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">Active Rides</h3>
          <input type="text" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
        </div>
        <div className="p-4 overflow-x-auto">
          {filteredActive.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">No active rides.</p>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
                <tr><th className="p-2 text-left">Customer</th><th className="p-2 text-left">Vehicle</th><th className="p-2 text-left">End Time</th><th className="p-2 text-left">Status</th><th className="p-2 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredActive.map((r) => (
                  <tr key={r._id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${r.isOverdue ? 'bg-red-50 dark:bg-red-950/10' : ''}`}>
                    <td className="p-2 font-medium text-gray-900 dark:text-white">{r.user?.name}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{r.vehicle?.modelName}</td>
                    <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(r.endTime).toLocaleString()}</td>
                    <td className="p-2">{r.isOverdue ? <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Overdue</span> : <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">On time</span>}</td>
                    <td className="p-2 text-right">
                      <button onClick={() => handleUpdateBooking(r._id, 'completed')} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">Complete</button>
                      <button onClick={() => handleUpdateBooking(r._id, 'cancelled')} className="ml-2 text-xs text-red-500 hover:text-red-700">Cancel</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Vehicles */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4"><h3 className="text-lg font-bold text-gray-800 dark:text-white">Fleet ({vehicles.length} vehicles)</h3></div>
        <div className="p-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr><th className="p-2 text-left">Model</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Price/hr</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {vehicles.map((v) => (
                <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td className="p-2 font-medium text-gray-900 dark:text-white">{v.modelName}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-300">{v.status}</td>
                  <td className="p-2 text-gray-600 dark:text-gray-300">₹{v.pricePerHour}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StationMasterDashboard;
