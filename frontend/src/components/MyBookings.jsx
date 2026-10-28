import { useEffect, useState } from 'react';
import api from '../services/api.js';

const statusColor = (s) => {
  switch (s) {
    case 'confirmed': return 'bg-sky-100 text-sky-800 dark:bg-sky-950/45 dark:text-sky-300';
    case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 font-bold';
    case 'completed': return 'bg-gray-200 text-gray-700 dark:bg-gray-800/60 dark:text-gray-300';
    case 'cancelled': return 'bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400';
    default: return 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400';
  }
};

// Socket.IO real-time refresh wired in Sprint 3 (Commit 30).
export default function MyBookings() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      const { data } = await api.get('/bookings/mybookings');
      setItems(data || []);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load bookings.');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchBookings(); }, []);

  if (loading) return <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm text-sm text-gray-500">Loading bookings…</div>;
  if (error) return <div className="text-red-500 dark:text-red-400 p-4">{error}</div>;
  if (items.length === 0) return (
    <div className="bg-white dark:bg-gray-900 p-10 rounded-2xl shadow-sm text-center text-gray-500 dark:text-gray-400">
      <p className="text-lg font-semibold mb-1">No bookings yet</p>
      <p className="text-sm">Head to <a href="/vehicles" className="text-indigo-600 dark:text-indigo-400 hover:underline">Vehicles</a> to book your first ride.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {items.map((b) => (
        <div key={b._id} className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-bold text-gray-900 dark:text-white text-base">{b.vehicle?.modelName || 'Vehicle'}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{b.station?.name || ''}</p>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${statusColor(b.status)}`}>{b.status}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
            <span>Start: {new Date(b.startTime).toLocaleString()}</span>
            <span>End: {new Date(b.endTime).toLocaleString()}</span>
            <span>Cost: <span className="font-semibold text-gray-900 dark:text-white">₹{b.totalCost?.toLocaleString('en-IN')}</span></span>
            <span>Payment: <span className={`font-medium ${b.paymentStatus === 'completed' ? 'text-green-600' : 'text-amber-600'}`}>{b.paymentStatus}</span></span>
          </div>
          {b.securityDeposit?.amount > 0 && (
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Security deposit: ₹{b.securityDeposit.amount} ({b.securityDeposit.status})</p>
          )}
        </div>
      ))}
    </div>
  );
}
