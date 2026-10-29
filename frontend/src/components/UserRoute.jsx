import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserRoute = () => {
    const { authUser, loading } = useAuth();

    // 1. If the auth state is still loading, don't render anything yet.
    //    A loading spinner could also go here.
    if (loading) {
        return null; // or <Spinner />
    }

    // 2. Once loading is false, then make the decision.
    return authUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default UserRoute;