import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { getMe } from './api/auth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import HomePage from './pages/HomePage';
import ExplorePage from './pages/ExplorePage';
import ReelsPage from './pages/ReelsPage';
import MessagesPage from './pages/MessagesPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import Spinner from './components/common/Spinner';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

function RequireGuest({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AuthLoader({ children }: { children: React.ReactNode }) {
  const { token, user, setAuth, logout } = useAuthStore();
  const [loading, setLoading] = useState(!!token && !user);

  useEffect(() => {
    if (token && !user) {
      getMe()
        .then(u => setAuth(u, token))
        .catch(logout)
        .finally(() => setLoading(false));
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <svg viewBox="0 0 48 48" className="w-16 h-16" fill="none">
            <defs>
              <linearGradient id="ig-load-grad" x1="0" y1="48" x2="48" y2="0" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#f09433" />
                <stop offset="50%" stopColor="#dc2743" />
                <stop offset="100%" stopColor="#bc1888" />
              </linearGradient>
            </defs>
            <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#ig-load-grad)" />
            <rect x="6" y="6" width="36" height="36" rx="9" fill="none" stroke="white" strokeWidth="2.5" />
            <circle cx="24" cy="24" r="9" fill="none" stroke="white" strokeWidth="2.5" />
            <circle cx="34.5" cy="13.5" r="2.5" fill="white" />
          </svg>
          <Spinner />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

export default function App() {
  return (
    <AuthLoader>
      <Routes>
        <Route path="/login" element={<RequireGuest><LoginPage /></RequireGuest>} />
        <Route path="/register" element={<RequireGuest><RegisterPage /></RequireGuest>} />
        <Route path="/" element={<ProtectedLayout><HomePage /></ProtectedLayout>} />
        <Route path="/explore" element={<ProtectedLayout><ExplorePage /></ProtectedLayout>} />
        <Route path="/reels" element={<ProtectedLayout><ReelsPage /></ProtectedLayout>} />
        <Route path="/messages" element={<ProtectedLayout><MessagesPage /></ProtectedLayout>} />
        <Route path="/notifications" element={<ProtectedLayout><NotificationsPage /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><SettingsPage /></ProtectedLayout>} />
        <Route path="/:username" element={<ProtectedLayout><ProfilePage /></ProtectedLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthLoader>
  );
}
