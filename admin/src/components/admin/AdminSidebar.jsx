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
  const { t } = useLanguage();
  const { logout } = useAuth();

  const handleNavClick = () => {
    if (mobileOpen) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`admin-sidebar ${mobileOpen ? 'admin-sidebar--mobile-open' : ''} ${
        collapsed ? 'admin-sidebar--collapsed' : ''
      }`}
    >
      <div className="admin-sidebar__header">
        <div className="admin-sidebar__brand">
          <img
            src="/phum_yeung_logo.jpg"
            alt="Phum Yeung Restaurant"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              objectFit: 'cover',
              flexShrink: 0,
              border: '2px solid var(--color-primary)'
            }}
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

        {/* Desktop Collapse Toggle */}
        <button
          type="button"
          className="admin-sidebar__collapse-btn"
          onClick={onToggleCollapse}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Mobile Close Button */}
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
      </nav>

      <div className="admin-sidebar__footer">
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
