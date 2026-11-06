import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ShoppingBag, Menu as MenuIcon, X, Truck, AlertCircle, User, Utensils } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useAuth } from '../../hooks/useAuth';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Navbar = () => {
  const { t, language } = useLanguage();
  const { itemCount, isCartBouncing } = useCart();
  const { storeSettings } = useRestaurant();
  const { isCustomerLoggedIn, customerUser } = useAuth();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isKm = language === 'km';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobile = () => setMobileOpen(false);

  const announcementText = isKm
    ? (storeSettings?.announcement?.text_km || storeSettings?.announcement?.text_en)
    : (storeSettings?.announcement?.text_en || storeSettings?.announcement?.text_km);
  const isBannerActive = storeSettings?.announcement?.active !== false && Boolean(storeSettings?.announcement?.active);

  return (
    <>
      {/* Top Announcement Banner (Hidden on Print) */}
      {isBannerActive && announcementText && (
        <div
          className="no-print announcement-bar"
          style={{
            backgroundColor: 'var(--color-primary, #881337)',
            color: '#fff',
            fontSize: '0.86rem',
            fontWeight: 600,
            padding: '7px 16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            letterSpacing: '0.02em',
            boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span>📢 {announcementText}</span>
        </div>
      )}

      {/* Closed Notice if Store is Temporarily Closed */}
      {storeSettings?.isOpen === false && (
        <div
          className="no-print"
          style={{
            backgroundColor: '#d32f2f',
            color: '#fff',
            fontSize: '0.85rem',
            padding: '4px 16px',
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <AlertCircle size={14} />
          <span>{t('checkout.store_closed_warning')}</span>
        </div>
      )}

      <header className={`navbar ${isScrolled ? 'navbar--scrolled' : ''}`}>
        <div className="container navbar__container">
          {/* Brand */}
          <Link to="/" className="navbar__brand" onClick={closeMobile}>
            <img
              src="/phum_yeung_logo.jpg"
              alt="Phum Yeung"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid var(--color-primary)',
                flexShrink: 0
              }}
            />
            <div className="navbar__brand-text">
              <span className="navbar__brand-name-km">ភោជនីយដ្ឋាន ភូមិយើង</span>
              <span className="navbar__brand-name-en">Phum Yeung Restaurant</span>
            </div>
          </Link>

          {/* Desktop Navigation: Food List (Home) / Track Order / About Us / Contact */}
          <nav className="navbar__nav">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `navbar__link ${isActive || location.pathname === '/menu' ? 'navbar__link--active' : ''}`
              }
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <Utensils size={15} />
                <span>{t('nav.menu')}</span>
              </span>
            </NavLink>
            <NavLink
              to="/track-order"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Truck size={15} />
                <span>{t('nav.track_order')}</span>
              </span>
            </NavLink>
            <NavLink
              to="/about"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {t('nav.about')}
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `navbar__link ${isActive ? 'navbar__link--active' : ''}`
              }
            >
              {t('nav.contact')}
            </NavLink>
          </nav>

          {/* Actions */}
          <div className="navbar__actions">
            <LanguageSwitcher light={isScrolled} />

            {isCustomerLoggedIn ? (
              <Link
                to="/account"
                className="navbar__cart-btn"
                title={customerUser?.name || t('nav.account')}
                onClick={closeMobile}
                style={{ position: 'relative' }}
              >
                <User size={20} />
                <span style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#22c55e',
                  border: '1px solid #fff'
                }} />
              </Link>
            ) : (
              <Link
                to="/auth"
                className="navbar__cart-btn"
                title={t('nav.login')}
                onClick={closeMobile}
              >
                <User size={20} />
              </Link>
            )}

            <Link
              to="/cart"
              className={`navbar__cart-btn ${isCartBouncing ? 'navbar__cart-btn--bouncing' : ''}`}
              aria-label="Shopping Cart"
              onClick={closeMobile}
            >
              <ShoppingBag size={20} className="navbar__cart-icon" />
              {itemCount > 0 && (
                <span className="navbar__cart-badge">{itemCount}</span>
              )}
            </Link>

            <button
              type="button"
              className="navbar__mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <MenuIcon size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Backdrop */}
        {mobileOpen && (
          <div
            className="mobile-nav-backdrop"
            onClick={closeMobile}
          />
        )}

        {/* Mobile Drawer */}
        <div className={`mobile-nav ${mobileOpen ? 'mobile-nav--open' : ''}`}>
          <NavLink
            to="/"
            className={({ isActive }) =>
              `mobile-nav__link ${isActive || location.pathname === '/menu' ? 'mobile-nav__link--active' : ''}`
            }
            onClick={closeMobile}
          >
            🍲 {t('nav.menu')}
          </NavLink>
          <NavLink
            to="/track-order"
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
            onClick={closeMobile}
          >
            🛵 {t('nav.track_order')}
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
            onClick={closeMobile}
          >
            ℹ️ {t('nav.about')}
          </NavLink>
          <NavLink
            to="/contact"
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
            onClick={closeMobile}
          >
            📞 {t('nav.contact')}
          </NavLink>
          <NavLink
            to={isCustomerLoggedIn ? '/account' : '/auth'}
            className={({ isActive }) =>
              `mobile-nav__link ${isActive ? 'mobile-nav__link--active' : ''}`
            }
            onClick={closeMobile}
          >
            👤 {isCustomerLoggedIn ? (customerUser?.name || t('nav.account')) : t('nav.login')}
          </NavLink>
        </div>
      </header>
    </>
  );
};
