import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
    const { authUser } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (authUser) {
            if (authUser.role === 'super-admin') {
                navigate('/super-admin');
            } else if (authUser.role === 'station-master') {
                navigate('/dashboard');
            } else if (authUser.role === 'user') {
                navigate('/profile');
            }
        }
    }, [authUser, navigate]);

    // Only show homepage for non-authenticated users
    if (authUser) {
        return null; // Will redirect based on role
    }

    const features = [
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
            ),
            title: "100% Electric",
            description: "Zero emissions, maximum performance. Drive green with our premium EV fleet."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            title: "Secure Bookings",
            description: "Secure Razorpay payment gateway and verified signatures for peace of mind."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "Flexible Rentals",
            description: "Rent by the hour with real-time availability tracking and instant booking."
        },
        {
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            ),
            title: "24/7 Support",
            description: "Real-time notifications and dedicated support whenever you need assistance."
        }
    ];

    const stats = [
        { value: "500+", label: "Happy Customers" },
        { value: "50+", label: "EVs Available" },
        { value: "15+", label: "Charging Stations" },
        { value: "98%", label: "Satisfaction Rate" }
    ];

    return (
        <div className="animate-fadeIn">
            {/* Hero Section */}
            <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
                {/* Animated Background */}
                <div className="absolute inset-0 gradient-bg">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                </div>

                {/* Floating Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }}></div>

                <div className="relative z-10 section-container text-center text-white">
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight animate-slideUp mb-6">
                        Drive the Future,
                        <span className="block mt-2">Today.</span>
                    </h1>
                    <p className="mt-6 max-w-3xl mx-auto text-xl sm:text-2xl text-white/90 animate-slideUp font-light" style={{ animationDelay: '0.1s' }}>
                        Experience the thrill of electric mobility. Premium EVs, seamless booking, and sustainable transportation at your fingertips.
                    </p>
                    <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 animate-slideUp" style={{ animationDelay: '0.2s' }}>
                        <Link 
                            to="/vehicles" 
                            className="group px-8 py-4 bg-white text-primary-600 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-glow-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                        >
                            Explore Our Fleet
                            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                        </Link>
                        <Link 
                            to="/register" 
                            className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-2xl hover:bg-white/10 backdrop-blur-sm transition-all transform hover:scale-105 active:scale-95"
                        >
                            Get Started Free
                        </Link>
                    </div>

                    {/* Scroll Indicator */}
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                        </svg>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-white dark:bg-gray-900">
                <div className="section-container">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {stats.map((stat, index) => (
                            <div key={index} className="animate-slideUp" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="text-4xl sm:text-5xl font-extrabold gradient-text mb-2">
                                    {stat.value}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400 font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="section-container">
                <div className="text-center mb-16 animate-slideUp">
                    <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
                        Why Choose <span className="gradient-text">EV-Go</span>?
                    </h2>
                    <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                        Experience the perfect blend of sustainability, technology, and convenience.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div 
                            key={index} 
                            className="feature-card animate-slideUp group"
                            style={{ animationDelay: `${index * 0.1}s` }}
                        >
                            <div className="feature-icon">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
                                {feature.title}
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* CTA Section */}
            <section className="relative py-24 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary-600 to-accent-600 opacity-95"></div>
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10"></div>
                
                <div className="relative section-container text-center text-white">
                    <h2 className="text-4xl sm:text-5xl font-extrabold mb-6 animate-slideUp">
                        Ready to Go Electric?
                    </h2>
                    <p className="text-xl mb-10 max-w-2xl mx-auto animate-slideUp" style={{ animationDelay: '0.1s' }}>
                        Join thousands of satisfied customers who have made the switch to sustainable transportation.
                    </p>
                    <Link 
                        to="/register" 
                        className="inline-flex items-center gap-2 px-10 py-5 bg-white text-primary-600 font-bold text-lg rounded-2xl shadow-2xl hover:shadow-glow-lg transition-all transform hover:scale-105 active:scale-95 animate-slideUp"
                        style={{ animationDelay: '0.2s' }}
                    >
                        Start Your Journey
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                    </Link>
                </div>
            </section>
        </div>
    );
};
export default HomePage;