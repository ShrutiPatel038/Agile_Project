import { Link, useParams } from "react-router-dom";
import api from "../services/api";
import { useEffect, useState } from "react";


const StatCard = ({ title, value, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow`}>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
        <p className={`mt-1 text-3xl font-semibold ${color}`}>{value}</p>
    </div>
);

const StationDetailPage=()=> {
    const {id}=useParams();
    const [stationData,setStationData]=useState(null);
    const [loading,setLoading]=useState(true);
    const [error,setError]=useState('');

    const fetchData=async()=>{
        setLoading(true);
        try{
            const {data}=await api.get(`/super-admin/stations/${id}`);
            setStationData(data);
        } catch(err) {
            setError('Failed to load station details');
        } finally{
            setLoading(false);
        }
    };

    useEffect(()=>{
        fetchData();
    },[id]);  //Re-fetch if the ID in the URL changes

    const handleRemoveVehicle=async(vehicleId)=>{
        if(!window.confirm('Are you sure you want to remove this vehicle permanently?'))
            return;
        try{
            await api.delete(`/super-admin/vehicles/${vehicleId}`);
            alert('Vehicle removed.');
            fetchData();  //Refresh the page data
        } catch(error){
            alert('Failed to remove vehicle');
        }
    };

    if(loading) return <div className="text-gray-600 dark:text-gray-400">Loading Station Details...</div>;
    if(error) return <div className="text-red-500 dark:text-red-400">{error}</div>;
    if(!stationData) return <div className="text-gray-600 dark:text-gray-400">Station not found.</div>;

    const {station,stats,vehicles,bookings}=stationData;

    return (
        <div className="space-y-8">
            <div>
                <Link to="/super-admin" className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline">&larr; Back to Dashboard</Link>
                <h1 className="text-4xl font-bold text-gray-800 dark:text-white">{station.name}</h1>
                <p className="text-lg text-gray-500 dark:text-gray-400">{station.location}</p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <StatCard title="Station Master" value={stats.stationMaster?.name || 'Unassigned'} color="text-blue-600" />
                <StatCard title="Vehicles (Available/Total)" value={`${stats.availableVehicles} / ${stats.totalVehicles}`} color="text-green-600" />
                <StatCard title="Active Rides" value={stats.activeRides} color="text-orange-600" />
                <StatCard title="Total Revenue" value={`₹${stats.totalRevenue}`} color="text-purple-600" />
            </div>

            {/* Vehicle Management Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Vehicles at this Station</h3>
                {vehicles.length > 0 ? (
                    <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Model</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Status</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Price</th>
                                <th className="p-2 text-right text-gray-500 dark:text-gray-300 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {vehicles.map(v => (
                                <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-2 font-medium text-gray-900 dark:text-white">{v.modelName}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">{v.status}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">₹{v.pricePerHour}/hr</td>
                                    <td className="p-2 text-right">
                                        <button onClick={() => handleRemoveVehicle(v._id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 font-medium">Remove</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 dark:text-gray-400">No vehicles assigned to this station.</p>}
                 {/* An "Add Vehicle to this Station" button/form could go here */}
            </div>

            {/* Booking History Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Booking History for this Station</h3>
                {bookings.length > 0 ? (
                     <table className="min-w-full text-sm divide-y divide-gray-200 dark:divide-gray-600">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Customer</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Vehicle</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Duration</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Cost</th>
                                <th className="p-2 text-left text-gray-500 dark:text-gray-300 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {bookings.map(b => (
                                <tr key={b._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="p-2 text-gray-900 dark:text-white">{b.user?.name || 'N/A'}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">{b.vehicle?.modelName || 'N/A'}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">{new Date(b.startTime).toLocaleString()}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">₹{b.totalCost}</td>
                                    <td className="p-2 text-gray-600 dark:text-gray-300">{b.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : <p className="text-gray-500 dark:text-gray-400">No bookings for this station yet.</p>}
            </div>
        </div>
    )
}

export default StationDetailPage;