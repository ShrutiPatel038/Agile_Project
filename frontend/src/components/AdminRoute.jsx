import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
    const { authUser, loading } = useAuth();

    if (loading) {
        return null; // Wait for the auth check to complete
    }

    // If loading is done, check for authUser and the super-admin role.
    return authUser && authUser.role === 'super-admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;