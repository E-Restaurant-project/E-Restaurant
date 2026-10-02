import React from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Users,
  UtensilsCrossed,
  ArrowRight,
  Download,
  Plus,
  PieChart
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { getImageUrl } from '../config/api';

export const AdminDashboard = () => {
  const { t, language, formatCurrency } = useLanguage();
  const { stats, orders, dishes, exportOrdersToCSV } = useRestaurant();
  const isKm = language === 'km';

  const recentOrders = orders.slice(0, 5);
  const popularDishes = dishes.slice(0, 4);

  // Sales by category calculation
  const categorySales = React.useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      o.items?.forEach((it) => {
        // Find dish category
        const dish = dishes.find((d) => d.id === it.dishId);
        const cat = dish?.category || 'Other';
        map[cat] = (map[cat] || 0) + it.price * it.quantity;
      });
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [orders, dishes]);

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
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_dashboard')}</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" onClick={exportOrdersToCSV} icon={<Download size={16} />}>
            {t('admin.export_csv')}
          </Button>
          <Link to="/admin/menu?action=add">
            <Button variant="primary" size="sm" icon={<Plus size={16} />}>
              {t('admin.add_dish')}
            </Button>
          </Link>
        </div>
      </div>

      <div className="admin-content">
        {/* Metric Cards */}
        <div className="admin-stats-grid">
          {/* Revenue */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--primary">
              <DollarSign size={26} />
            </div>
            <div>
              <div className="admin-stat-val">
                {formatCurrency(stats.todayRevenue)}
              </div>
              <div className="admin-stat-label">{t('admin.stat_revenue')}</div>
            </div>
          </div>

          {/* Orders */}
          <div className="admin-stat-card">
            <div className="admin-stat-icon admin-stat-icon--gold">
              <ShoppingBag size={26} />
            </div>
            <div>
              <div className="admin-stat-val">{stats.totalOrdersCount}</div>
              <div className="admin-stat-label">{t('admin.stat_orders')}</div>
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
                <span>{t('featured.view_all')}</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Destination</th>
                    <th>Total</th>
                    <th>{t('admin.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((ord) => (
                    <tr key={ord.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{ord.id}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{ord.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{ord.phone}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.85rem' }}>{ord.address ? ord.address.substring(0, 25) + '...' : 'Self-Pickup'}</span>
                      </td>
                      <td style={{ fontWeight: 700 }}>
                        {formatCurrency(ord.total)}
                      </td>
                      <td>{getStatusBadge(ord.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sales By Category Breakdown */}
          <div className="admin-card">
            <div className="admin-card__header">
              <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <PieChart size={18} />
                <span>{t('admin.category_sales')}</span>
              </h3>
            </div>

            <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {categorySales.map(([cat, total]) => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{cat.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(total)}</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        backgroundColor: 'var(--color-secondary)',
                        width: `${Math.min(100, (total / (stats.todayRevenue || 1)) * 100)}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Popular Dishes */}
        <div className="admin-card">
          <div className="admin-card__header">
            <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary-dark)' }}>
              {t('admin.popular_items')}
            </h3>
            <Link to="/admin/menu" style={{ fontSize: '0.85rem', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
              <span>Manage Menu</span>
              <ArrowRight size={14} />
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
      </div>
    </div>
  );
};
