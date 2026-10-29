import { useState, useEffect } from 'react';
import api from '../../services/api';

const VehicleModal = ({ vehicle, stations, allStations, onClose, onSuccess }) => {
    const isEditMode = Boolean(vehicle);
    const stationListForDropdown = isEditMode ? allStations : stations;

    const [form, setForm] = useState({
        modelName: vehicle ? vehicle.modelName : '',
        pricePerHour: vehicle ? vehicle.pricePerHour : '',
        stationId: vehicle ? vehicle.station._id : (stations[0]?._id || ''),
    });
    
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        
        try {
            if (isEditMode) {
                if (selectedFile) {
                    const formData = new FormData();
                    formData.append('modelName', form.modelName);
                    formData.append('pricePerHour', form.pricePerHour);
                    formData.append('image', selectedFile);
                    
                    await api.put(`/super-admin/vehicles/${vehicle._id}`, formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                } else {
                    await api.put(`/super-admin/vehicles/${vehicle._id}`, {
                        modelName: form.modelName,
                        pricePerHour: form.pricePerHour,
                    });
                }
            } else {
                if (!selectedFile) {
                    setError('Please select an image file');
                    setLoading(false);
                    return;
                }
                
                const formData = new FormData();
                formData.append('modelName', form.modelName);
                formData.append('pricePerHour', form.pricePerHour);
                formData.append('stationId', form.stationId);
                formData.append('image', selectedFile);
                
                await api.post('/super-admin/vehicles', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} vehicle.`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" onClick={onClose}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                <div className="p-5 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                </div>
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Station</label>
                        {/* The station cannot be changed in edit mode */}
                        <select 
                            name="stationId" 
                            value={form.stationId} 
                            onChange={handleChange} 
                            required 
                            disabled={isEditMode} 
                            className="mt-1 w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-xl text-gray-900 dark:text-white disabled:bg-gray-100 disabled:dark:bg-gray-800 text-sm focus:ring-2 focus:ring-primary-500"
                        >
                            {stationListForDropdown && stationListForDropdown.length > 0 ? (
                                stationListForDropdown.map(s => <option key={s._id} value={s._id}>{s.name}</option>)
                            ) : (
                                <option value="" disabled>No managed stations to add to</option>
                            )}
                        </select>
                        
                        {stationListForDropdown.length === 0 && !isEditMode && (
                            <p className="text-xs text-red-500 dark:text-red-400 mt-1">You must assign a master to a station before you can add vehicles.</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Model Name</label>
                        <input name="modelName" value={form.modelName} onChange={handleChange} required className="input mt-1" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Vehicle Image</label>
                        <input 
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="mt-1 w-full p-2.5 border border-gray-300 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-white file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:bg-primary-100 dark:file:bg-primary-950/40 file:text-primary-700 dark:file:text-primary-400 file:font-semibold hover:file:bg-primary-200 focus:ring-2 focus:ring-primary-500 text-sm" 
                        />
                        {selectedFile && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Selected: {selectedFile.name}</p>
                        )}
                        {isEditMode && vehicle?.imageUrl && (
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Current image will be replaced if new file is selected</p>
                        )}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Price Per Hour (₹)</label>
                        <input name="pricePerHour" type="number" value={form.pricePerHour} onChange={handleChange} required className="input mt-1" />
                    </div>
                    {error && <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>}
                    <div className="pt-2 flex justify-end space-x-3">
                        <button type="button" onClick={onClose} className="btn btn-ghost px-4 py-2 text-sm">Cancel</button>
                        <button type="submit" disabled={loading} className="btn btn-primary px-5 py-2 text-sm">
                            {loading ? 'Saving...' : (isEditMode ? 'Update Vehicle' : 'Add Vehicle')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default VehicleModal;