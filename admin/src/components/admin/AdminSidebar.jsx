import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Layers,
  ShoppingBag,
  Tag,
  Users,
  Settings,
  User,
  LogOut,
  ArrowLeft,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';

export const AdminSidebar = ({
  mobileOpen = false,
  onCloseMobile = () => {},
  collapsed = false,
  onToggleCollapse = () => {}
}) => {
  const { t, language, changeLanguage } = useLanguage();
  const { user, logout } = useAuth();
  const isKm = language === 'km';

  const handleNavClick = () => {
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  const getInitials = (str) => {
    if (!str) return 'A';
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return str.slice(0, 2).toUpperCase();
  };

  return (
    <aside
      className={`admin-sidebar ${mobileOpen ? 'admin-sidebar--mobile-open' : ''} ${
        collapsed ? 'admin-sidebar--collapsed' : ''
      }`}
    >
      <div className="admin-sidebar__header">
        <div
          className="admin-sidebar__brand"
          onClick={collapsed ? onToggleCollapse : undefined}
          title={collapsed ? (t('admin.expand_sidebar') || 'Click to expand') : undefined}
          style={{ cursor: collapsed ? 'pointer' : 'default' }}
        >
          <img
            src="/phum_yeung_logo.jpg"
            alt="Phum Yeung Restaurant"
            className="admin-sidebar__logo"
          />
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <h3 className="admin-sidebar__title" style={{ fontSize: '0.98rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                ភោជនីយដ្ឋាន ភូមិយើង
              </h3>
              <div className="admin-sidebar__subtitle" style={{ fontSize: '0.68rem', letterSpacing: '0.5px' }}>
                PHUM YEUNG RESTAURANT
              </div>
            </div>
          )}
        </div>

        {/* Mobile Close Button (Hidden on Desktop) */}
        <button
          type="button"
          className="admin-sidebar__close-btn"
          onClick={onCloseMobile}
          aria-label="Close navigation"
        >
          <X size={20} />
        </button>
      </div>

      <nav className="admin-sidebar__nav">
        <NavLink
          to="/admin"
          end
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_dashboard') : undefined}
        >
          <LayoutDashboard size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_dashboard')}</span>
        </NavLink>

        <NavLink
          to="/admin/menu"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_menu') : undefined}
        >
          <UtensilsCrossed size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_menu')}</span>
        </NavLink>

        <NavLink
          to="/admin/categories"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_categories') : undefined}
        >
          <Layers size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_categories')}</span>
        </NavLink>

        <NavLink
          to="/admin/orders"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_orders') : undefined}
        >
          <ShoppingBag size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_orders')}</span>
        </NavLink>

        <NavLink
          to="/admin/promos"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_promos') : undefined}
        >
          <Tag size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_promos')}</span>
        </NavLink>

        <NavLink
          to="/admin/customers"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_customers') : undefined}
        >
          <Users size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_customers')}</span>
        </NavLink>

        <NavLink
          to="/admin/settings"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? t('admin.nav_settings') : undefined}
        >
          <Settings size={18} style={{ flexShrink: 0 }} />
          <span>{t('admin.nav_settings')}</span>
        </NavLink>

        <NavLink
          to="/admin/profile"
          onClick={handleNavClick}
          className={({ isActive }) =>
            `admin-sidebar__link ${isActive ? 'admin-sidebar__link--active' : ''}`
          }
          title={collapsed ? (isKm ? 'ប្រវត្តិរូប Admin' : 'Admin Profile') : undefined}
        >
          <User size={18} style={{ flexShrink: 0 }} />
          <span>{isKm ? 'ប្រវត្តិរូប Admin' : 'Admin Profile'}</span>
        </NavLink>
      </nav>

      {/* Logged in Admin Profile Card */}
      <div style={{ padding: collapsed ? '8px 4px' : '10px 14px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Link
          to="/admin/profile"
          onClick={handleNavClick}
          title={user?.name || 'Admin Profile'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '12px',
            backgroundColor: 'rgba(255,255,255,0.06)',
            textDecoration: 'none',
            color: '#ffffff',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.12)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
        >
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e11d48, #be123c)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              color: '#ffffff',
              flexShrink: 0,
              border: '1.5px solid rgba(255,255,255,0.3)'
            }}
          >
            {getInitials(user?.name)}
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Administrator'}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.email || 'admin@phumyeung.com'}
              </div>
            </div>
          )}
        </Link>
      </div>

      <div className="admin-sidebar__footer">
        {/* Desktop Collapse / Expand Toggle Button moved here to footer */}
        <button
          type="button"
          className="admin-sidebar__link admin-sidebar__collapse-toggle"
          onClick={onToggleCollapse}
          title={collapsed ? (t('admin.expand_sidebar') || 'Expand sidebar') : (t('admin.collapse_sidebar') || 'Collapse sidebar')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} style={{ flexShrink: 0 }} /> : <ChevronLeft size={18} style={{ flexShrink: 0 }} />}
          <span>{collapsed ? (t('admin.expand_sidebar') || 'Expand') : (t('admin.collapse_sidebar') || 'Collapse sidebar')}</span>
        </button>

        {/* Language Switcher */}
        <button
          type="button"
          className="admin-sidebar__link"
          onClick={() => changeLanguage(language === 'km' ? 'en' : 'km')}
          title={language === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
          aria-label="Toggle language"
        >
          <span style={{ fontSize: '1rem', flexShrink: 0, lineHeight: 1 }}>
            {language === 'km' ? '🇰🇭' : '🇬🇧'}
          </span>
          <span>{language === 'km' ? 'ភាសាខ្មែរ (KM)' : 'English (EN)'}</span>
        </button>

        <Link
          to="/"
          onClick={handleNavClick}
          className="admin-sidebar__link"
          title={collapsed ? t('common.back_home') : undefined}
        >
          <ArrowLeft size={16} style={{ flexShrink: 0 }} />
          <span>{t('common.back_home')}</span>
        </Link>

        <button
          type="button"
          className="admin-sidebar__link"
          onClick={logout}
          style={{ color: '#ef5350' }}
          title={collapsed ? t('admin.logout') : undefined}
        >
          <LogOut size={16} style={{ flexShrink: 0 }} />
          <span>{t('admin.logout')}</span>
        </button>
      </div>
    </aside>
  );
};
