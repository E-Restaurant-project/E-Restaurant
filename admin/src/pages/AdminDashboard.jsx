import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  ArrowRight,
  Printer,
  Plus,
  PieChart,
  Calendar,
  Filter,
  Save,
  Power,
  Settings
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { printOrdersReport } from '../utils/printReport';
import { PrintReportModal } from '../components/admin/PrintReportModal';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { getImageUrl } from '../config/api';

export const AdminDashboard = () => {
  const { t, language, formatCurrency } = useLanguage();
  const { stats, orders, dishes, storeSettings, updateStoreSettings } = useRestaurant();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isPrintModalOpen, setIsPrintModalOpen] = React.useState(false);
  const [dashboardPeriod, setDashboardPeriod] = React.useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month'
  const isKm = language === 'km';

  const [isSavingSettings, setIsSavingSettings] = React.useState(false);
  const [quickSettings, setQuickSettings] = React.useState({
    isOpen: storeSettings?.isOpen ?? true,
    standardDeliveryFee: storeSettings?.standardDeliveryFee ?? 1.5,
    freeDeliveryThreshold: storeSettings?.freeDeliveryThreshold ?? 25,
    khrRate: storeSettings?.khrRate ?? 4100
  });

  React.useEffect(() => {
    if (storeSettings) {
      setQuickSettings({
        isOpen: storeSettings.isOpen ?? true,
        standardDeliveryFee: storeSettings.standardDeliveryFee ?? 1.5,
        freeDeliveryThreshold: storeSettings.freeDeliveryThreshold ?? 25,
        khrRate: storeSettings.khrRate ?? 4100
      });
    }
  }, [storeSettings]);

  const handleToggleStoreOpen = async (isOpen) => {
    try {
      setQuickSettings((prev) => ({ ...prev, isOpen }));
      await updateStoreSettings({
        ...storeSettings,
        isOpen
      });
      showToast(
        isOpen
          ? (isKm ? 'បានបើកទទួលការកុម្ម៉ង់ (Store Open)' : 'Store is now Open for orders')
          : (isKm ? 'បានបិទទទួលការកុម្ម៉ង់ (Store Closed)' : 'Store is now Closed for orders'),
        isOpen ? 'success' : 'warning'
      );
    } catch (_) {
      showToast(isKm ? 'បរាជ័យក្នុងការផ្លាស់ប្តូរស្ថានភាព' : 'Failed to update store status', 'error');
    }
  };

  const handleSaveQuickLogistics = async (e) => {
    if (e) e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateStoreSettings({
        ...storeSettings,
        isOpen: quickSettings.isOpen,
        khrRate: Number(quickSettings.khrRate) || 4100
      });
      showToast(isKm ? 'បានរក្សាទុកអត្រាប្តូរប្រាក់ជោគជ័យ' : 'Exchange rate saved successfully', 'success');
    } catch (_) {
      showToast(isKm ? 'បរាជ័យក្នុងការរក្សាទុក' : 'Failed to save settings', 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const periodOptions = [
    { id: 'all', label: isKm ? 'គ្រប់ពេល' : 'All Time' },
    { id: 'today', label: isKm ? 'ថ្ងៃនេះ' : 'Today' },
    { id: 'yesterday', label: isKm ? 'ម្សិលមិញ' : 'Yesterday' },
    { id: 'week', label: isKm ? '៧ ថ្ងៃ' : '7 Days' },
    { id: 'month', label: isKm ? 'ខែនេះ' : 'This Month' }
  ];

  // Dynamic filtered orders for dashboard based on selected period
  const periodOrders = React.useMemo(() => {
    if (dashboardPeriod === 'all') return orders;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    let start = null;
    let end = endOfToday;

    if (dashboardPeriod === 'today') {
      start = startOfToday;
    } else if (dashboardPeriod === 'yesterday') {
      const yStart = new Date(startOfToday);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(endOfToday);
      yEnd.setDate(yEnd.getDate() - 1);
      start = yStart;
      end = yEnd;
    } else if (dashboardPeriod === 'week') {
      const wStart = new Date(startOfToday);
      wStart.setDate(wStart.getDate() - 7);
      start = wStart;
    } else if (dashboardPeriod === 'month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
    }

    return orders.filter((o) => {
      const t = new Date(o.created_at || o.createdAt || Date.now()).getTime();
      return (!start || t >= start.getTime()) && (!end || t <= end.getTime());
    });
  }, [orders, dashboardPeriod]);

  const periodRevenue = React.useMemo(() => {
    return periodOrders
      .filter((o) => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (Number(o.total_usd || o.total) || 0), 0);
  }, [periodOrders]);

  const recentOrders = periodOrders.slice(0, 5);
  const popularDishes = dishes.slice(0, 4);

  // Sales by category calculation
  const categorySales = React.useMemo(() => {
    const map = {};
    periodOrders.forEach((o) => {
      o.items?.forEach((it) => {
        const dish = dishes.find((d) => d.id === it.dishId);
        const cat = dish?.category || 'Other';
        map[cat] = (map[cat] || 0) + it.price * it.quantity;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [periodOrders, dishes]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('admin.status_completed')}</Badge>;
      case 'delivering':
        return <Badge variant="info">{t('admin.status_delivering')}</Badge>;
      case 'preparing':
        return <Badge variant="warning">{t('admin.status_preparing')}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{t('admin.status_cancelled')}</Badge>;
      default:
        return <Badge variant="gold">{t('admin.status_pending')}</Badge>;
    }
  };

  return (
    <div>
      {/* Top Header with Visible Filter Controls */}
      <div className="admin-topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="admin-topbar__title">{t('admin.nav_dashboard')}</h1>
          <p style={{ margin: '2px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isKm ? 'ទិដ្ឋភាពទូទៅនៃប្រតិបត្តិការ និងការលក់របស់ភោជនីយដ្ឋាន' : 'Overview of restaurant operations and sales'}
          </p>
        </div>

        {/* Visible Filter Toolbar & Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Visible Period Filter Buttons on Screen */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '3px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            {periodOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setDashboardPeriod(opt.id)}
                style={{
                  padding: '6px 11px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: dashboardPeriod === opt.id ? '#881337' : 'transparent',
                  color: dashboardPeriod === opt.id ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease'
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Filter & Print Report Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            icon={<Printer size={16} />}
            style={{ fontWeight: 700 }}
          >
            {isKm ? '🖨️ តម្រង & បោះពុម្ព (Print)' : '🖨️ Filter & Print'}
          </Button>

          <Link to="/admin/menu?action=add">
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              {t('admin.add_dish')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {/* Quick Store Operations & Logistics Bar */}
        <div
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: 'var(--space-xl)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px'
          }}
        >
          {/* Store Kitchen Status Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Power size={18} color={quickSettings.isOpen ? '#16a34a' : '#dc2626'} />
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-primary-dark, #881337)' }}>
                {isKm ? 'ស្ថានភាពហាង :' : 'Store Status:'}
              </span>
            </div>

            <div style={{ display: 'inline-flex', padding: '3px', backgroundColor: '#f1f5f9', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <button
                type="button"
                onClick={() => handleToggleStoreOpen(true)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: quickSettings.isOpen ? '#15803d' : 'transparent',
                  color: quickSettings.isOpen ? '#ffffff' : '#475569',
                  boxShadow: quickSettings.isOpen ? '0 1px 3px rgba(21,128,61,0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: quickSettings.isOpen ? '#4ade80' : '#94a3b8' }}></span>
                {isKm ? 'កំពុងបើក (Open)' : 'Open'}
              </button>

              <button
                type="button"
                onClick={() => handleToggleStoreOpen(false)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: !quickSettings.isOpen ? '#b91c1c' : 'transparent',
                  color: !quickSettings.isOpen ? '#ffffff' : '#475569',
                  boxShadow: !quickSettings.isOpen ? '0 1px 3px rgba(185,28,28,0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: !quickSettings.isOpen ? '#f87171' : '#94a3b8' }}></span>
                {isKm ? 'បិទហាង (Closed)' : 'Closed'}
              </button>
            </div>

            <span style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
              {quickSettings.isOpen
                ? (isKm ? '(អតិថិជនអាចកុម្ម៉ង់បាន)' : '(Customers can order)')
                : (isKm ? '(ផ្អាកការកុម្ម៉ង់បណ្តោះអាសន្ន)' : '(Ordering paused)')}
            </span>
          </div>

          {/* Quick Logistics Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* KHR Exchange Rate */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#334155', whiteSpace: 'nowrap' }}>
                💱 {isKm ? '1$ =' : '1$ ='}
              </span>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type="number"
                  step="50"
                  min="1000"
                  value={quickSettings.khrRate}
                  onChange={(e) => setQuickSettings((p) => ({ ...p, khrRate: e.target.value }))}
                  style={{
                    width: '74px',
                    padding: '4px 18px 4px 6px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    color: '#0f172a'
                  }}
                  title={isKm ? 'អត្រាប្តូរប្រាក់រៀល' : 'KHR Exchange Rate'}
                />
                <span style={{ position: 'absolute', right: '5px', fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8' }}>៛</span>
              </div>
            </div>

            {/* Save Button */}
            <button
              type="button"
              onClick={handleSaveQuickLogistics}
              disabled={isSavingSettings}
              style={{
                padding: '5px 12px',
                fontSize: '0.8rem',
                fontWeight: 700,
                backgroundColor: '#881337',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 1px 3px rgba(136,19,55,0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <Save size={13} />
              <span>{isSavingSettings ? (isKm ? '...' : '...') : (isKm ? 'រក្សាទុក' : 'Save')}</span>
            </button>
          </div>
        </div>

        {/* Metric Cards */}
        <div className="admin-stats-grid">
          {/* Revenue */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--primary">
              <DollarSign size={26} />
            </div>
            <div>
              <div className="admin-stat-val">
                {formatCurrency(dashboardPeriod === 'all' ? (stats.todayRevenue || periodRevenue) : periodRevenue)}
              </div>
              <div className="admin-stat-label">
                {dashboardPeriod === 'all' ? t('admin.stat_revenue') : `${t('admin.stat_revenue')} (${periodOptions.find(p => p.id === dashboardPeriod)?.label})`}
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--gold">
              <ShoppingBag size={26} />
            </div>
            <div>
              <div className="admin-stat-val">
                {dashboardPeriod === 'all' ? stats.totalOrdersCount : periodOrders.length}
              </div>
              <div className="admin-stat-label">
                {dashboardPeriod === 'all' ? t('admin.stat_orders') : `${t('admin.stat_orders')} (${periodOptions.find(p => p.id === dashboardPeriod)?.label})`}
              </div>
            </div>
          </div>

          {/* Customers */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--success">
              <Users size={26} />
            </div>
            <div>
              <div className="admin-stat-val">{stats.totalCustomersCount}</div>
              <div className="admin-stat-label">{t('admin.stat_customers')}</div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--info">
              <UtensilsCrossed size={26} />
            </div>
            <div>
              <div className="admin-stat-val">{stats.activeDishesCount}</div>
              <div className="admin-stat-label">{t('admin.stat_dishes')}</div>
            </div>
          </div>
        </div>

        {/* Analytics & Orders Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)', marginBottom: 'var(--space-xl)' }}>
          {/* Recent Orders */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
                {t('admin.recent_orders')}
              </h3>
              <Link to="/admin/orders" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                {t('admin.view_all_orders')}
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>{t('admin.order_id')}</th>
                    <th>{t('admin.order_customer')}</th>
                    <th>{t('admin.order_destination')}</th>
                    <th>{t('admin.order_total')}</th>
                    <th>{t('admin.order_status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--color-text-muted)' }}>
                        {t('common.empty')}
                      </td>
                    </tr>
                  ) : (
                    recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                            #{order.id}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {order.phone}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {order.address}
                          </div>
                        </td>
                        <td style={{ fontWeight: 700 }}>
                          {formatCurrency(order.total)}
                        </td>
                        <td>{getStatusBadge(order.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales by Category */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PieChart size={18} />
                {t('admin.sales_by_category')}
              </h3>
            </div>

            <div style={{ padding: 'var(--space-md)' }}>
              {categorySales.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>
                  {t('common.empty')}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {categorySales.map(([cat, amount]) => {
                    const totalSales = categorySales.reduce((sum, [, a]) => sum + a, 0);
                    const pct = totalSales > 0 ? Math.round((amount / totalSales) * 100) : 0;
                    return (
                      <div key={cat}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                          <span style={{ fontWeight: 600 }}>{cat}</span>
                          <span>{formatCurrency(amount)} ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', backgroundColor: 'var(--color-bg)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div
                            style={{
                              height: '100%',
                              width: `${pct}%`,
                              backgroundColor: 'var(--color-primary)',
                              borderRadius: '4px',
                              transition: 'width var(--transition-normal)'
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
              {t('admin.popular_dishes')}
            </h3>
            <Link to="/admin/menu" style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>
              Manage Menu &rarr;
            </Link>
          </div>

          <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-md)' }}>
            {popularDishes.map((dish) => (
              <div key={dish.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}>
                <img src={getImageUrl(dish.image)} alt={isKm ? dish.name_km : dish.name_en} style={{ width: '54px', height: '54px', borderRadius: '8px', objectFit: 'cover' }} />
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isKm ? dish.name_km : dish.name_en}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                    {dish.category}
                  </div>
                  <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                    {formatCurrency(dish.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Print Filter & Live Preview Modal */}
        <PrintReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          orders={orders}
          adminUser={user}
        />
      </div>
    </div>
  );
};
