import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = () => {
  const { authUser, loading } = useAuth();
  if (loading) return null;
  return authUser && authUser.role === 'super-admin' ? <Outlet /> : <Navigate to="/" replace />;
};

export default AdminRoute;
