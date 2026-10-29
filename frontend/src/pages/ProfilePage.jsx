import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import MyBookings from '../components/MyBookings';

const exportToPDF = async () => {
    try {
        const { data } = await api.get('/bookings/mybookings');
        const bookings = data;
        
        // Create HTML content for PDF
        const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>EV Rental - Booking History</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .booking { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
                .booking-title { font-weight: bold; color: #4f46e5; margin-bottom: 10px; }
                .booking-detail { margin: 5px 0; }
                .status { padding: 3px 8px; border-radius: 3px; font-size: 12px; }
                .confirmed { background: #dbeafe; color: #1e40af; }
                .active { background: #dcfce7; color: #166534; }
                .completed { background: #f3f4f6; color: #374151; }
                .cancelled { background: #fee2e2; color: #dc2626; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>EV RENTAL SYSTEM</h1>
                <h2>Booking History Report</h2>
                <p>Generated on: ${new Date().toLocaleDateString()}</p>
            </div>
            ${bookings.map((booking, index) => `
                <div class="booking">
                    <div class="booking-title">${index + 1}. ${booking.vehicle?.modelName || 'Vehicle'}</div>
                    <div class="booking-detail">Status: <span class="status ${booking.status}">${booking.status.toUpperCase()}</span></div>
                    <div class="booking-detail">Start: ${new Date(booking.startTime).toLocaleString()}</div>
                    <div class="booking-detail">End: ${new Date(booking.endTime).toLocaleString()}</div>
                    <div class="booking-detail">Cost: ₹${booking.totalCost?.toLocaleString('en-IN')}</div>
                </div>
            `).join('')}
        </body>
        </html>`;
        
        // Create a new window and print to PDF
        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load then trigger print
        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
        
    } catch (error) {
        alert('Failed to export bookings');
    }
};

// --- Reusable Countdown Timer Component ---
const CountdownTimer = ({ expiryTimestamp, onExpire }) => {
    const calculateTimeLeft = () => {
        const difference = +new Date(expiryTimestamp) - +new Date();
        let timeLeft = {};

        if (difference > 0) {
            timeLeft = {
                minutes: Math.floor((difference / 1000 / 60) % 60),
                seconds: Math.floor((difference / 1000) % 60),
            };
        }
        return timeLeft;
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    useEffect(() => {
        // Exit early if timer is over
        if (!timeLeft.minutes && !timeLeft.seconds) {
            onExpire(); // Notify parent that the timer has expired
            return;
        }

        // Save intervalId to clear the interval when the component unmounts
        const intervalId = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        
        // Clear interval on re-render to avoid memory leaks
        return () => clearInterval(intervalId);
    }, [timeLeft]); // Rerun effect when timeLeft changes

    const timerComponents = [];
    if (timeLeft.minutes !== undefined) {
        timerComponents.push(
            <span key="m" className="font-bold text-red-600">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </span>
        );
    } else {
        timerComponents.push(<span key="exp" className="font-bold text-red-600">Expired</span>);
    }

    return <>{timerComponents}</>;
};

// --- Enhanced UserInfo Component ---
const UserInfo = () => {
    return (
        <div className="p-8 rounded-3xl bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-900/50 shadow-sm relative overflow-hidden animate-slide-up">
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary-200 dark:bg-primary-900 rounded-full opacity-20"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-primary-300 dark:bg-primary-900 rounded-full opacity-10"></div>
            
            <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center shadow-sm">
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-primary-900 dark:text-primary-200">Account Ready</h3>
                </div>
                <p className="text-gray-700 dark:text-gray-300 mb-6 leading-relaxed text-sm">
                    You're all set! Your account is verified and ready to book vehicles. 
                    Start your eco-friendly journey today.
                </p>
                <Link 
                    to="/vehicles" 
                    className="btn btn-primary px-6 py-2.5 text-xs font-bold inline-flex items-center space-x-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>Browse Our Fleet</span>
                </Link>
            </div>
        </div>
    );
};

// --- Enhanced Main ProfilePage Component ---
const ProfilePage = () => {
    const { authUser } = useAuth();

    return (
        <div className="min-h-screen bg-transparent">
            {/* Beautiful Hero Header */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 mb-8 relative overflow-hidden animate-fade-in shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary-200/25 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-accent-300/20 dark:bg-accent-900/10 rounded-full blur-3xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                    <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full flex items-center justify-center shadow-inner-glow">
                        <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="space-y-1 flex-1">
                        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Welcome, {authUser?.name}!
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xl">
                            Manage your active rentals, view loyalty progress, and track support requests.
                        </p>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400 text-xs font-semibold">
                        <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
                        <span>EV-Go Premium Account</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Account Status Card */}
                <UserInfo /> 
                
                {/* Enhanced Quick Actions */}
                <div className="card shadow-sm p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link 
                            to="/favorites" 
                            className="group p-6 bg-gray-50 dark:bg-gray-800/40 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <h4 className="text-base font-bold text-gray-800 dark:text-white mb-1">Favorites</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your saved vehicles</p>
                            </div>
                        </Link>
                        
                        <Link 
                            to="/analytics" 
                            className="group p-6 bg-gray-50 dark:bg-gray-800/40 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                    </svg>
                                </div>
                                <h4 className="text-base font-bold text-gray-800 dark:text-white mb-1">Analytics</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">View ride statistics</p>
                            </div>
                        </Link>
                        
                        <button 
                            onClick={exportToPDF}
                            className="group p-6 w-full bg-gray-50 dark:bg-gray-800/40 rounded-3xl hover:bg-gray-100 dark:hover:bg-gray-800 hover:-translate-y-1 transition-all duration-300 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <div className="text-center">
                                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/40 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform duration-300">
                                    <svg className="w-6 h-6 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <h4 className="text-base font-bold text-gray-800 dark:text-white mb-1">Export PDF</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Download booking details</p>
                            </div>
                        </button>
                    </div>
                </div>
                
                {/* Enhanced Bookings Section */}
                <div className="card shadow-sm p-6">
                    <div className="flex items-center space-x-3 mb-6">
                        <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Active Rentals & History</h3>
                    </div>
                    
                    <MyBookings />
                </div>
            </div>
        </div>
    );
};

export default ProfilePage;