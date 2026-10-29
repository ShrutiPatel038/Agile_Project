import { useState } from "react";
import api from "../../services/api";


const StationModal=({station,onClose,onSuccess}) => {
    const isEditMode=Boolean(station);

    const [form,setForm] = useState({
        name: station?station.name:'',
        location: station?station.location:'',
    });

    const [loading,setLoading] = useState(false);
    const [error,setError] = useState('');

    const handleChange=(e) => {
        setForm({...form,[e.target.name]: e.target.value});
    };

    const handleSubmit=async(e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try{
            if(isEditMode) {
                await api.put(`/super-admin/stations/${station._id}`,form);
            }
            else{
                await api.post('/super-admin/stations',form);
            }
            onSuccess();
            onClose();
        } catch(err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'create'} station`);
        } finally{
            setLoading(false);
        }
    };

    return (
       <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            {/* Modal Content */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Station' : 'Add New Station'}
                    </h3>
                    <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-xl font-bold">&times;</button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Station Name</label>
                        <input
                            id="name"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>
                    <div>
                        <label htmlFor="location" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Location</label>
                        <input
                            id="location"
                            name="location"
                            value={form.location}
                            onChange={handleChange}
                            required
                            className="input"
                        />
                    </div>
                    
                    {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}

                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2 text-sm">
                            {loading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Station' : 'Create Station')}
                        </button>
                    </div>
                </form>
            </div>
        </div> 
    )
}

export default StationModal;