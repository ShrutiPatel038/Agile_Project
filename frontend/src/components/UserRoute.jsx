import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const UserRoute = () => {
  const { authUser, loading } = useAuth();
  if (loading) return null;
  return authUser ? <Outlet /> : <Navigate to="/login" replace />;
};

export default UserRoute;
