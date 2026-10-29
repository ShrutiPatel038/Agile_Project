import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import UserRoute from './components/UserRoute.jsx';
import PushNotifications from './components/PushNotifications.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import AnalyticsDashboard from './pages/AnalyticsDashboard.jsx';
import StationMasterDashboard from './pages/StationMasterDashboard.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import SuperAdminDashboard from './pages/SuperAdminDashboard.jsx';
import StationDetailPage from './pages/StationDetailPage.jsx';
import StationMasterRoute from './components/StationMasterRoute.jsx';
import UserDetailPage from './components/super-admin/UserDetailPage.jsx';
import LoyaltyPage from './pages/LoyaltyPage.jsx';
import SupportPage from './pages/SupportPage.jsx';
import RefundPage from './pages/RefundPage.jsx';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <Navbar />
      <PushNotifications />
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route element={<UserRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="/analytics" element={<AnalyticsDashboard />} />
            <Route path="/loyalty" element={<LoyaltyPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/refunds" element={<RefundPage />} />
          </Route>
          <Route element={<StationMasterRoute />}>
            <Route path="/dashboard" element={<StationMasterDashboard />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/super-admin" element={<SuperAdminDashboard />} />
            <Route path="/super-admin/station/:id" element={<StationDetailPage />} />
            <Route path="/super-admin/user/:id" element={<UserDetailPage />} />
          </Route>
          <Route path="*" element={<h1>404 - Not Found</h1>} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
