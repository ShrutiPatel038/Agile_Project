import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const StationMasterRoute = () => {
  const { authUser, loading } = useAuth();
  if (loading) return null;
  const isAllowed = authUser && (authUser.role === 'station-master' || authUser.role === 'super-admin');
  return isAllowed ? <Outlet /> : <Navigate to="/" replace />;
};

export default StationMasterRoute;
