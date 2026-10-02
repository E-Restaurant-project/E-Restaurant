import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  User,
  Package,
  MapPin,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  LogOut,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const Account = () => {
  const { t, language } = useLanguage();
  const { customerUser, isCustomerLoggedIn, customerUpdateProfile, customerLogout, loading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'orders'
  const [profileForm, setProfileForm] = useState({
    name: customerUser?.name || '',
    phone: customerUser?.phone || '',
    address: customerUser?.address || ''
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isCustomerLoggedIn) {
      navigate('/auth', { replace: true });
    }
  }, [isCustomerLoggedIn, navigate]);

  useEffect(() => {
    if (customerUser) {
      setProfileForm({
        name: customerUser.name || '',
        phone: customerUser.phone || '',
        address: customerUser.address || ''
      });
    }
  }, [customerUser]);

  // Load orders when switching to orders tab
  useEffect(() => {
    const fetchOrders = async () => {
      if (activeTab !== 'orders') return;
      setOrdersLoading(true);
      const res = await apiService.getMyOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        // Fallback: check localStorage for matching customer email
        try {
          const localOrders = JSON.parse(localStorage.getItem('phum_yeung_orders') || '[]');
          const userOrders = localOrders.filter(
            (o) => o.email?.toLowerCase() === customerUser?.email?.toLowerCase() ||
                   (customerUser?.phone && o.phone === customerUser?.phone)
          );
          setOrders(userOrders);
        } catch {
          setOrders([]);
        }
      }
      setOrdersLoading(false);
    };

    fetchOrders();
  }, [activeTab, customerUser]);

  if (!isCustomerLoggedIn) {
    return null;
  }

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    const res = await customerUpdateProfile(profileForm);
    if (res.success) {
      setStatusMsg(t('account.save_profile') + ' ✓');
      setTimeout(() => setStatusMsg(''), 3000);
    } else {
      setErrorMsg(res.error || 'Failed to update profile');
    }
  };

  const handleLogout = () => {
    customerLogout();
    navigate('/');
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      case 'delivering':
      case 'preparing':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-page__header">
          <div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--color-primary-dark)', marginBottom: '4px' }}>
              {t('account.title')}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
              <span>{customerUser.name} ({customerUser.email})</span>
              {customerUser.isVerified && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '0.85rem' }}>
                  <ShieldCheck size={16} /> Verified
                </span>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={handleLogout} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <LogOut size={16} />
            <span>{t('account.logout')}</span>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="account-tabs">
          <button
            type="button"
            className={`account-tab ${activeTab === 'profile' ? 'account-tab--active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {t('account.tab_profile')}
          </button>
          <button
            type="button"
            className={`account-tab ${activeTab === 'orders' ? 'account-tab--active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <Package size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
            {t('account.tab_orders')}
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <div className="account-card" style={{ maxWidth: '640px' }}>
            <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--color-primary)' }}>
              {t('account.tab_profile')}
            </h3>

            {statusMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#dcfce7',
                color: '#15803d',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)',
                fontSize: '0.9rem'
              }}>
                <CheckCircle size={18} />
                <span>{statusMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#fee2e2',
                color: '#b91c1c',
                padding: 'var(--space-sm) var(--space-md)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-md)',
                fontSize: '0.9rem'
              }}>
                <AlertCircle size={18} />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} />
                  <span>{t('auth.full_name')}</span>
                </label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={16} />
                  <span>{t('auth.email')}</span>
                </label>
                <input
                  type="email"
                  className="form-input"
                  disabled
                  value={customerUser.email}
                  style={{ backgroundColor: 'var(--color-bg-alt)', opacity: 0.8 }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={16} />
                  <span>{t('auth.phone')}</span>
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="012 345 678"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-xl)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} />
                  <span>{t('auth.address')}</span>
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ខណ្ឌ..."
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                />
              </div>

              <Button type="submit" variant="primary" disabled={loading}>
                {loading ? t('common.loading') : t('account.save_profile')}
              </Button>
            </form>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div>
            {ordersLoading ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
                <p>{t('common.loading')}</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="account-card" style={{ textAlign: 'center', padding: 'var(--space-3xl)' }}>
                <Package size={48} style={{ color: 'var(--color-text-muted)', margin: '0 auto var(--space-md)' }} />
                <h3>{t('account.no_orders')}</h3>
                <p style={{ color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: 'var(--space-lg)' }}>
                  {t('hero.description')}
                </p>
                <Link to="/menu">
                  <Button variant="primary">{t('hero.order_btn')}</Button>
                </Link>
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <div key={order.orderId || order._id} className="account-order-card">
                    <div className="account-order-card__header">
                      <div>
                        <span style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-primary)' }}>
                          #{order.orderId}
                        </span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '12px' }}>
                          {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Badge variant={getStatusBadgeVariant(order.status)}>
                          {order.status}
                        </Badge>
                        <Link to={`/track-order?id=${order.orderId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontSize: '0.88rem', fontWeight: 600 }}>
                          <span>{t('account.track_order')}</span>
                          <ExternalLink size={14} />
                        </Link>
                      </div>
                    </div>

                    <div style={{ margin: 'var(--space-sm) 0', fontSize: '0.9rem' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {order.items?.map((item, idx) => (
                          <span key={idx} style={{ backgroundColor: 'var(--color-bg-alt)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                            {language === 'km' ? (item.nameKm || item.name) : item.name} × {item.quantity}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'var(--space-sm)', paddingTop: 'var(--space-sm)', borderTop: '1px dashed var(--color-border)' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        {order.orderType === 'pickup' ? 'Kitchen Hub Pickup' : `Delivery to ${order.deliveryDistrict || 'Phnom Penh'}`}
                      </span>
                      <div style={{ textAlign: 'right' }}>
                        <strong style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                          ${Number(order.total || 0).toFixed(2)}
                        </strong>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginLeft: '6px' }}>
                          ({(Number(order.total || 0) * 4100).toLocaleString()} ៛)
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
