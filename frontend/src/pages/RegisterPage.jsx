import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const RegisterPage = () => {
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setAuthUser } = useAuth();

    // Updates the form state as the user types
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Handles the form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Basic frontend validation
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long.');
            return;
        }

        setLoading(true);
        try {
            // Send the registration data to the backend API
            const { data } = await api.post('/auth/register', formData);
            if (data?.token) {
                localStorage.setItem('token', data.token);
            }
            
            // On success, update the global auth state
            setAuthUser(data);
            
            // Redirect the user to their new profile page
            navigate('/profile');
        } catch (err) {
            // Display any error messages from the backend
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            // Ensure the loading state is turned off, whether it succeeded or failed
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-md mt-16 animate-fade-in">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Create Your Account</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Join EV-Go and begin your electric vehicle journey.
                </p>
            </div>
            
            <form onSubmit={handleSubmit} className="mt-8 space-y-5 card p-8 shadow-sm bg-white dark:bg-gray-900 rounded-3xl">
                {error && (
                    <div className="p-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 rounded-2xl text-xs font-semibold" role="alert">
                        <span>{error}</span>
                    </div>
                )}
                
                <div>
                    <label htmlFor="name" className="label">Full Name</label>
                    <input 
                        id="name" 
                        name="name" 
                        type="text" 
                        autoComplete="name"
                        value={formData.name}
                        onChange={handleChange} 
                        required 
                        className="input" 
                    />
                </div>
                <div>
                    <label htmlFor="email" className="label">Email address</label>
                    <input 
                        id="email" 
                        name="email" 
                        type="email" 
                        autoComplete="email"
                        value={formData.email}
                        onChange={handleChange} 
                        required 
                        className="input" 
                    />
                </div>
                <div>
                    <label htmlFor="password" className="label">Password</label>
                    <input 
                        id="password" 
                        name="password" 
                        type="password" 
                        autoComplete="new-password"
                        minLength="6"
                        value={formData.password}
                        onChange={handleChange} 
                        required 
                        className="input" 
                    />
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full btn btn-primary mt-2 py-3"
                >
                    {loading ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 pt-2">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary-600 dark:text-primary-400 font-bold hover:underline transition-all">
                        Login here
                    </Link>
                </p>
            </form>
        </div>
    );
};

export default RegisterPage;