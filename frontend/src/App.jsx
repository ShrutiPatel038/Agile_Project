import { Routes, Route } from 'react-router-dom';
import UserRoute from './components/UserRoute.jsx';
import AdminRoute from './components/AdminRoute.jsx';
import StationMasterRoute from './components/StationMasterRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import VehiclesPage from './pages/VehiclesPage.jsx';

// Placeholder pages — replaced as each sprint adds real implementations
const ComingSoon = ({ label }) => (
  <div className="flex h-64 items-center justify-center text-gray-500 dark:text-gray-400 text-lg">
    {label} — coming soon
  </div>
);

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<ComingSoon label="Home" />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route element={<UserRoute />}>
            <Route path="/profile" element={<ComingSoon label="Profile" />} />
            <Route path="/analytics" element={<ComingSoon label="Analytics" />} />
            <Route path="/loyalty" element={<ComingSoon label="Loyalty" />} />
            <Route path="/support" element={<ComingSoon label="Support" />} />
            <Route path="/refunds" element={<ComingSoon label="Refunds" />} />
            <Route path="/favorites" element={<ComingSoon label="Favorites" />} />
          </Route>
          <Route element={<StationMasterRoute />}>
            <Route path="/dashboard" element={<ComingSoon label="Station Master Dashboard" />} />
          </Route>
          <Route element={<AdminRoute />}>
            <Route path="/super-admin" element={<ComingSoon label="Super Admin" />} />
            <Route path="/super-admin/station/:id" element={<ComingSoon label="Station Detail" />} />
            <Route path="/super-admin/user/:id" element={<ComingSoon label="User Detail" />} />
          </Route>
          <Route path="*" element={<ComingSoon label="404 — Not Found" />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
