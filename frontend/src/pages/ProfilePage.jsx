import { useAuth } from '../context/AuthContext';
import MyBookings from '../components/MyBookings';

// Full profile page (analytics, loyalty, OTP) ported in Sprint 3 commits.
const ProfilePage = () => {
  const { authUser, logout } = useAuth();

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 shadow-sm border border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{authUser?.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">{authUser?.email}</p>
          <span className="mt-2 inline-block text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 px-2 py-1 rounded-full capitalize">{authUser?.role}</span>
        </div>
        <button onClick={logout} className="text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
          Log out
        </button>
      </div>

      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">My Bookings</h2>
        <MyBookings />
      </div>
    </div>
  );
};

export default ProfilePage;
