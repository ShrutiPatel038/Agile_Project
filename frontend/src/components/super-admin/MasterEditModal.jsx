import { useState } from 'react';
import api from '../../services/api';

const MasterEditModal = ({ master, onClose, onSuccess }) => {
    const [form, setForm] = useState({
        name: master ? master.name : '',
        email: master ? master.email : '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.put(`/super-admin/users/masters/${master._id}`, form);
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update master.');
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Edit Station Master</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                        <input 
                            value={form.name} 
                            onChange={e => setForm({ ...form, name: e.target.value })} 
                            required 
                            className="input" 
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Email</label>
                        <input 
                            type="email" 
                            value={form.email} 
                            onChange={e => setForm({ ...form, email: e.target.value })} 
                            required 
                            className="input" 
                        />
                    </div>
                    {/* Note: Password change would typically be a separate, more secure flow */}
                    {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-3">
                        <button 
                            type="button" 
                            onClick={onClose}
                            className="btn btn-ghost px-4 py-2 text-sm"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="btn btn-primary px-5 py-2 text-sm"
                        >
                            {loading ? 'Updating...' : 'Update Master'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
export default MasterEditModal;