import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SubmitStory from './pages/SubmitStory';
import GenerateStory from './pages/GenerateStory';
import AdminDashboard from './pages/AdminDashboard';
import MetroBot from './pages/MetroBot';
import GlobalChat from './pages/GlobalChat';
import AskAdmin from './pages/AskAdmin';
import DevPanel from './pages/DevPanel';
import AIProPanel from './pages/AIProPanel';

function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { user, profile, loading } = useAuth();
  const [isTakingTooLong, setIsTakingTooLong] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (loading) {
      timeout = setTimeout(() => setIsTakingTooLong(true), 2500); // 2.5 seconds
    }
    return () => clearTimeout(timeout);
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white bg-[#0a0a0a]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-gray-400">Loading...</p>
        {isTakingTooLong && (
          <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-gray-800 text-orange-500 rounded-lg hover:bg-gray-700 text-sm">
            Refresh Halaman (Bila macet)
          </button>
        )}
      </div>
    );
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
  React.useEffect(() => {
    document.title = "Correct CS - SAMP Roleplay";
  }, []);

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
            <Route path="generate" element={
              <ProtectedRoute>
                <GenerateStory />
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
            <Route path="pro-panel" element={
              <ProtectedRoute>
                <AIProPanel />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
