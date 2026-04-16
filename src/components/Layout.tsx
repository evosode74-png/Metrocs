import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, User, Shield, Home, Bot, MessageSquare, HelpCircle, Menu, X } from 'lucide-react';

export default function Layout() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [clickCount, setClickCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleTitleClick = () => {
    if (profile?.role === 'admin') {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 7) {
        setClickCount(0);
        navigate('/dev-panel');
        setIsMobileMenuOpen(false);
      }
    }
  };

  const closeMenu = () => setIsMobileMenuOpen(false);
  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 font-sans flex flex-col">
      <header className="border-b border-gray-800 bg-[#141414] relative z-50">
        <div className="px-4 md:px-6 py-4 flex justify-between items-center">
          <div 
            className="flex items-center space-x-2 cursor-pointer select-none shrink-0"
            onClick={handleTitleClick}
          >
            <Shield className="w-6 h-6 text-orange-500" />
            <h1 className="text-lg md:text-xl font-bold tracking-tight truncate">SAMP CS Corrector</h1>
          </div>
          
          {profile && (
            <>
              {/* Desktop Nav */}
              <div className="hidden md:flex items-center space-x-6">
                <nav className="flex space-x-4 text-sm font-medium">
                  <Link to="/" className={`transition-colors flex items-center gap-2 ${isActive('/') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                    <Home className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link to="/global-chat" className={`transition-colors flex items-center gap-2 ${isActive('/global-chat') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                    <MessageSquare className="w-4 h-4" /> Global Chat
                  </Link>
                  <Link to="/ask" className={`transition-colors flex items-center gap-2 ${isActive('/ask') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                    <HelpCircle className="w-4 h-4" /> Ask Admin
                  </Link>
                  <Link to="/metro" className={`transition-colors flex items-center gap-2 ${isActive('/metro') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                    <Bot className="w-4 h-4" /> Bots
                  </Link>
                  {profile.role === 'admin' && (
                    <Link to="/admin" className={`transition-colors flex items-center gap-2 ${isActive('/admin') ? 'text-orange-500' : 'text-orange-500/70 hover:text-orange-400'}`}>
                      <Shield className="w-4 h-4" /> Admin Panel
                    </Link>
                  )}
                </nav>
                <div className="h-6 w-px bg-gray-700"></div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {profile.photoURL ? (
                      <img src={profile.photoURL} alt="Avatar" className="w-8 h-8 rounded-full" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                    <span className="text-sm font-medium truncate max-w-[120px]">{profile.displayName}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full transition-colors"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <button 
                className="md:hidden p-2 text-gray-400 hover:text-white"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </>
          )}
        </div>

        {/* Mobile Nav Dropdown */}
        {profile && isMobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-[#141414] border-b border-gray-800 p-4 flex flex-col space-y-4 shadow-xl">
            <nav className="flex flex-col space-y-4 text-sm font-medium">
              <Link to="/" onClick={closeMenu} className={`transition-colors flex items-center gap-3 ${isActive('/') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                <Home className="w-5 h-5" /> Dashboard
              </Link>
              <Link to="/global-chat" onClick={closeMenu} className={`transition-colors flex items-center gap-3 ${isActive('/global-chat') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                <MessageSquare className="w-5 h-5" /> Global Chat
              </Link>
              <Link to="/ask" onClick={closeMenu} className={`transition-colors flex items-center gap-3 ${isActive('/ask') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                <HelpCircle className="w-5 h-5" /> Ask Admin
              </Link>
              <Link to="/metro" onClick={closeMenu} className={`transition-colors flex items-center gap-3 ${isActive('/metro') ? 'text-orange-500' : 'hover:text-orange-400'}`}>
                <Bot className="w-5 h-5" /> Bots
              </Link>
              {profile.role === 'admin' && (
                <Link to="/admin" onClick={closeMenu} className={`transition-colors flex items-center gap-3 ${isActive('/admin') ? 'text-orange-500' : 'text-orange-500/70 hover:text-orange-400'}`}>
                  <Shield className="w-5 h-5" /> Admin Panel
                </Link>
              )}
            </nav>
            <div className="h-px w-full bg-gray-800"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt="Avatar" className="w-10 h-10 rounded-full" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <span className="text-sm font-medium truncate max-w-[150px]">{profile.displayName}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
