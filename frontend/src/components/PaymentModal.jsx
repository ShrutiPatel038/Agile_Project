import { useState } from 'react';
import api from '../services/api';

const PaymentModal = ({ booking, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        setLoading(true);
        try {
            const { data } = await api.post('/payments/create-order', {
                bookingId: booking._id
            });

            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'EV Rental System',
                description: `Payment for ${booking.vehicle.modelName}`,
                order_id: data.orderId,
                handler: async (response) => {
                    try {
                        const verifyResponse = await api.post('/payments/verify', {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            bookingId: booking._id
                        });
                        
                        if (verifyResponse.data.status === 'processing') {
                            alert('Payment submitted successfully! Your booking will be confirmed shortly.');
                        } else if (verifyResponse.data.status === 'completed') {
                            alert('Payment successful! Booking confirmed.');
                        } else {
                            alert('Payment successful! Booking status updated.');
                        }
                        
                        onSuccess();
                        onClose();
                    } catch (error) {
                        alert('Payment verification failed. Please contact support if amount was deducted.');
                    }
                },
                prefill: {
                    name: booking.user?.name || '',
                    email: booking.user?.email || '',
                },
                theme: {
                    color: '#4F46E5'
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error) {
            alert('Payment initiation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
                <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Complete Payment</h3>
                
                <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Vehicle:</span>
                        <span className="font-medium text-gray-900 dark:text-white">{booking.vehicle?.modelName}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {Math.ceil((new Date(booking.endTime) - new Date(booking.startTime)) / (1000 * 60 * 60))} hours
                        </span>
                    </div>
                    <div className="flex justify-between text-lg font-semibold border-t pt-3">
                        <span className="text-gray-900 dark:text-white">Total Amount:</span>
                        <span className="text-green-600 dark:text-green-400">₹{booking.totalCost?.toLocaleString('en-IN')}</span>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-white rounded-md hover:bg-gray-300 dark:hover:bg-gray-500"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handlePayment}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400"
                    >
                        {loading ? 'Processing...' : 'Pay Now'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;