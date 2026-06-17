import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import StoreOwnerDashboard from './pages/StoreOwnerDashboard';
import { LogOut, Shield, User, Store, Star } from 'lucide-react';

function AppContent() {
  const { user, logout, loading } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text-muted)' }}>
        Loading session...
      </div>
    );
  }

  // Not Logged In
  if (!user) {
    if (isRegistering) {
      return <Register navigateToLogin={() => setIsRegistering(false)} />;
    }
    return <Login navigateToRegister={() => setIsRegistering(true)} />;
  }

  // Logged In - Render Main Dashboard with Navbar
  return (
    <div className="app-container">
      {/* Premium Navbar */}
      <nav className="navbar">
        <div className="nav-brand">
          <Star size={22} fill="var(--accent-purple)" style={{ color: 'var(--accent-purple)' }} />
          <span>RateIt Platform</span>
        </div>
        <div className="nav-user">
          <div className={`user-badge ${user.role === 'admin' ? 'admin' : user.role === 'store_owner' ? 'owner' : ''}`}>
            {user.role === 'admin' && <Shield size={14} />}
            {user.role === 'user' && <User size={14} />}
            {user.role === 'store_owner' && <Store size={14} />}
            <span>{user.name.split(' ')[0]}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.7, borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '0.4rem', marginLeft: '0.2rem', textTransform: 'capitalize' }}>
              {user.role === 'store_owner' ? 'Store Owner' : user.role}
            </span>
          </div>
          <button className="btn-logout" onClick={logout}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </nav>

      {/* Main Workspace based on User Role */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {user.role === 'admin' && <AdminDashboard />}
        {user.role === 'user' && <UserDashboard />}
        {user.role === 'store_owner' && <StoreOwnerDashboard />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
