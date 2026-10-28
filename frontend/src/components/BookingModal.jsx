// Full booking modal ported in Commit 21 (EVG-33) when createBooking endpoint exists.
// This stub keeps VehiclesPage compilable in Sprint 2.
export default function BookingModal({ vehicle, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Book {vehicle?.modelName}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Booking form coming in Sprint 2 Commit 21.</p>
        <button onClick={onClose} className="btn btn-primary px-6 py-2">Close</button>
      </div>
    </div>
  );
}
