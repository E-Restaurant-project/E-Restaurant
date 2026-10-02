import React, { useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { AdminSidebar } from './AdminSidebar';

export const AdminLayout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading admin...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  return (
    <div className={`admin-layout ${collapsed ? 'admin-layout--collapsed' : ''}`}>
      {/* Mobile Top Header */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-mobile-header__toggle"
          onClick={() => setMobileOpen(true)}
          aria-label="Open Navigation Menu"
        >
          <Menu size={22} />
        </button>
        <div className="admin-mobile-header__brand">
          <img
            src="/phum_yeung_logo.jpg"
            alt="Phum Yeung"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              objectFit: 'cover',
              border: '1.5px solid var(--color-primary)',
              flexShrink: 0
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--color-primary-dark)', lineHeight: 1.1 }}>
              ភោជនីយដ្ឋាន ភូមិយើង
            </span>
            <span style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.5px', color: 'var(--color-secondary-dark)' }}>
              PHUM YEUNG RESTAURANT
            </span>
          </div>
        </div>
        <div style={{ width: '32px' }} />
      </header>

      {/* Backdrop overlay for mobile drawer */}
      {mobileOpen && (
        <div
          className="admin-sidebar__backdrop"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AdminSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
};
