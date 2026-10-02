import React, { useState } from 'react';
import { ShoppingBag, Eye, Search, Download, Printer, CheckCircle2, Truck, ChefHat, Clock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';

export const AdminOrders = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const { orders, updateOrderStatus, exportOrdersToCSV } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOrders = orders.filter((o) => {
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchId = o.id.toLowerCase().includes(q);
      const matchName = o.customerName.toLowerCase().includes(q);
      const matchPhone = o.phone.includes(q);
      if (!matchId && !matchName && !matchPhone) return false;
    }
    return true;
  });

  const handleStatusChange = (orderId, newStatus) => {
    updateOrderStatus(orderId, newStatus);
    showToast(isKm ? `បានកែប្រែស្ថានភាពទៅជា "${t(`admin.status_${newStatus}`)}"` : `Status updated to ${newStatus}`, 'success');
  };

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
        <h1 className="admin-topbar__title">{t('admin.nav_orders')}</h1>
        <Button variant="outline" size="sm" onClick={exportOrdersToCSV} icon={<Download size={16} />}>
          {t('admin.export_csv')}
        </Button>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          {/* Filter Bar */}
          <div className="admin-card__header">
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '240px' }}>
                <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by ID, name, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
                />
              </div>

              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ width: 'auto', fontSize: '0.85rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="pending">{t('admin.status_pending')}</option>
                <option value="preparing">{t('admin.status_preparing')}</option>
                <option value="delivering">{t('admin.status_delivering')}</option>
                <option value="completed">{t('admin.status_completed')}</option>
                <option value="cancelled">{t('admin.status_cancelled')}</option>
              </select>
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
              Matching Orders: <strong>{filteredOrders.length}</strong>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Info</th>
                  <th>Type & Payment</th>
                  <th>Destination</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>{t('admin.status')}</th>
                  <th>Update Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {order.id}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {order.phone}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, textTransform: 'capitalize' }}>
                        {t(`checkout.${order.orderType}`)}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                        {order.paymentMethod === 'khqr' ? '💳 KHQR' : '💵 Cash'}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        {order.address ? order.address.substring(0, 25) + '...' : 'Self-Pickup (Hub)'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9rem' }}>
                        {order.items?.length || 0} items
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrency(order.total)}
                    </td>
                    <td>{getStatusBadge(order.status)}</td>
                    <td>
                      <select
                        className="form-select"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="pending">{t('admin.status_pending')}</option>
                        <option value="preparing">{t('admin.status_preparing')}</option>
                        <option value="delivering">{t('admin.status_delivering')}</option>
                        <option value="completed">{t('admin.status_completed')}</option>
                        <option value="cancelled">{t('admin.status_cancelled')}</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => setSelectedOrder(order)}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Modal
          isOpen={!!selectedOrder}
          onClose={() => setSelectedOrder(null)}
          title={`Order: ${selectedOrder.id}`}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.phone})
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {selectedOrder.address && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Delivery Address:</strong> {selectedOrder.address}
              </div>
            )}
            {selectedOrder.pickupTime && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Pickup Time:</strong> {selectedOrder.pickupTime}
              </div>
            )}
            {selectedOrder.notes && (
              <div style={{ marginBottom: '12px' }}>
                <strong>Special Notes:</strong> <em>"{selectedOrder.notes}"</em>
              </div>
            )}

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '14px 0' }} />

            <h4 style={{ marginBottom: '10px' }}>Ordered Items:</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {selectedOrder.items?.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                  <span>
                    {it.quantity}x {isKm ? it.name_km : it.name_en}
                    {it.spiceLevel && <span style={{ color: 'var(--color-text-muted)' }}> ({it.spiceLevel})</span>}
                  </span>
                  <span>{formatCurrency(it.price * it.quantity)}</span>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', margin: '14px 0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                <span>Delivery Fee:</span>
                <span>{formatCurrency(selectedOrder.deliveryFee || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', marginTop: '6px' }}>
                <span>Total:</span>
                <span style={{ color: 'var(--color-primary)' }}>
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>
                Print Receipt
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
