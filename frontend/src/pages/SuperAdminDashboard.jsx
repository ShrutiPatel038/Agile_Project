import { useState } from 'react';

// Import all the manager components for each tab
import StationManager from '../components/super-admin/StationManager';
import UserManager from '../components/super-admin/UserManager';
import VehicleManager from '../components/super-admin/VehicleManager';
import ActiveRidesManager from '../components/super-admin/ActiveRidesManager';
import CustomerManager from '../components/super-admin/CustomerManager';

const SuperAdminDashboard = () => {
    // Default to the most important tab, 'stations'
    const [activeTab, setActiveTab] = useState('stations');

    // Define the tabs for the navigation
    const tabs = [
        { id: 'stations', label: 'Stations Overview' },
        { id: 'vehicles', label: 'Vehicle Fleet' },
        { id: 'masters', label: 'Staff Management' },
        { id: 'customers', label: 'Customer Management' },
        { id: 'rides', label: 'Active Rides' },
    ];

    return (
        <div className="min-h-screen bg-transparent space-y-8 animate-fade-in">
            {/* Sleek Hero Header Section */}
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 relative overflow-hidden shadow-sm border border-gray-200 dark:border-gray-800">
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-primary-200/25 dark:bg-primary-900/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-accent-300/20 dark:bg-accent-900/10 rounded-full blur-3xl"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                    <div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                            Super Admin Panel
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">
                            Complete control and oversight of your EV rental ecosystem. Monitor stations, active rides, user accounts, and fleet management.
                        </p>
                    </div>
                    <div className="flex items-center space-x-3 bg-gray-50 dark:bg-gray-900/60 px-4 py-2.5 rounded-2xl border border-gray-200 dark:border-gray-800 font-semibold text-xs text-gray-600 dark:text-gray-300 shrink-0 shadow-sm">
                        <svg className="w-4 h-4 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>
                            {new Date().toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                            })}
                        </span>
                    </div>
                </div>
            </div>

            {/* Enhanced Tab Navigation */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-1.5">
                <nav className="flex space-x-1" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`${
                                activeTab === tab.id
                                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-200/50 dark:border-primary-800/40 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                            } flex-1 py-3 px-6 rounded-xl font-semibold text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content area with enhanced styling */}
            <div className="space-y-8">
                {activeTab === 'stations' && <StationManager />}
                {activeTab === 'vehicles' && <VehicleManager />}
                {activeTab === 'masters' && <UserManager />}
                {activeTab === 'customers' && <CustomerManager />}
                {activeTab === 'rides' && <ActiveRidesManager />}
            </div>
        </div>
    );
};

export default SuperAdminDashboard;