import React, { useState, useEffect, useMemo } from 'react';
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
  AlertCircle,
  Utensils,
  Copy,
  RotateCcw,
  Calendar,
  DollarSign,
  Award,
  Sparkles,
  Lock,
  Check,
  Search,
  Truck,
  HelpCircle,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../hooks/useCart';
import { apiService } from '../services/api';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const Account = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const { customerUser, isCustomerLoggedIn, customerUpdateProfile, customerLogout, loading } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const isKm = language === 'km';

  // Navigation tab: 'profile' | 'orders' | 'address' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: customerUser?.name || '',
    phone: customerUser?.phone || '',
    address: customerUser?.address || ''
  });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Orders Tab Filter & Search
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

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

  // Load orders
  useEffect(() => {
    const fetchOrders = async () => {
      setOrdersLoading(true);
      const res = await apiService.getMyOrders();
      if (res.success && Array.isArray(res.data)) {
        setOrders(res.data);
      } else {
        // Fallback: check localStorage for matching customer email strictly
        try {
          const localOrders = JSON.parse(localStorage.getItem('phum_yeung_orders') || '[]');
          const cleanEmail = customerUser?.email?.toLowerCase().trim();
          const userOrders = localOrders.filter(
            (o) => o.email?.toLowerCase().trim() === cleanEmail
          );
          setOrders(userOrders);
        } catch {
          setOrders([]);
        }
      }
      setOrdersLoading(false);
    };

    if (customerUser) {
      fetchOrders();
    }
  }, [customerUser]);

  if (!isCustomerLoggedIn || !customerUser) {
    return null;
  }

  // User initials avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    const clean = name.trim().replace(/\u200B/g, '');
    const parts = clean.split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // KPI Metrics Calculation
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) =>
    ['pending', 'preparing', 'delivering'].includes(o.status?.toLowerCase())
  );
  const totalSpentUsd = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const dualTotalSpent = formatDualCurrency(totalSpentUsd);

  // Update Profile Submission
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setErrorMsg('');

    const res = await customerUpdateProfile(profileForm);
    if (res.success) {
      setStatusMsg(isKm ? 'បានរក្សាទុកព័ត៌មានដោយជោគជ័យ!' : 'Profile updated successfully!');
      setTimeout(() => setStatusMsg(''), 3500);
    } else {
      setErrorMsg(res.error || (isKm ? 'មានបញ្ហាក្នុងការរក្សាទុក សូមព្យាយាមម្តងទៀត' : 'Failed to update profile'));
    }
  };

  const handleLogout = () => {
    customerLogout();
    navigate('/');
  };

  const copyOrderId = (id) => {
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleReorder = (order) => {
    if (Array.isArray(order.items) && order.items.length > 0) {
      order.items.forEach((item) => {
        addToCart(
          {
            id: item.dishId || item.id,
            name_km: item.nameKm || item.name_km || item.name,
            name_en: item.nameEn || item.name_en || item.name,
            price: Number(item.price || 0),
            image: item.image || '/images/foods/default.jpg',
            category: item.category || 'specials'
          },
          item.quantity || 1,
          item.spiceLevel || null,
          item.notes || ''
        );
      });
      navigate('/cart');
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toLowerCase();
    switch (s) {
      case 'delivered':
        return (
          <span
            style={{
              backgroundColor: '#dcfce7',
              color: '#15803d',
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <CheckCircle size={13} /> {isKm ? 'បានដឹកជញ្ជូនរួច' : 'Delivered'}
          </span>
        );
      case 'delivering':
        return (
          <span
            style={{
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Truck size={13} /> {isKm ? 'កំពុងដឹកជញ្ជូន' : 'Delivering'}
          </span>
        );
      case 'preparing':
        return (
          <span
            style={{
              backgroundColor: '#fef3c7',
              color: '#b45309',
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={13} /> {isKm ? 'កំពុងចម្អិន' : 'Preparing'}
          </span>
        );
      case 'cancelled':
        return (
          <span
            style={{
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <AlertCircle size={13} /> {isKm ? 'បានបោះបង់' : 'Cancelled'}
          </span>
        );
      default:
        return (
          <span
            style={{
              backgroundColor: '#f1f5f9',
              color: '#475569',
              padding: '3px 9px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.78rem',
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <Clock size={13} /> {isKm ? 'កំពុងរង់ចាំ' : 'Pending'}
          </span>
        );
    }
  };

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        !orderSearch ||
        order.orderId?.toLowerCase().includes(orderSearch.toLowerCase()) ||
        order.items?.some((it) =>
          (it.name || it.nameKm || it.nameEn || '')
            .toLowerCase()
            .includes(orderSearch.toLowerCase())
        );

      if (!matchSearch) return false;

      if (orderStatusFilter === 'active') {
        return ['pending', 'preparing', 'delivering'].includes(order.status?.toLowerCase());
      }
      if (orderStatusFilter === 'delivered') {
        return order.status?.toLowerCase() === 'delivered';
      }
      if (orderStatusFilter === 'cancelled') {
        return order.status?.toLowerCase() === 'cancelled';
      }
      return true;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  return (
    <div className="account-page">
      <div className="container">
        {/* =========================================================================
            Hero Profile Banner Card (Modern Executive Look)
           ========================================================================= */}
        <div className="account-hero">
          <div className="account-hero__left">
            <div className="account-avatar">
              {getInitials(customerUser.name)}
              {customerUser.isVerified && (
                <div className="account-avatar__badge" title="Verified Customer">
                  <ShieldCheck size={13} />
                </div>
              )}
            </div>

            <div className="account-hero__info">
              <h1>
                <span>{customerUser.name || (isKm ? 'អតិថិជនភូមិយើង' : 'Valued Customer')}</span>
                {customerUser.isVerified && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    <ShieldCheck size={13} /> {isKm ? 'ផ្ទៀងផ្ទាត់រួច' : 'Verified'}
                  </span>
                )}
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--color-secondary-subtle)',
                    color: 'var(--color-secondary-dark)',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid rgba(197, 155, 39, 0.3)'
                  }}
                >
                  <Award size={13} /> {isKm ? 'សមាជិកភូមិយើង VIP' : 'VIP Member'}
                </span>
              </h1>

              <div className="account-hero__meta">
                <span className="account-hero__meta-item">
                  <Mail size={14} />
                  <span>{customerUser.email}</span>
                </span>
                {customerUser.phone && (
                  <span className="account-hero__meta-item">
                    <Phone size={14} />
                    <span>{customerUser.phone}</span>
                  </span>
                )}
                {customerUser.address && (
                  <span
                    className="account-hero__meta-item"
                    style={{
                      maxWidth: '280px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    <MapPin size={14} />
                    <span>{customerUser.address}</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="account-hero__actions">
            <Link to="/menu">
              <Button variant="primary" size="sm" icon={<Utensils size={15} />}>
                {isKm ? 'កុម្ម៉ង់មុខម្ហូប' : 'Order Food'}
              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              icon={<LogOut size={15} />}
              style={{ color: 'var(--color-danger)', borderColor: 'rgba(198, 40, 40, 0.3)' }}
            >
              {isKm ? 'ចាកចេញ' : 'Log Out'}
            </Button>
          </div>
        </div>

        {/* =========================================================================
            KPI Quick Stats Row
           ========================================================================= */}
        <div className="account-stats-grid">
          {/* Stat 1: Total Orders */}
          <div className="account-stat-card">
            <div className="account-stat-icon" style={{ backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)' }}>
              <Package size={22} />
            </div>
            <div className="account-stat-info">
              <div className="stat-label">{isKm ? 'ការកុម្ម៉ង់សរុប' : 'Total Orders'}</div>
              <div className="stat-value">{totalOrders} {isKm ? 'លើក' : 'Orders'}</div>
            </div>
          </div>

          {/* Stat 2: Active Orders */}
          <div className="account-stat-card">
            <div className="account-stat-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
              <Truck size={22} />
            </div>
            <div className="account-stat-info">
              <div className="stat-label">{isKm ? 'កំពុងដឹកជញ្ជូន' : 'In Transit'}</div>
              <div className="stat-value" style={{ color: activeOrders.length > 0 ? '#0284c7' : 'inherit' }}>
                {activeOrders.length} {isKm ? 'កញ្ចប់' : 'Active'}
              </div>
            </div>
          </div>

          {/* Stat 3: Total Spent */}
          <div className="account-stat-card">
            <div className="account-stat-icon" style={{ backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary-dark)' }}>
              <DollarSign size={22} />
            </div>
            <div className="account-stat-info">
              <div className="stat-label">{isKm ? 'ចំណាយសរុប' : 'Total Spent'}</div>
              <div className="stat-value" style={{ color: 'var(--color-primary)' }}>
                {isKm ? dualTotalSpent.khr : dualTotalSpent.usd}
              </div>
            </div>
          </div>

          {/* Stat 4: Member Status */}
          <div className="account-stat-card">
            <div className="account-stat-icon" style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>
              <Award size={22} />
            </div>
            <div className="account-stat-info">
              <div className="stat-label">{isKm ? 'កម្រិតសមាជិក' : 'Membership'}</div>
              <div className="stat-value" style={{ color: '#16a34a', fontSize: '1.02rem' }}>
                {isKm ? 'VIP ភូមិយើង' : 'VIP Gold'}
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            Two-Column Layout: Sidebar Navigation + Main Content Area
           ========================================================================= */}
        <div className="account-layout">
          {/* Left Sidebar */}
          <aside className="account-sidebar">
            <div className="account-nav-card">
              <button
                type="button"
                className={`account-nav-btn ${activeTab === 'profile' ? 'account-nav-btn--active' : ''}`}
                onClick={() => setActiveTab('profile')}
              >
                <div className="account-nav-btn__left">
                  <User size={18} />
                  <span>{isKm ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Profile Details'}</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                type="button"
                className={`account-nav-btn ${activeTab === 'orders' ? 'account-nav-btn--active' : ''}`}
                onClick={() => setActiveTab('orders')}
              >
                <div className="account-nav-btn__left">
                  <Package size={18} />
                  <span>{isKm ? 'ប្រវត្តិកុម្ម៉ង់' : 'Order History'}</span>
                </div>
                {totalOrders > 0 && (
                  <span className="account-nav-counter">{totalOrders}</span>
                )}
              </button>

              <button
                type="button"
                className={`account-nav-btn ${activeTab === 'address' ? 'account-nav-btn--active' : ''}`}
                onClick={() => setActiveTab('address')}
              >
                <div className="account-nav-btn__left">
                  <MapPin size={18} />
                  <span>{isKm ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Delivery Address'}</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>

              <button
                type="button"
                className={`account-nav-btn ${activeTab === 'security' ? 'account-nav-btn--active' : ''}`}
                onClick={() => setActiveTab('security')}
              >
                <div className="account-nav-btn__left">
                  <Lock size={18} />
                  <span>{isKm ? 'សុវត្ថិភាពគណនី' : 'Account Security'}</span>
                </div>
                <ChevronRight size={16} opacity={0.6} />
              </button>
            </div>

            {/* Quick Support Card */}
            <div className="account-support-card">
              <h4>
                <HelpCircle size={16} />
                <span>{isKm ? 'ត្រូវការជំនួយ?' : 'Need Help?'}</span>
              </h4>
              <p>
                {isKm
                  ? 'ក្រុមការងារភូមិយើងរីករាយនឹងជួយលោកអ្នករៀងរាល់ម៉ោង 8:00 AM - 10:00 PM។'
                  : 'Our customer support team is available daily 8:00 AM - 10:00 PM.'}
              </p>
              <a href="tel:012345678" className="account-support-btn">
                <Phone size={14} />
                <span>012 345 678</span>
              </a>
            </div>
          </aside>

          {/* Right Main Content */}
          <main className="account-main-card">
            {/* =====================================================================
                TAB 1: Personal Profile
               ===================================================================== */}
            {activeTab === 'profile' && (
              <div>
                <div className="account-header-box">
                  <h2>
                    <User size={20} color="var(--color-primary)" />
                    <span>{isKm ? 'ព័ត៌មានផ្ទាល់ខ្លួន' : 'Personal Information'}</span>
                  </h2>
                  <p>
                    {isKm
                      ? 'គ្រប់គ្រងព័ត៌មានគណនី និងទំនាក់ទំនងរបស់អ្នកសម្រាប់ការដឹកជញ្ជូនរហ័សទាន់ចិត្ត។'
                      : 'Manage your profile details and contact information for faster checkout and delivery.'}
                  </p>
                </div>

                {statusMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#dcfce7',
                      color: '#15803d',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-lg)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <CheckCircle size={18} />
                    <span>{statusMsg}</span>
                  </div>
                )}

                {errorMsg && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      backgroundColor: '#fee2e2',
                      color: '#b91c1c',
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: 'var(--space-lg)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}
                  >
                    <AlertCircle size={18} />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <form onSubmit={handleUpdateProfile}>
                  <div className="account-form-grid">
                    {/* Full Name */}
                    <div className="account-input-wrap">
                      <label>
                        <User size={15} color="var(--color-primary)" />
                        <span>{isKm ? 'ឈ្មោះពេញ' : 'Full Name'} *</span>
                      </label>
                      <div className="account-input-field">
                        <input
                          type="text"
                          required
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder={isKm ? 'ឈ្មោះរបស់អ្នក...' : 'Your full name...'}
                        />
                      </div>
                      <span className="account-input-helper">
                        {isKm ? 'ឈ្មោះដែលបង្ហាញលើវិក្កយបត្រ' : 'Display name for receipts and delivery'}
                      </span>
                    </div>

                    {/* Email (Read-only) */}
                    <div className="account-input-wrap">
                      <label>
                        <Mail size={15} color="var(--color-primary)" />
                        <span>{isKm ? 'អាសយដ្ឋានអ៊ីមែល' : 'Email Address'}</span>
                      </label>
                      <div className="account-input-field account-input-field--disabled">
                        <input type="email" disabled value={customerUser.email} />
                        <span
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#e2e8f0',
                            color: '#475569',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isKm ? 'ចម្បង' : 'Primary'}
                        </span>
                      </div>
                      <span className="account-input-helper">
                        {isKm ? 'អ៊ីមែលសម្រាប់សុវត្ថិភាព និងទទួលវិក្កយបត្រ' : 'Account identifier for security & receipts'}
                      </span>
                    </div>

                    {/* Phone Number */}
                    <div className="account-input-wrap">
                      <label>
                        <Phone size={15} color="var(--color-primary)" />
                        <span>{isKm ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</span>
                      </label>
                      <div className="account-input-field">
                        <input
                          type="tel"
                          placeholder="012 345 678"
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>
                      <span className="account-input-helper">
                        {isKm ? 'លេខសម្រាប់អ្នកដឹកជញ្ជូនទាក់ទង' : 'Contact number for courier delivery'}
                      </span>
                    </div>

                    {/* Primary Address */}
                    <div className="account-input-wrap" style={{ gridColumn: 'span 2' }}>
                      <label>
                        <MapPin size={15} color="var(--color-primary)" />
                        <span>{isKm ? 'អាសយដ្ឋានដឹកជញ្ជូនចម្បង' : 'Default Delivery Address'}</span>
                      </label>
                      <div className="account-input-field">
                        <textarea
                          rows={3}
                          placeholder={
                            isKm
                              ? 'ផ្ទះលេខ, ផ្លូវ, សង្កាត់, ខណ្ឌ, រាជធានីភ្នំពេញ (ចំណាំទីតាំង)...'
                              : 'House No, Street, Sangkat, Khan, Phnom Penh (Landmark)...'
                          }
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        />
                      </div>
                      <span className="account-input-helper">
                        {isKm
                          ? 'អាសយដ្ឋាននេះនឹងត្រូវបានបំពេញដោយស្វ័យប្រវត្តិនៅពេលកុម្ម៉ង់'
                          : 'This will auto-fill your checkout address for easy ordering'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: 'var(--space-md)' }}>
                    <Button type="submit" variant="primary" disabled={loading} icon={<Check size={16} />}>
                      {loading ? (isKm ? 'កំពុងរក្សាទុក...' : 'Saving...') : (isKm ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* =====================================================================
                TAB 2: Order History
               ===================================================================== */}
            {activeTab === 'orders' && (
              <div>
                <div className="account-header-box">
                  <h2>
                    <Package size={20} color="var(--color-primary)" />
                    <span>{isKm ? 'ប្រវត្តិការកុម្ម៉ង់របស់ខ្ញុំ' : 'My Order History'}</span>
                  </h2>
                  <p>
                    {isKm
                      ? 'តាមដានស្ថានភាពកុម្ម៉ង់ និងពិនិត្យមើលបញ្ជីមុខម្ហូបដែលអ្នកធ្លាប់បានកុម្ម៉ង់កន្លងមក។'
                      : 'Track live order status and review past culinary dishes you enjoyed with us.'}
                  </p>
                </div>

                {/* Filter & Search Bar */}
                {orders.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px',
                      marginBottom: 'var(--space-lg)'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      {[
                        { id: 'all', label: isKm ? 'ទាំងអស់' : 'All' },
                        { id: 'active', label: isKm ? 'កំពុងដំណើរការ' : 'In Progress' },
                        { id: 'delivered', label: isKm ? 'ដឹកជញ្ជូនរួច' : 'Delivered' },
                        { id: 'cancelled', label: isKm ? 'បានបោះបង់' : 'Cancelled' }
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setOrderStatusFilter(tab.id)}
                          style={{
                            padding: '6px 14px',
                            borderRadius: 'var(--radius-full)',
                            fontSize: '0.84rem',
                            fontWeight: 600,
                            border: '1px solid',
                            borderColor: orderStatusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-border)',
                            backgroundColor: orderStatusFilter === tab.id ? 'var(--color-primary)' : '#ffffff',
                            color: orderStatusFilter === tab.id ? '#ffffff' : 'var(--color-text-main)',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    <div style={{ position: 'relative', minWidth: '220px' }}>
                      <Search
                        size={15}
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#94a3b8'
                        }}
                      />
                      <input
                        type="text"
                        placeholder={isKm ? 'ស្វែងរកលេខកូដកុម្ម៉ង់...' : 'Search by order #...'}
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 12px 7px 32px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          fontSize: '0.86rem',
                          outline: 'none',
                          backgroundColor: '#ffffff'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Orders Content */}
                {ordersLoading ? (
                  <div className="account-empty-box">
                    <Clock size={40} className="spinning" style={{ color: 'var(--color-primary)', margin: '0 auto 12px' }} />
                    <p style={{ color: 'var(--color-text-muted)' }}>
                      {isKm ? 'កំពុងទាញយកទិន្នន័យ...' : 'Loading order history...'}
                    </p>
                  </div>
                ) : filteredOrders.length === 0 ? (
                  <div className="account-empty-box">
                    <div className="account-empty-icon">
                      <Package size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.15rem', color: 'var(--color-text-main)', marginBottom: '6px' }}>
                      {orders.length === 0
                        ? (isKm ? 'លោកអ្នកមិនទាន់មានប្រវត្តិការកុម្ម៉ង់នៅឡើយទេ' : 'No orders placed yet')
                        : (isKm ? 'មិនមានការកុម្ម៉ង់ដែលត្រូវនឹងការស្វែងរកឡើយ' : 'No orders matched your filter')}
                    </h3>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem', maxWidth: '420px', margin: '0 auto 20px' }}>
                      {orders.length === 0
                        ? (isKm
                            ? 'សូមរីករាយជ្រើសរើសមុខម្ហូបខ្មែរឆ្ងាញ់ៗប្រចាំហាងភូមិយើង ជាមួយសេវាកម្មដឹកជញ្ជូនរហ័សទាន់ចិត្ត!'
                            : 'Explore our authentic Cambodian culinary delights and enjoy fast, warm delivery straight to your doorstep.')
                        : (isKm ? 'សូមព្យាយាមស្វែងរកជាមួយពាក្យគន្លឹះផ្សេងទៀត។' : 'Try searching with a different term or clear filters.')}
                    </p>
                    <Link to="/menu">
                      <Button variant="primary" icon={<Utensils size={15} />}>
                        {isKm ? 'កុម្ម៉ង់ម្ហូបឥឡូវនេះ' : 'Explore Menu'}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div>
                    {filteredOrders.map((order) => {
                      const orderId = order.orderId || order.id || order._id;
                      const orderDate = new Date(order.createdAt || Date.now());
                      const totalKhr = Math.round((Number(order.total) || 0) * 4100);

                      return (
                        <div key={orderId} className="account-order-card-v2">
                          {/* Top Row: ID, Date, Status */}
                          <div className="account-order-top">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: 'var(--color-primary)' }}>
                                #{orderId}
                              </span>
                              <button
                                type="button"
                                onClick={() => copyOrderId(orderId)}
                                title="Copy Order ID"
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: copiedId === orderId ? '#16a34a' : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  padding: '2px'
                                }}
                              >
                                {copiedId === orderId ? <Check size={14} /> : <Copy size={14} />}
                              </button>
                              <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '6px' }}>
                                <Calendar size={13} />
                                {orderDate.toLocaleDateString()} {orderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              {getStatusBadge(order.status)}
                            </div>
                          </div>

                          {/* Items Chips List */}
                          <div className="account-order-chips">
                            {order.items?.map((item, idx) => (
                              <span key={idx} className="account-order-chip">
                                <strong>{isKm ? (item.nameKm || item.name) : (item.nameEn || item.name)}</strong>
                                <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>×{item.quantity}</span>
                                {item.spiceLevel && item.spiceLevel !== 'none' && (
                                  <span style={{ fontSize: '0.74rem', color: '#dc2626' }}>🌶️</span>
                                )}
                              </span>
                            ))}
                          </div>

                          {/* Bottom Row: Delivery note, Total Price, Actions */}
                          <div className="account-order-bottom">
                            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <MapPin size={14} color="var(--color-primary)" />
                              <span>
                                {order.orderType === 'pickup'
                                  ? (isKm ? 'មកយកផ្ទាល់នៅផ្ទះបាយកណ្តាល' : 'Kitchen Hub Pickup')
                                  : (isKm ? `ដឹកជញ្ជូនទៅកាន់៖ ${order.deliveryDistrict || order.address || 'រាជធានីភ្នំពេញ'}` : `Delivery to: ${order.deliveryDistrict || order.address || 'Phnom Penh'}`)}
                              </span>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <span className="account-order-total">
                                  {formatCurrency(order.total)}
                                </span>
                                <span className="account-order-total-khr">
                                  ({totalKhr.toLocaleString()} ៛)
                                </span>
                              </div>

                              <Link to={`/track-order?id=${orderId}`}>
                                <Button variant="outline" size="sm" icon={<ExternalLink size={13} />}>
                                  {isKm ? 'តាមដាន' : 'Track'}
                                </Button>
                              </Link>

                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleReorder(order)}
                                icon={<RotateCcw size={13} />}
                                style={{ color: 'var(--color-primary)', fontSize: '0.82rem' }}
                              >
                                {isKm ? 'កុម្ម៉ង់ម្តងទៀត' : 'Reorder'}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* =====================================================================
                TAB 3: Saved Delivery Address
               ===================================================================== */}
            {activeTab === 'address' && (
              <div>
                <div className="account-header-box">
                  <h2>
                    <MapPin size={20} color="var(--color-primary)" />
                    <span>{isKm ? 'អាសយដ្ឋានដឹកជញ្ជូន' : 'Saved Delivery Address'}</span>
                  </h2>
                  <p>
                    {isKm
                      ? 'អាសយដ្ឋានដឹកជញ្ជូនដែលបានកំណត់ទុក សម្រាប់ការកុម្ម៉ង់មុខម្ហូបបានលឿនរហ័ស។'
                      : 'Primary delivery address used to deliver hot and fresh meals directly to you.'}
                  </p>
                </div>

                <div
                  style={{
                    backgroundColor: 'var(--color-bg-subtle)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-xl)',
                    marginBottom: 'var(--space-lg)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: 'var(--color-primary-subtle)',
                        color: 'var(--color-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <MapPin size={24} />
                    </div>

                    <div style={{ flexGrow: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--color-text-main)' }}>
                          {isKm ? 'ទីតាំងដឹកជញ្ជូនចម្បង' : 'Primary Delivery Location'}
                        </strong>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            backgroundColor: '#dcfce7',
                            color: '#15803d',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 'var(--radius-full)'
                          }}
                        >
                          {isKm ? 'បានកំណត់' : 'Active'}
                        </span>
                      </div>

                      <p style={{ fontSize: '0.94rem', color: 'var(--color-text-main)', lineHeight: 1.6, marginBottom: '10px' }}>
                        {profileForm.address || (
                          <em style={{ color: 'var(--color-text-light)' }}>
                            {isKm
                              ? 'មិនទាន់បានបញ្ចូលអាសយដ្ឋាននៅឡើយទេ សូមចុចប៊ូតុងខាងក្រោមដើម្បីកំណត់។'
                              : 'No address saved yet. Please set your address for quicker checkout.'}
                          </em>
                        )}
                      </p>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Compass size={14} color="var(--color-secondary)" />
                          <span>{isKm ? 'សេវាកម្មដឹកជញ្ជូនភ្នំពេញ (៣០-៤៥ នាទី)' : 'Phnom Penh Delivery Coverage (30-45 mins)'}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => setActiveTab('profile')}
                  icon={<User size={15} />}
                >
                  {isKm ? 'កែប្រែអាសយដ្ឋានក្នុងព័ត៌មានគណនី' : 'Edit in Profile Settings'}
                </Button>
              </div>
            )}

            {/* =====================================================================
                TAB 4: Account Security
               ===================================================================== */}
            {activeTab === 'security' && (
              <div>
                <div className="account-header-box">
                  <h2>
                    <Lock size={20} color="var(--color-primary)" />
                    <span>{isKm ? 'សុវត្ថិភាព និងការការពារគណនី' : 'Account Security & Privacy'}</span>
                  </h2>
                  <p>
                    {isKm
                      ? 'ពិនិត្យមើលស្ថានភាពសុវត្ថិភាពគណនី និងការផ្ទៀងផ្ទាត់ OTP របស់អ្នក។'
                      : 'Overview of account protection, verification status, and login session.'}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                  {/* Security Item 1: Email Verification */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-lg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: '#dcfce7',
                          color: '#16a34a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <ShieldCheck size={22} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                          {isKm ? 'ការផ្ទៀងផ្ទាត់អ៊ីមែល (Email OTP)' : 'Email OTP Verification'}
                        </strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          {customerUser.email}
                        </div>
                      </div>
                    </div>

                    <span
                      style={{
                        backgroundColor: '#dcfce7',
                        color: '#15803d',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)'
                      }}
                    >
                      ✓ {isKm ? 'បានផ្ទៀងផ្ទាត់' : 'Verified'}
                    </span>
                  </div>

                  {/* Security Item 2: Session & Logout */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 'var(--space-lg)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-lg)',
                      backgroundColor: '#ffffff'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--color-primary-subtle)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <LogOut size={20} />
                      </div>
                      <div>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-text-main)' }}>
                          {isKm ? 'សម័យប្រជុំគណនី (Active Session)' : 'Active Login Session'}
                        </strong>
                        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                          {isKm ? 'កំពុងដំណើរការលើកម្មវិធីរុករកនេះ' : 'Currently signed in on this device'}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleLogout}
                      icon={<LogOut size={14} />}
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(198, 40, 40, 0.3)' }}
                    >
                      {isKm ? 'ចាកចេញពីគណនី' : 'Sign Out'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
