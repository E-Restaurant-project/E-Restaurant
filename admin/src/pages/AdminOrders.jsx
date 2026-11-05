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
import { printOrdersReport, printSingleInvoice } from '../utils/printReport';
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
      const adminName = user?.name || user?.username || user?.email || (isKm ? 'អ្នកគ្រប់គ្រង' : 'Admin');
      const updated = await updateOrderStatus(orderId, newStatus, adminName);
      if (selectedOrder && (selectedOrder.id === orderId || selectedOrder.orderId === orderId)) {
        setSelectedOrder((prev) => (updated ? { ...prev, ...updated } : { ...prev, status: newStatus }));
      }
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
                        <td
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedOrder(order)}
                          title={isKm ? 'ចុចដើម្បីបើកវិក្កយបត្រលម្អិត' : 'Click to open invoice'}
                        >
                          <div style={{ fontWeight: 800, color: 'var(--color-primary)', fontSize: '0.94rem', textDecoration: 'underline' }}>
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
                        <td
                          style={{ cursor: 'pointer' }}
                          onClick={() => setSelectedOrder(order)}
                          title={isKm ? 'ចុចដើម្បីបើកវិក្កយបត្រលម្អិត' : 'Click to open invoice'}
                        >
                          <div style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {order.customerName || 'Customer'}
                          </div>
                          {order.phone && (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '0.8rem',
                                color: 'var(--color-text-muted)',
                                marginTop: '2px'
                              }}
                            >
                              <Phone size={11} />
                              <span>{order.phone}</span>
                            </div>
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

        {/* View Order Detail & Printable Invoice Modal */}
        {selectedOrder && (
          <Modal
            isOpen={Boolean(selectedOrder)}
            onClose={() => setSelectedOrder(null)}
            title={isKm ? `វិក្កយបត្រការកុម្ម៉ង់ #${selectedOrder.id}` : `Order Invoice #${selectedOrder.id}`}
            maxWidth="700px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Receipt Header Card */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img
                    src="/phum_yeung_logo.jpg"
                    alt="Phum Yeung"
                    style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--color-primary)' }}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--color-primary-dark)' }}>
                      ភោជនីយដ្ឋាន ភូមិយើង
                    </h3>
                    <div style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>PHUM YEUNG RESTAURANT</div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-block', backgroundColor: 'var(--color-primary)', color: '#fff', fontSize: '0.72rem', fontWeight: 800, padding: '2px 8px', borderRadius: '4px' }}>
                    {isKm ? 'វិក្កយបត្រផ្លូវការ' : 'OFFICIAL INVOICE'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
                    #{selectedOrder.id}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString(isKm ? 'km-KH' : 'en-US') : ''}
                  </div>
                </div>
              </div>

              {/* Meta Grid (Customer, Admin Sale, Payment, Delivery) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#ffffff', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isKm ? 'អតិថិជន:' : 'Customer:'}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0f172a' }}>{selectedOrder.customerName || 'N/A'}</div>
                  <div style={{ fontSize: '0.82rem', color: '#64748b' }}>{selectedOrder.phone || 'N/A'}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isKm ? 'អ្នកលក់ / បេឡាករ (Admin Sale):' : 'Admin Sale / Cashier:'}</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, fontSize: '0.88rem', marginTop: '2px' }}>
                    <User size={14} />
                    <span>{selectedOrder.adminSale || selectedOrder.lastUpdatedBy || user?.name || user?.username || 'Admin'}</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isKm ? 'វិធីសាស្ត្រទូទាត់:' : 'Payment:'}</div>
                  <div style={{ fontWeight: 700, color: '#15803d', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <CreditCard size={14} />
                    <span>Bakong KHQR (PAID)</span>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isKm ? 'ស្ថានភាពបច្ចុប្បន្ន:' : 'Status:'}</div>
                  <div style={{ marginTop: '2px' }}>
                    <OrderStatusDropdown
                      currentStatus={selectedOrder.status}
                      onStatusChange={(newStatus) => handleStatusChange(selectedOrder.id, newStatus)}
                      disabled={selectedOrder.status === 'cancelled'}
                    />
                  </div>
                </div>

                <div style={{ gridColumn: 'span 2', borderTop: '1px dashed #e2e8f0', paddingTop: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>{isKm ? 'អាសយដ្ឋានដឹកជញ្ជូន:' : 'Delivery Destination:'}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                    {selectedOrder.address || 'Central Kitchen Pickup'}
                  </div>
                </div>
              </div>

              {/* Order Items Table */}
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: '#334155' }}>
                  {isKm ? 'មុខម្ហូបដែលបានកុម្ម៉ង់' : 'Order Items'} ({selectedOrder.items?.length || 0}):
                </h4>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>{isKm ? 'មុខម្ហូប' : 'Item'}</th>
                        <th style={{ padding: '8px 12px', textAlign: 'center', width: '60px', fontWeight: 700 }}>{isKm ? 'ចំនួន' : 'Qty'}</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '90px', fontWeight: 700 }}>{isKm ? 'តម្លៃ' : 'Price'}</th>
                        <th style={{ padding: '8px 12px', textAlign: 'right', width: '100px', fontWeight: 700 }}>{isKm ? 'សរុប' : 'Total'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((it, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '8px 12px', fontWeight: 600 }}>{it.name || it.name_km || it.name_en || 'Food Item'}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'center' }}>{it.quantity || 1}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right' }}>${Number(it.price || 0).toFixed(2)}</td>
                          <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>
                            ${((Number(it.price) || 0) * (it.quantity || 1)).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Totals */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: 'auto', width: '280px', fontSize: '0.88rem' }}>
                {Number(selectedOrder.subtotal || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>{isKm ? 'សរុបដើម:' : 'Subtotal:'}</span>
                    <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedOrder.deliveryFee || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                    <span>{isKm ? 'ថ្លៃដឹកជញ្ជូន:' : 'Delivery Fee:'}</span>
                    <span>${Number(selectedOrder.deliveryFee).toFixed(2)}</span>
                  </div>
                )}
                {Number(selectedOrder.discount || 0) > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 600 }}>
                    <span>{isKm ? 'បញ្ចុះតម្លៃ:' : 'Discount:'}</span>
                    <span>-${Number(selectedOrder.discount).toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '2px solid #e2e8f0' }}>
                  <span style={{ fontWeight: 800 }}>{isKm ? 'សរុបចុងក្រោយ:' : 'Grand Total:'}</span>
                  <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    ${Number(selectedOrder.total || 0).toFixed(2)} ({Number(selectedOrder.totalKhr || (selectedOrder.total * 4100)).toLocaleString()} ៛)
                  </span>
                </div>
              </div>

              {/* Admin Activity Logs Block */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#334155', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={14} />
                  <span>{isKm ? 'ប្រវត្តិសកម្មភាពរបស់អ្នកគ្រប់គ្រង (Admin Activity Logs)' : 'Admin Activity Logs'}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                  {Array.isArray(selectedOrder.activityLogs) && selectedOrder.activityLogs.length > 0 ? (
                    selectedOrder.activityLogs.map((log, idx) => (
                      <div key={idx} style={{ fontSize: '0.8rem', padding: '6px 8px', background: '#ffffff', borderRadius: '6px', border: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <strong style={{ color: 'var(--color-primary)' }}>{log.adminName || 'Admin'}:</strong>{' '}
                          <span style={{ color: '#334155' }}>{log.description || log.action}</span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', flexShrink: 0, marginLeft: '8px' }}>
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      {isKm ? 'ការកុម្ម៉ង់ត្រូវបានបង្កើត និងគ្រប់គ្រងដោយ' : 'Order created & managed by'}{' '}
                      <strong>{selectedOrder.adminSale || user?.name || 'Admin'}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <Button
                  variant="outline"
                  onClick={() => printSingleInvoice({ order: selectedOrder, adminUser: user, isKm })}
                  icon={<Printer size={16} />}
                >
                  {isKm ? 'បោះពុម្ពវិក្កយបត្រ' : 'Print Invoice'}
                </Button>
                <Button
                  variant="primary"
                  onClick={() => setSelectedOrder(null)}
                >
                  {isKm ? 'បិទ' : 'Close'}
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};
