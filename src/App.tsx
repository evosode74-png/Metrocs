import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitStory from './pages/SubmitStory';
import AdminDashboard from './pages/AdminDashboard';
import MetroBot from './pages/MetroBot';
import GlobalChat from './pages/GlobalChat';
import AskAdmin from './pages/AskAdmin';
import DevPanel from './pages/DevPanel';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && profile?.role !== 'admin') {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Layout />}>
            <Route index element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="submit" element={
              <ProtectedRoute>
                <SubmitStory />
              </ProtectedRoute>
            } />
            <Route path="metro" element={
              <ProtectedRoute>
                <MetroBot />
              </ProtectedRoute>
            } />
            <Route path="global-chat" element={
              <ProtectedRoute>
                <GlobalChat />
              </ProtectedRoute>
            } />
            <Route path="ask" element={
              <ProtectedRoute>
                <AskAdmin />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="dev-panel" element={
              <ProtectedRoute requireAdmin={true}>
                <DevPanel />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
