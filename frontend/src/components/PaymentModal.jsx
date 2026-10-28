// Full Razorpay payment modal ported in Commit 28 (EVG-37).
// This stub keeps BookingModal compilable in Sprint 2.
export default function PaymentModal({ booking, onClose, onSuccess }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Payment</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-2">Booking ID: {booking?._id}</p>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Total: ₹{booking?.totalCost}</p>
        <p className="text-sm text-amber-600 dark:text-amber-400 mb-6">Razorpay integration available in Sprint 3.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={onClose} className="btn btn-ghost px-4 py-2">Close</button>
          <button onClick={onSuccess} className="btn btn-primary px-4 py-2">Simulate Payment</button>
        </div>
      </div>
    </div>
  );
}
