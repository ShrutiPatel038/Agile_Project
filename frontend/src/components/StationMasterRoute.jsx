import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StationMasterRoute = () => {
    const { authUser, loading } = useAuth();

    if (loading) {
        return null; // Wait for the auth check to complete
    }

    const isAllowed = authUser && (authUser.role === 'station-master' || authUser.role === 'super-admin');
    
    // If loading is done, check for authUser and the correct role.
    return isAllowed ? <Outlet /> : <Navigate to="/" replace />;
};

export default StationMasterRoute;