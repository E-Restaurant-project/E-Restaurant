import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Heart, Truck, Utensils } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export const Footer = () => {
  const { t } = useLanguage();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          {/* Brand & Story */}
          <div className="footer__col">
            <div className="navbar__brand" style={{ marginBottom: '12px' }}>
              <img
                src="/phum_yeung_logo.jpg"
                alt="Phum Yeung"
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid rgba(255,255,255,0.5)',
                  flexShrink: 0
                }}
              />
              <div className="navbar__brand-text">
                <span className="navbar__brand-name-km" style={{ color: '#fff' }}>ភោជនីយដ្ឋាន ភូមិយើង</span>
                <span className="navbar__brand-name-en" style={{ color: 'var(--color-secondary-light)' }}>Phum Yeung Restaurant</span>
              </div>
            </div>
            <p className="footer__desc">{t('footer.desc')}</p>
          </div>

          {/* Quick Links */}
          <div className="footer__col">
            <h4 className="footer__title">{t('footer.quick_links')}</h4>
            <ul className="footer__links">
              <li><Link to="/">{t('nav.menu')}</Link></li>
              <li><Link to="/track-order">{t('nav.track_order')}</Link></li>
              <li><Link to="/about">{t('nav.about')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          {/* Opening Hours */}
          <div className="footer__col">
            <h4 className="footer__title">{t('footer.hours_title')}</h4>
            <ul className="footer__hours-list">
              <li>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                  <Clock size={16} color="var(--color-secondary-light)" />
                  <span>{t('about.hours_weekdays')}</span>
                </div>
              </li>
              <li>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff' }}>
                  <Clock size={16} color="var(--color-secondary-light)" />
                  <span>{t('about.hours_weekends')}</span>
                </div>
              </li>
              <li style={{ marginTop: '8px', color: 'var(--color-secondary-light)', fontSize: '0.85rem' }}>
                🚀 Express delivery within 20 - 35 mins
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer__col">
            <h4 className="footer__title">{t('footer.contact_title')}</h4>
            <ul className="footer__contact-list">
              <li style={{ display: 'flex', gap: '8px' }}>
                <MapPin size={18} color="var(--color-secondary-light)" style={{ flexShrink: 0 }} />
                <span>{t('about.address_text')}</span>
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Phone size={18} color="var(--color-secondary-light)" />
                <span>023 999 888 / 012 345 678</span>
              </li>
              <li style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Mail size={18} color="var(--color-secondary-light)" />
                <span>delivery@phumyeung.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer__bottom">
          <p>© {new Date().getFullYear()} {t('footer.rights')}</p>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Cloud Kitchen Crafted with</span>
            <Heart size={14} color="var(--color-secondary-light)" fill="var(--color-secondary-light)" />
            <span>for Cambodian Food Lovers</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
