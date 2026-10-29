import { useState, useEffect } from 'react';
import api from '../../services/api';

// --- Sub-component: Modal for Editing a Master ---
const MasterEditModal = ({ master, onClose, onSuccess }) => {
    const [form, setForm] = useState({ name: master.name, email: master.email });
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
        <div className="fixed inset-0 bg-black bg-opacity-65 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800 animate-fadeIn" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Edit Master: {master.name}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
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
                            {loading ? 'Updating...' : 'Update'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Sub-component: Form to CREATE a new Station Master ---
const CreateMasterForm = ({ stations, onSuccess }) => {
    const [form, setForm] = useState({ name: '', email: '', password: '', stationId: '' });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    const availableStations = stations.filter(s => s.masterCount < 3);
    
    useEffect(() => {
        if (availableStations.length > 0) {
            setForm(prev => ({ ...prev, stationId: availableStations[0]._id }));
        }
    }, [stations]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ text: '', type: '' });
        try {
            await api.post('/super-admin/users/masters', form);
            setMessage({ text: 'Station Master created!', type: 'success' });
            setForm({ name: '', email: '', password: '', stationId: availableStations[0]?._id || '' });
            onSuccess();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || 'Failed to create account.', type: 'error' });
        } finally { setLoading(false); }
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold mb-5 text-gray-800 dark:text-white">Create New Station Master</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
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
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Set Initial Password</label>
                    <input 
                        type="password" 
                        value={form.password} 
                        onChange={e => setForm({ ...form, password: e.target.value })} 
                        required 
                        className="input" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Assign to Station</label>
                    <select 
                        value={form.stationId} 
                        onChange={e => setForm({ ...form, stationId: e.target.value })} 
                        required 
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500" 
                        disabled={availableStations.length === 0}
                    >
                        {availableStations.length > 0 ? (
                            availableStations.map(s => (
                                <option key={s._id} value={s._id}>{s.name} ({s.masterCount}/3 Filled)</option>
                            ))
                        ) : (
                            <option value="" disabled>All stations are full</option>
                        )}
                    </select>
                </div>
                <button 
                    type="submit" 
                    disabled={loading || availableStations.length === 0} 
                    className="w-full btn btn-primary py-3"
                >
                    Create Master Account
                </button>
                {message.text && <p className={`mt-2 text-sm font-medium ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{message.text}</p>}
            </form>
        </div>
    );
};

// --- Sub-component: Table to MANAGE existing Station Masters ---
const MastersList = ({ masters, onDemote, onEdit }) => (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
        <h3 className="text-xl font-bold mb-5 text-gray-800 dark:text-white">Current Station Masters</h3>
        <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
                <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Master Name</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Assigned Station</th>
                        <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {masters.length > 0 ? masters.map((master, index) => (
                        <tr key={master._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                            <td className="px-4 py-3 text-gray-900 dark:text-white">
                                <span className="font-semibold">{master.name}</span> <span className="text-gray-500 dark:text-gray-400 text-xs">({master.email})</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900 dark:text-white">{master.station?.name || 'Unassigned'}</td>
                            <td className="px-4 py-3">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => onEdit(master)} 
                                        className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 border border-primary-200 dark:border-primary-800 px-3 py-1.5 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-950/20 transition-all duration-200"
                                    >
                                        Edit
                                    </button>
                                    <button 
                                        onClick={() => onDemote(master._id)} 
                                        className="text-xs font-semibold text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="3" className="p-4 text-center text-gray-500 dark:text-gray-400">
                                No Station Masters created yet.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    </div>
);


// --- Sub-component: Table to VIEW regular users ---
const AllUsersList = () => {
    const [data, setData] = useState({ users: [], totalPages: 1, currentPage: 1 });
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchUsers = async (page = 1) => {
            setLoading(true);
            try {
                const { data } = await api.get(`/super-admin/users/regular?page=${page}`);
                setData(data);
            } catch (error) {
                console.error("Failed to fetch regular users", error);
                setData({ users: [], totalPages: 1, currentPage: 1 });
            } finally { setLoading(false); }
        };
        fetchUsers();
    }, []);

    if (loading) return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800">
            <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white">Customer List</h3>
            <p className="text-gray-600 dark:text-gray-400">Loading customers...</p>
        </div>
    );

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <h3 className="text-xl font-bold mb-5 text-gray-800 dark:text-white">Customer Directory</h3>
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-600">
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="p-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Joined On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.users?.length > 0 ? (
                            data.users.map((user, index) => (
                                <tr key={user._id} className={`${index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-700/30' : 'bg-white dark:bg-transparent'} hover:bg-gray-100 dark:hover:bg-gray-600/30 transition-colors duration-200`}>
                                    <td className="p-4 font-semibold text-gray-900 dark:text-white">{user.name}</td>
                                    <td className="p-4 text-gray-900 dark:text-white">{user.email}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="3" className="p-4 text-center text-gray-500 dark:text-gray-400">
                                    No registered users found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- Main UserManager Component ---
const UserManager = () => {
    const [masters, setMasters] = useState([]);
    const [stations, setStations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedMaster, setSelectedMaster] = useState(null);

    const fetchData = async () => {
        try {
            const { data } = await api.get('/super-admin/staff-data');
            setMasters(data.masters || []);
            setStations(data.stations || []);
        } catch (error) {
            console.error("Failed to fetch staff management data", error);
            setMasters([]);
            setStations([]);
        } finally {
            if(loading) setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleDemote = async (userId) => {
        if (!window.confirm('Are you sure you want to PERMANENTLY DELETE this Station Master account?')) return;
        try {
            await api.delete(`/super-admin/users/masters/${userId}`);
            fetchData();
        } catch (error) { alert('Failed to delete account.'); }
    };

    const handleEditMaster = (master) => {
        setSelectedMaster(master);
        setIsEditModalOpen(true);
    };

    const handleSuccess = () => {
        setIsEditModalOpen(false);
        fetchData();
    };
    
    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="text-center space-y-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent mx-auto"></div>
                    <p className="text-gray-600 dark:text-gray-400 font-medium">Loading staff management data...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1">
                    <CreateMasterForm stations={stations} onSuccess={fetchData} />
                </div>
                <div className="lg:col-span-2">
                    <MastersList masters={masters} onDemote={handleDemote} onEdit={handleEditMaster} />
                </div>
            </div>
            <AllUsersList />
            {isEditModalOpen && <MasterEditModal master={selectedMaster} onClose={() => setIsEditModalOpen(false)} onSuccess={handleSuccess} />}
        </div>
    );
};

export default UserManager;