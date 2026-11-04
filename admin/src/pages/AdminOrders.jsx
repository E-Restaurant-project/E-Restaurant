import React, { useState, useMemo } from 'react';
import {
  Eye,
  Search,
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
  ExternalLink,
  CheckSquare,
  Square,
  Filter,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { OrderStatusDropdown, ORDER_STATUS_CONFIG } from '../components/admin/OrderStatusDropdown';
import { printOrdersReport } from '../utils/printReport';
import { PrintReportModal } from '../components/admin/PrintReportModal';

export const AdminOrders = () => {
  const { t, language, formatCurrency } = useLanguage();
  const { orders, updateOrderStatus } = useRestaurant();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Granular Filter Options
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'khqr'

  // Specific Order Selection Checkbox State
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);

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

  // Compute date boundaries
  const dateBounds = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    if (datePreset === 'today') {
      return { start: startOfToday, end: endOfToday, label: isKm ? 'ថ្ងៃនេះ' : 'Today' };
    }
    if (datePreset === 'yesterday') {
      const yStart = new Date(startOfToday);
      yStart.setDate(yStart.getDate() - 1);
      const yEnd = new Date(endOfToday);
      yEnd.setDate(yEnd.getDate() - 1);
      return { start: yStart, end: yEnd, label: isKm ? 'ម្សិលមិញ' : 'Yesterday' };
    }
    if (datePreset === 'week') {
      const wStart = new Date(startOfToday);
      wStart.setDate(wStart.getDate() - 7);
      return { start: wStart, end: endOfToday, label: isKm ? '៧ ថ្ងៃចុងក្រោយ' : 'Last 7 Days' };
    }
    if (datePreset === 'month') {
      const mStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      return { start: mStart, end: endOfToday, label: isKm ? 'ខែនេះ' : 'This Month' };
    }
    if (datePreset === 'custom' && customStartDate) {
      const cStart = new Date(customStartDate + 'T00:00:00');
      const cEnd = customEndDate ? new Date(customEndDate + 'T23:59:59') : endOfToday;
      return { start: cStart, end: cEnd, label: `${customStartDate} → ${customEndDate || 'Now'}` };
    }

    return { start: null, end: null, label: isKm ? 'គ្រប់កាលបរិច្ឆេទ' : 'All Time' };
  }, [datePreset, customStartDate, customEndDate, isKm]);

  // Multi-dimensional filtered orders list
  const filteredOrders = useMemo(() => {
    return orders
      .filter((o) => {
        // 1. Status Filter
        if (statusFilter !== 'all' && o.status !== statusFilter) return false;

        // 2. Payment Method Filter
        if (paymentFilter !== 'all') {
          const pm = String(o.payment_method || o.paymentMethod || 'cash').toLowerCase();
          if (paymentFilter === 'cash' && !pm.includes('cash')) return false;
          if (paymentFilter === 'khqr' && !pm.includes('khqr') && !pm.includes('qr') && !pm.includes('bank')) return false;
        }

        // 3. Date Range Filter
        if (dateBounds.start) {
          const orderTime = new Date(o.created_at || o.createdAt || Date.now()).getTime();
          if (orderTime < dateBounds.start.getTime()) return false;
          if (dateBounds.end && orderTime > dateBounds.end.getTime()) return false;
        }

        // 4. Search Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchId = String(o.id || '').toLowerCase().includes(q);
          const matchName = String(o.customerName || o.customer_name || '').toLowerCase().includes(q);
          const matchPhone = String(o.phone || '').includes(q);
          const matchAddress = String(o.address || '').toLowerCase().includes(q);
          if (!matchId && !matchName && !matchPhone && !matchAddress) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [orders, statusFilter, paymentFilter, dateBounds, searchQuery]);

  // Checkbox toggle helpers
  const toggleSelectOrder = (id) => {
    const sId = String(id);
    setSelectedOrderIds((prev) =>
      prev.includes(sId) ? prev.filter((x) => x !== sId) : [...prev, sId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedOrderIds.length === filteredOrders.length && filteredOrders.length > 0) {
      setSelectedOrderIds([]);
    } else {
      setSelectedOrderIds(filteredOrders.map((o) => String(o.id)));
    }
  };

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

  const resetAllFilters = () => {
    setStatusFilter('all');
    setDatePreset('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setPaymentFilter('all');
    setSearchQuery('');
    setSelectedOrderIds([]);
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
            {isKm ? 'តាមដាន ជ្រើសរើស និងបោះពុម្ពរបាយការណ៍ការកុម្ម៉ង់ជាក់ស្តែង' : 'Filter, select specific orders and print customized reports'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            icon={<Printer size={16} />}
          >
            {isKm ? '🖨️ តម្រង & បោះពុម្ព (Print)' : '🖨️ Filter & Print'}
          </Button>
        </div>
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

        {/* Multi-Dimensional Filter Bar (Date, Payment, Search) */}
        <div style={{ background: '#ffffff', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '14px', marginBottom: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            {/* Date Presets */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={14} color="var(--color-primary)" />
                {isKm ? 'កាលបរិច្ឆេទ:' : 'Date:'}
              </span>
              {[
                { id: 'all', label: isKm ? 'គ្រប់ពេល' : 'All' },
                { id: 'today', label: isKm ? 'ថ្ងៃនេះ' : 'Today' },
                { id: 'yesterday', label: isKm ? 'ម្សិលមិញ' : 'Yesterday' },
                { id: 'week', label: isKm ? '៧ ថ្ងៃ' : '7 Days' },
                { id: 'month', label: isKm ? 'ខែនេះ' : 'This Month' },
                { id: 'custom', label: isKm ? 'កំណត់ថ្ងៃ...' : 'Custom...' }
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDatePreset(p.id)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: datePreset === p.id ? '1.5px solid var(--color-primary)' : '1px solid #cbd5e1',
                    backgroundColor: datePreset === p.id ? 'var(--color-primary)' : '#f8fafc',
                    color: datePreset === p.id ? '#ffffff' : '#334155'
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Payment Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                {isKm ? 'ការទូទាត់:' : 'Payment:'}
              </span>
              {[
                { id: 'all', label: isKm ? 'ទាំងអស់' : 'All' },
                { id: 'cash', label: isKm ? '💵 សាច់ប្រាក់' : '💵 Cash' },
                { id: 'khqr', label: isKm ? '📱 KHQR' : '📱 KHQR' }
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentFilter(pm.id)}
                  style={{
                    padding: '4px 9px',
                    borderRadius: '6px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    border: paymentFilter === pm.id ? '1.5px solid var(--color-primary)' : '1px solid #cbd5e1',
                    backgroundColor: paymentFilter === pm.id ? 'rgba(136, 19, 55, 0.08)' : '#ffffff',
                    color: paymentFilter === pm.id ? 'var(--color-primary)' : '#475569'
                  }}
                >
                  {pm.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date Inputs if custom selected */}
          {datePreset === 'custom' && (
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', background: '#f8fafc', padding: '8px 12px', borderRadius: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{isKm ? 'ចាប់ពី:' : 'From:'}</span>
              <input
                type="date"
                className="form-input"
                style={{ height: '32px', fontSize: '0.82rem' }}
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#64748b' }}>{isKm ? 'ដល់:' : 'To:'}</span>
              <input
                type="date"
                className="form-input"
                style={{ height: '32px', fontSize: '0.82rem' }}
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          )}

          {/* Search Box & Quick Reset */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                type="text"
                className="form-input"
                placeholder={isKm ? 'ស្វែងរកតាមលេខកូដ (#ID), ឈ្មោះអតិថិជន, លេខទូរស័ព្ទ, អាសយដ្ឋាន...' : 'Search by Order ID, customer name, phone, or address...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '40px', fontSize: '0.86rem', borderRadius: '8px', width: '100%' }}
              />
            </div>

            {(statusFilter !== 'all' || datePreset !== 'all' || paymentFilter !== 'all' || searchQuery || selectedOrderIds.length > 0) && (
              <Button variant="ghost" size="sm" onClick={resetAllFilters} icon={<RotateCcw size={14} />}>
                {isKm ? 'កំណត់ឡើងវិញ' : 'Reset'}
              </Button>
            )}
          </div>
        </div>

        {/* Selected Orders Action Banner (When specific orders are checked) */}
        {selectedOrderIds.length > 0 && (
          <div
            style={{
              background: '#fff1f2',
              border: '1.5px solid #fecdd3',
              padding: '10px 16px',
              borderRadius: '10px',
              marginBottom: 'var(--space-md)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(136, 19, 55, 0.08)'
            }}
          >
            <div style={{ fontWeight: 700, color: '#881337', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.92rem' }}>
              <CheckSquare size={18} />
              <span>{isKm ? `បានជ្រើសរើស ${selectedOrderIds.length} ការកុម្ម៉ង់ជាក់លាក់` : `Selected ${selectedOrderIds.length} specific orders`}</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsPrintModalOpen(true)}
                icon={<Printer size={16} />}
              >
                {isKm ? `🖨️ បោះពុម្ព ${selectedOrderIds.length} ការកុម្ម៉ង់ដែលបានរើស` : `Print ${selectedOrderIds.length} Selected`}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrderIds([])}>
                {isKm ? 'ដកការជ្រើស' : 'Clear'}
              </Button>
            </div>
          </div>
        )}

        <div className="admin-card">
          {/* Table Container */}
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={filteredOrders.length > 0 && selectedOrderIds.length === filteredOrders.length}
                      onChange={toggleSelectAll}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                      title={isKm ? 'ជ្រើសទាំងអស់' : 'Select All'}
                    />
                  </th>
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
                    <td colSpan="9" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                      <ShoppingBag size={42} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                      <div style={{ fontWeight: 600, fontSize: '1rem', marginBottom: '4px' }}>
                        {isKm ? 'មិនមានការកុម្ម៉ង់ស្របតាមតម្រងនេះទេ' : 'No orders found matching your filters'}
                      </div>
                      <div style={{ fontSize: '0.85rem' }}>
                        {isKm ? 'សូមជ្រើសរើសកាលបរិច្ឆេទ ឬផ្ទាំងស្ថានភាពផ្សេងទៀត' : 'Try selecting another date or status filter'}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isChecked = selectedOrderIds.includes(String(order.id));
                    return (
                      <tr
                        key={order.id}
                        style={{ backgroundColor: isChecked ? 'rgba(136, 19, 55, 0.03)' : undefined }}
                      >
                        {/* Checkbox for specific selection */}
                        <td style={{ textAlign: 'center' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOrder(order.id)}
                            style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                          />
                        </td>

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
                            >
                              <Phone size={11} />
                              <span>{order.phone}</span>
                            </a>
                          )}
                        </td>

                        {/* Payment Method */}
                        <td>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, backgroundColor: order.paymentMethod === 'khqr' ? '#eff6ff' : '#f0fdf4', color: order.paymentMethod === 'khqr' ? '#1d4ed8' : '#15803d', border: `1px solid ${order.paymentMethod === 'khqr' ? '#bfdbfe' : '#bbf7d0'}` }}>
                            {order.paymentMethod === 'khqr' ? <CreditCard size={12} /> : <Banknote size={12} />}
                            <span>{order.paymentMethod === 'khqr' ? 'KHQR' : 'សាច់ប្រាក់'}</span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td style={{ maxWidth: '200px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', fontSize: '0.82rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            <MapPin size={13} style={{ flexShrink: 0, marginTop: '2px', color: 'var(--color-primary)' }} />
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{order.address}</span>
                          </div>
                        </td>

                        {/* Items Count */}
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {order.items?.length || 0} {isKm ? 'មុខ' : 'items'}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                            {order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0)} {isKm ? 'ចានសរុប' : 'total qty'}
                          </div>
                        </td>

                        {/* Total Dual Currency */}
                        <td>
                          <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.95rem' }}>
                            {formatCurrency(order.total)}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {Number(order.totalKhr || (order.total * 4100)).toLocaleString()} ៛
                          </div>
                        </td>

                        {/* Status Dropdown */}
                        <td>
                          <OrderStatusDropdown
                            currentStatus={order.status}
                            onStatusChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                            disabled={order.status === 'cancelled'}
                          />
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'center' }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedOrder(order)}
                            icon={<Eye size={15} />}
                          >
                            {isKm ? 'មើល' : 'View'}
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Print Filter & Live Preview Modal */}
        <PrintReportModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          orders={orders}
          adminUser={user}
          initialStatus={statusFilter}
          preSelectedOrderIds={selectedOrderIds}
        />

        {/* View Order Detail Modal */}
        {selectedOrder && (
          <Modal
            isOpen={Boolean(selectedOrder)}
            onClose={() => setSelectedOrder(null)}
            title={isKm ? `ព័ត៌មានលម្អិតការកុម្ម៉ង់ #${selectedOrder.id}` : `Order Details #${selectedOrder.id}`}
            maxWidth="680px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{isKm ? 'អតិថិជន:' : 'Customer:'}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selectedOrder.customerName}</div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--color-primary)' }}>{selectedOrder.phone}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{isKm ? 'ទីតាំងដឹកជញ្ជូន:' : 'Destination:'}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{selectedOrder.address}</div>
                </div>
              </div>

              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{isKm ? 'មុខម្ហូបដែលបានកុម្ម៉ង់' : 'Order Items'}:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {selectedOrder.items?.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.88rem' }}>
                      <div>
                        <strong>{it.name || it.name_km}</strong> × {it.quantity}
                      </div>
                      <div style={{ fontWeight: 700 }}>
                        ${((Number(it.price) || 0) * (it.quantity || 1)).toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '2px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700 }}>{isKm ? 'សរុបចុងក្រោយ:' : 'Grand Total:'}</span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                  ${Number(selectedOrder.total || 0).toFixed(2)} ({Number(selectedOrder.totalKhr || (selectedOrder.total * 4100)).toLocaleString()} ៛)
                </span>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
