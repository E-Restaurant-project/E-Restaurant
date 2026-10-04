import React, { useState, useMemo } from 'react';
import {
  Eye,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Truck,
  ChefHat,
  Clock,
  XCircle,
  MapPin,
  Phone,
  Calendar,
  CreditCard,
  Banknote,
  Receipt,
  User,
  ShoppingBag,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { OrderStatusDropdown, ORDER_STATUS_CONFIG } from '../components/admin/OrderStatusDropdown';

export const AdminOrders = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const { orders, updateOrderStatus, exportOrdersToCSV } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live status counts
  const statusCounts = useMemo(() => {
    const counts = { all: orders.length, pending: 0, preparing: 0, delivering: 0, completed: 0, cancelled: 0 };
    orders.forEach((o) => {
      if (counts[o.status] !== undefined) {
        counts[o.status]++;
      }
    });
    return counts;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = (o.id || '').toLowerCase().includes(q);
          const matchName = (o.customerName || '').toLowerCase().includes(q);
          const matchPhone = (o.phone || '').includes(q);
          const matchAddress = (o.address || '').toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchAddress) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [orders, statusFilter, searchQuery]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      const statusObj = ORDER_STATUS_CONFIG[newStatus];
      const statusLabel = isKm ? statusObj?.label_km || newStatus : statusObj?.label_en || newStatus;
      showToast(
        isKm
          ? `បានកែប្រែស្ថានភាពការកុម្ម៉ង់ទៅជា "${statusLabel}"!`
          : `Order status updated to "${statusLabel}"!`,
        'success'
      );
    } catch (err) {
      showToast(isKm ? 'មិនអាចកែប្រែស្ថានភាពបានទេ' : 'Failed to update order status', 'error');
    }
  };

  const filterTabs = [
    { id: 'all', label: isKm ? 'ទាំងអស់' : 'All', count: statusCounts.all, icon: null },
    { id: 'pending', label: isKm ? 'កំពុងរង់ចាំ' : 'Pending', count: statusCounts.pending, icon: Clock, color: '#f59e0b', bg: '#fef3c7' },
    { id: 'preparing', label: isKm ? 'កំពុងចម្អិន' : 'Cooking', count: statusCounts.preparing, icon: ChefHat, color: '#3b82f6', bg: '#dbeafe' },
    { id: 'delivering', label: isKm ? 'កំពុងដឹក' : 'Delivering', count: statusCounts.delivering, icon: Truck, color: '#8b5cf6', bg: '#ede9fe' },
    { id: 'completed', label: isKm ? 'បានប្រគល់' : 'Delivered', count: statusCounts.completed, icon: CheckCircle2, color: '#22c55e', bg: '#dcfce7' },
    { id: 'cancelled', label: isKm ? 'បានបោះបង់' : 'Cancelled', count: statusCounts.cancelled, icon: XCircle, color: '#ef4444', bg: '#fee2e2' }
  ];

  return (
    <div>
      {/* Top Header */}
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title">{isKm ? 'ការគ្រប់គ្រងការដឹកជញ្ជូន & ការកុម្ម៉ង់' : 'Delivery & Orders Management'}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isKm ? 'តាមដាន ធ្វើបច្ចុប្បន្នភាព និងគ្រប់គ្រងការដឹកជញ្ជូនមុខម្ហូប' : 'Track, dispatch and update customer orders in real-time'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportOrdersToCSV} icon={<Download size={16} />}>
          {t('admin.export_csv')}
        </Button>
      </div>

      <div className="admin-content">
        {/* Interactive Quick Status Filter Tabs */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', marginBottom: 'var(--space-md)' }}>
          {filterTabs.map((tab) => {
            const isActive = statusFilter === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: isActive ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                  backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-bg-surface)',
                  color: isActive ? '#ffffff' : 'var(--color-text-main)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 4px 12px rgba(128, 0, 32, 0.2)' : 'none'
                }}
              >
                {Icon && (
                  <Icon
                    size={15}
                    style={{ color: isActive ? '#ffffff' : tab.color }}
                  />
                )}
                <span>{tab.label}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#64748b'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="admin-card">
          {/* Search Controls Bar */}
          <div className="admin-card__header">
            <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center', flexWrap: 'wrap', flex: 1 }}>
              <div style={{ position: 'relative', minWidth: '300px', flex: 1, maxWidth: '460px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder={isKm ? 'ស្វែងរកតាមលេខកូដ, ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ...' : 'Search by Order ID, name, or phone...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '36px', height: '44px', fontSize: '0.88rem', borderRadius: '12px' }}
                />
              </div>
            </div>

            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {isKm ? 'ចំនួនការកុម្ម៉ង់៖' : 'Matching Orders:'} <strong>{filteredOrders.length}</strong>
            </div>
          </div>

          {/* Table Container */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{isKm ? 'លេខកូដកុម្ម៉ង់' : 'Order ID'}</th>
                  <th>{isKm ? 'អតិថិជន' : 'Customer Info'}</th>
                  <th>{isKm ? 'ការទូទាត់' : 'Payment'}</th>
                  <th>{isKm ? 'ទីតាំងដឹកជញ្ជូន' : 'Destination'}</th>
                  <th>{isKm ? 'មុខម្ហូប' : 'Items'}</th>
                  <th>{isKm ? 'សរុប' : 'Total'}</th>
                  <th style={{ minWidth: '180px' }}>
                    {isKm ? 'ស្ថានភាព (ចុចប្តូរ)' : 'Status (Click to change)'}
                  </th>
                  <th style={{ textAlign: 'center' }}>{isKm ? 'សកម្មភាព' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                      <ShoppingBag size={42} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                        {isKm ? 'មិនមានការកុម្ម៉ង់ក្នុងបញ្ជីនេះទេ' : 'No orders found matching your filters'}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {isKm ? 'សូមជ្រើសរើសផ្ទាំងស្ថានភាពផ្សេងទៀត ឬស្វែងរកម្តងទៀត' : 'Try selecting another status tab or clear search query'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      {/* Order ID */}
                      <td>
                        <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: '0.92rem' }}>
                          #{order.id}
                        </div>
                        {order.createdAt && (
                          <div style={{ fontSize: '0.76rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                            <Clock size={11} />
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {order.customerName || 'Customer'}
                        </div>
                        {order.phone && (
                          <a
                            href={`tel:${order.phone}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                              color: 'var(--color-primary)',
                              textDecoration: 'none',
                              marginTop: '2px'
                            }}
                            title="Click to call"
                          >
                            <Phone size={11} />
                            {order.phone}
                          </a>
                        )}
                      </td>

                      {/* Payment */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 600, fontSize: '0.85rem' }}>
                          {order.paymentMethod === 'khqr' ? (
                            <>
                              <CreditCard size={14} color="#dc2626" />
                              <span style={{ color: '#b91c1c' }}>KHQR</span>
                            </>
                          ) : (
                            <>
                              <Banknote size={14} color="#15803d" />
                              <span style={{ color: '#15803d' }}>Cash</span>
                            </>
                          )}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                          {t(`checkout.${order.orderType}`) || order.orderType}
                        </div>
                      </td>

                      {/* Destination Address */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', maxWidth: '240px' }}>
                          <MapPin size={14} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span style={{ fontSize: '0.84rem', lineHeight: 1.35, color: 'var(--color-text-main)' }}>
                            {order.address ? order.address : (isKm ? 'ទទួលនៅហាង (Hub)' : 'Self-Pickup (Hub)')}
                          </span>
                        </div>
                      </td>

                      {/* Items */}
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '8px',
                            backgroundColor: '#f1f5f9',
                            fontSize: '0.84rem',
                            fontWeight: 600
                          }}
                        >
                          <ShoppingBag size={12} color="#64748b" />
                          {order.items?.length || 0} {isKm ? 'មុខ' : 'items'}
                        </span>
                      </td>

                      {/* Total */}
                      <td>
                        <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.98rem' }}>
                          {formatCurrency(order.total)}
                        </div>
                        {order.deliveryFee > 0 && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--color-text-muted)' }}>
                            +{formatCurrency(order.deliveryFee)} {isKm ? 'ដឹក' : 'fee'}
                          </div>
                        )}
                      </td>

                      {/* Interactive Modern Status Dropdown Pill */}
                      <td>
                        <OrderStatusDropdown
                          status={order.status}
                          onChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                        />
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          onClick={() => setSelectedOrder(order)}
                          style={{ padding: '6px 12px', borderRadius: '10px', fontSize: '0.8rem' }}
                          title={isKm ? 'ពិនិត្យវិក្កយបត្រលម្អិត' : 'View Order Details'}
                        >
                          <Eye size={14} style={{ marginRight: '4px' }} />
                          {isKm ? 'លម្អិត' : 'Details'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
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
          title={`Order #${selectedOrder.id}`}
          maxWidth="640px"
        >
          <div>
            {/* Modal Top Bar with Live Interactive Status */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                backgroundColor: 'var(--color-bg-subtle)',
                borderRadius: '14px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {isKm ? 'ស្ថានភាពបច្ចុប្បន្ន' : 'Current Order Status'}
                </div>
                <div style={{ marginTop: '4px' }}>
                  <OrderStatusDropdown
                    status={selectedOrder.status}
                    onChange={(newStatus) => {
                      handleStatusChange(selectedOrder.id, newStatus);
                      setSelectedOrder((prev) => ({ ...prev, status: newStatus }));
                    }}
                    size="md"
                  />
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  {isKm ? 'ប្រភេទដឹកជញ្ជូន' : 'Dispatch Type'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--color-text-main)', marginTop: '2px' }}>
                  {t(`checkout.${selectedOrder.orderType}`) || selectedOrder.orderType}
                </div>
              </div>
            </div>

            {/* Customer Details Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <User size={13} />
                  <span>{isKm ? 'អ្នកកុម្ម៉ង់' : 'Customer'}</span>
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedOrder.customerName}</div>
                {selectedOrder.phone && (
                  <a
                    href={`tel:${selectedOrder.phone}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', color: 'var(--color-primary)', marginTop: '4px', textDecoration: 'none' }}
                  >
                    <Phone size={12} />
                    {selectedOrder.phone}
                  </a>
                )}
              </div>

              <div style={{ padding: '12px', border: '1px solid var(--color-border)', borderRadius: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '4px' }}>
                  <MapPin size={13} />
                  <span>{isKm ? 'ទីតាំងដឹកជញ្ជូន' : 'Delivery Address'}</span>
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, lineHeight: 1.35 }}>
                  {selectedOrder.address || (isKm ? 'មកទទួលនៅហាងផ្ទាល់' : 'Self-Pickup at Hub')}
                </div>
              </div>
            </div>

            {selectedOrder.notes && (
              <div style={{ padding: '10px 14px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px', marginBottom: '16px', fontSize: '0.86rem', color: '#92400e' }}>
                <strong>{isKm ? 'ចំណាំពិសេស៖' : 'Special Note:'}</strong> "{selectedOrder.notes}"
              </div>
            )}

            {/* Ordered Items List */}
            <div style={{ border: '1px solid var(--color-border)', borderRadius: '14px', overflow: 'hidden', marginBottom: '16px' }}>
              <div style={{ padding: '10px 14px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: '0.88rem', display: 'flex', justifyContent: 'space-between' }}>
                <span>{isKm ? 'មុខម្ហូបបានកុម្ម៉ង់' : 'Ordered Items'}</span>
                <span>{selectedOrder.items?.length || 0} {isKm ? 'មុខ' : 'items'}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', divideY: '1px solid var(--color-border)' }}>
                {selectedOrder.items?.map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      fontSize: '0.9rem',
                      borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid #f1f5f9' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: '#f1f5f9',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        {it.quantity}x
                      </span>
                      <div>
                        <div style={{ fontWeight: 600 }}>{isKm ? it.name_km : it.name_en}</div>
                        {it.spiceLevel && it.spiceLevel !== 'none' && (
                          <div style={{ fontSize: '0.78rem', color: '#ea580c' }}>
                            🌶️ {it.spiceLevel}
                          </div>
                        )}
                      </div>
                    </div>
                    <span style={{ fontWeight: 700 }}>{formatCurrency(it.price * it.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total Breakdown */}
            <div style={{ padding: '14px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{isKm ? 'សរុបមុខម្ហូប' : 'Subtotal'}:</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(selectedOrder.subtotal)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '6px' }}>
                <span style={{ color: 'var(--color-text-muted)' }}>{isKm ? 'សេវាដឹកជញ្ជូន' : 'Delivery Fee'}:</span>
                <span style={{ fontWeight: 600 }}>
                  {selectedOrder.deliveryFee > 0 ? formatCurrency(selectedOrder.deliveryFee) : (isKm ? 'ឥតគិតថ្លៃ' : 'Free')}
                </span>
              </div>
              <div style={{ borderTop: '1px dashed var(--color-border)', margin: '8px 0', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>{isKm ? 'ទឹកប្រាក់សរុប' : 'Grand Total'}:</span>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--color-primary)' }}>
                  {formatCurrency(selectedOrder.total)}
                </span>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <Button variant="outline" size="sm" onClick={() => window.print()} icon={<Printer size={14} />}>
                {isKm ? 'បោះពុម្ពវិក្កយបត្រ' : 'Print Receipt'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
