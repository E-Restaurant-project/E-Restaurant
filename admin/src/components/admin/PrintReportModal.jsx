import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  XCircle,
  CreditCard,
  Banknote,
  Search,
  ListOrdered,
  CheckSquare,
  Square
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../hooks/useLanguage';
import { printOrdersReport } from '../../utils/printReport';

export const PrintReportModal = ({
  isOpen,
  onClose,
  orders = [],
  adminUser = null,
  initialStatus = 'all',
  preSelectedOrderIds = []
}) => {
  const { language } = useLanguage();
  const isKm = language === 'km';

  // Filters State
  const [datePreset, setDatePreset] = useState('all'); // 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus || 'all');
  const [paymentFilter, setPaymentFilter] = useState('all'); // 'all' | 'cash' | 'khqr'
  const [searchFilter, setSearchFilter] = useState('');

  // Selected Order IDs Set for Specific Item Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  // Sync initialStatus when modal opens
  useEffect(() => {
    if (isOpen && initialStatus) {
      setStatusFilter(initialStatus);
    }
  }, [isOpen, initialStatus]);

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
      const label = `${customStartDate} → ${customEndDate || 'Now'}`;
      return { start: cStart, end: cEnd, label };
    }

    return { start: null, end: null, label: isKm ? 'គ្រប់កាលបរិច្ឆេទ' : 'All Time' };
  }, [datePreset, customStartDate, customEndDate, isKm]);

  // Filtered orders for report based on query filters
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // 1. Status Filter
      if (statusFilter !== 'all') {
        const s = String(o.status || o.order_status || '').toLowerCase();
        if (s !== statusFilter) return false;
      }

      // 2. Payment Method Filter
      if (paymentFilter !== 'all') {
        const pm = String(o.payment_method || o.paymentMethod || 'cash').toLowerCase();
        if (paymentFilter === 'cash' && !pm.includes('cash')) return false;
        if (paymentFilter === 'khqr' && !pm.includes('khqr') && !pm.includes('qr') && !pm.includes('bank')) return false;
      }

      // 3. Search Filter (ID, Name, Phone)
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase().trim();
        const id = String(o.id || o.order_id || '').toLowerCase();
        const name = String(o.customer?.name || o.customerName || o.customer_name || '').toLowerCase();
        const phone = String(o.customer?.phone || o.phone || o.customer_phone || '');
        if (!id.includes(q) && !name.includes(q) && !phone.includes(q)) return false;
      }

      // 4. Date Range Filter
      if (dateBounds.start) {
        const orderTime = new Date(o.created_at || o.createdAt || Date.now()).getTime();
        if (orderTime < dateBounds.start.getTime()) return false;
        if (dateBounds.end && orderTime > dateBounds.end.getTime()) return false;
      }

      return true;
    });
  }, [orders, statusFilter, paymentFilter, searchFilter, dateBounds]);

  // Automatically update selectedOrderIds when filteredOrders change or when preSelectedOrderIds provided
  useEffect(() => {
    if (preSelectedOrderIds && preSelectedOrderIds.length > 0) {
      setSelectedOrderIds(new Set(preSelectedOrderIds));
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => String(o.id || o.order_id || o._id))));
    }
  }, [filteredOrders, preSelectedOrderIds]);

  // Toggle single order selection
  const toggleOrderSelection = (id) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle select all matching orders
  const toggleSelectAll = () => {
    if (selectedOrderIds.size === filteredOrders.length) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(filteredOrders.map((o) => String(o.id || o.order_id || o._id))));
    }
  };

  // Exactly selected orders to print
  const ordersToPrint = useMemo(() => {
    return filteredOrders.filter((o) => selectedOrderIds.has(String(o.id || o.order_id || o._id)));
  }, [filteredOrders, selectedOrderIds]);

  // Financial Stats for Selected Data
  const reportTotals = useMemo(() => {
    const totalCount = ordersToPrint.length;
    const totalUSD = ordersToPrint.reduce((sum, o) => sum + (Number(o.total_usd || o.total) || 0), 0);
    const totalKHR = ordersToPrint.reduce((sum, o) => {
      if (o.total_khr) return sum + Number(o.total_khr);
      return sum + ((Number(o.total_usd || o.total) || 0) * 4100);
    }, 0);
    return { totalCount, totalUSD, totalKHR };
  }, [ordersToPrint]);

  const handlePrint = () => {
    printOrdersReport({
      orders: ordersToPrint,
      filterMeta: {
        status: statusFilter,
        date: dateBounds.label,
        payment: paymentFilter !== 'all' ? paymentFilter : null,
        search: searchFilter || null,
        specificCount: ordersToPrint.length
      },
      adminUser,
      isKm
    });
    onClose();
  };

  const statusOptions = [
    { id: 'all', label: isKm ? 'ទាំងអស់' : 'All', icon: null },
    { id: 'completed', label: isKm ? 'បានប្រគល់' : 'Delivered', icon: CheckCircle2, color: '#16a34a' },
    { id: 'delivering', label: isKm ? 'កំពុងដឹក' : 'Delivering', icon: Truck, color: '#0284c7' },
    { id: 'preparing', label: isKm ? 'កំពុងចម្អិន' : 'Cooking', icon: ChefHat, color: '#d97706' },
    { id: 'pending', label: isKm ? 'កំពុងរង់ចាំ' : 'Pending', icon: Clock, color: '#ca8a04' },
    { id: 'cancelled', label: isKm ? 'បានបោះបង់' : 'Cancelled', icon: XCircle, color: '#dc2626' }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isKm ? '🖨️ តម្រង និងជ្រើសរើសការកុម្ម៉ង់បោះពុម្ព (Filter & Select Orders)' : '🖨️ Filter & Select Specific Orders'}
      maxWidth="820px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Top Filter Controls Container */}
        <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          
          {/* 1. Date Range Filter Presets */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-main)' }}>
                <Calendar size={15} color="var(--color-primary)" />
                <span>{isKm ? 'កាលបរិច្ឆេទ (Date Range)' : 'Date Range'}:</span>
              </label>
              <span style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600 }}>
                {dateBounds.label}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {[
                { id: 'all', label: isKm ? 'គ្រប់ពេល' : 'All Time' },
                { id: 'today', label: isKm ? 'ថ្ងៃនេះ' : 'Today' },
                { id: 'yesterday', label: isKm ? 'ម្សិលមិញ' : 'Yesterday' },
                { id: 'week', label: isKm ? '៧ ថ្ងៃ' : '7 Days' },
                { id: 'month', label: isKm ? 'ខែនេះ' : 'This Month' },
                { id: 'custom', label: isKm ? 'ជ្រើសរើសថ្ងៃផ្ទាល់...' : 'Custom Date...' }
              ].map((p) => {
                const active = datePreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '6px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)',
                      backgroundColor: active ? 'var(--color-primary)' : '#ffffff',
                      color: active ? '#ffffff' : 'var(--color-text-main)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Custom Date Pickers */}
            {datePreset === 'custom' && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{isKm ? 'ចាប់ពីថ្ងៃ:' : 'From:'}</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '100%', height: '34px', fontSize: '0.82rem' }}
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>{isKm ? 'រហូតដល់ថ្ងៃ:' : 'To:'}</span>
                  <input
                    type="date"
                    className="form-input"
                    style={{ width: '100%', height: '34px', fontSize: '0.82rem' }}
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 2. Order Status Pills */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px', color: 'var(--color-text-main)' }}>
              <Filter size={15} color="var(--color-primary)" />
              <span>{isKm ? 'ស្ថានភាពការកុម្ម៉ង់ (Order Status)' : 'Order Status'}:</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '5px' }}>
              {statusOptions.map((opt) => {
                const active = statusFilter === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setStatusFilter(opt.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '6px 4px',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      border: active ? '1.5px solid var(--color-primary)' : '1px solid #cbd5e1',
                      backgroundColor: active ? 'var(--color-primary)' : '#ffffff',
                      color: active ? '#ffffff' : 'var(--color-text-main)',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {Icon && <Icon size={12} color={active ? '#ffffff' : opt.color} />}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Payment Method & Search Bar Row */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
                {isKm ? 'មធ្យោបាយទូទាត់:' : 'Payment Method:'}
              </label>
              <div style={{ display: 'flex', gap: '5px' }}>
                {[
                  { id: 'all', label: isKm ? 'ទាំងអស់' : 'All' },
                  { id: 'cash', label: isKm ? '💵 សាច់ប្រាក់' : '💵 Cash' },
                  { id: 'khqr', label: isKm ? '📱 KHQR' : '📱 KHQR' }
                ].map((p) => {
                  const active = paymentFilter === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPaymentFilter(p.id)}
                      style={{
                        flex: 1,
                        padding: '5px 8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        border: active ? '1.5px solid var(--color-primary)' : '1px solid #cbd5e1',
                        backgroundColor: active ? 'rgba(136, 19, 55, 0.08)' : '#ffffff',
                        color: active ? 'var(--color-primary)' : '#475569'
                      }}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ flex: 1, minWidth: '220px' }}>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '4px', color: '#475569' }}>
                {isKm ? 'ស្វែងរក (លេខកូដ / ឈ្មោះ / ទូរស័ព្ទ):' : 'Search (ID / Name / Phone):'}
              </label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '100%', height: '32px', paddingLeft: '32px', fontSize: '0.82rem' }}
                  placeholder={isKm ? 'វាយពាក្យស្វែងរក...' : 'Filter keyword...'}
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Filtered Table Preview Header with Checkbox Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#334155'
              }}
            >
              {selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? (
                <CheckSquare size={15} color="var(--color-primary)" />
              ) : (
                <Square size={15} color="#94a3b8" />
              )}
              <span>{selectedOrderIds.size === filteredOrders.length && filteredOrders.length > 0 ? (isKm ? 'ដកការជ្រើសទាំងអស់' : 'Deselect All') : (isKm ? 'ជ្រើសទាំងអស់' : 'Select All')}</span>
            </button>

            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0f172a' }}>
              {isKm ? `បានជ្រើសរើស ` : `Selected `}
              <span style={{ color: 'var(--color-primary)', fontSize: '0.95rem' }}>{ordersToPrint.length}</span>
              {isKm ? ` នៃ ` : ` of `}
              <span>{filteredOrders.length}</span>
              {isKm ? ` ការកុម្ម៉ង់` : ` orders`}
            </span>
          </div>

          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--color-primary)' }}>
            {isKm ? 'ចំណូលត្រូវបោះពុម្ព៖ ' : 'Total: '}
            ${reportTotals.totalUSD.toFixed(2)} ({reportTotals.totalKHR.toLocaleString()} ៛)
          </div>
        </div>

        {/* Live Filtered Table Preview with Individual Row Checkboxes */}
        <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#881337', color: '#ffffff', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px' }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && selectedOrderIds.size === filteredOrders.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                    title={isKm ? 'ជ្រើសទាំងអស់' : 'Select All'}
                  />
                </th>
                <th style={{ padding: '8px 6px', textAlign: 'left', width: '85px' }}>{isKm ? 'លេខកូដ' : 'Order ID'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>{isKm ? 'អតិថិជន & ទូរស័ព្ទ' : 'Customer'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>{isKm ? 'មុខម្ហូប' : 'Items'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '90px' }}>{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'right', width: '85px' }}>{isKm ? 'តម្លៃ' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((o, idx) => {
                  const id = String(o.id || o.order_id || o._id);
                  const isChecked = selectedOrderIds.has(id);
                  const cust = o.customer?.name || o.customerName || o.customer_name || (isKm ? 'អតិថិជនទូទៅ' : 'Guest');
                  const phone = o.customer?.phone || o.phone || o.customer_phone || '';
                  const count = o.items?.length || 0;
                  const amt = Number(o.total_usd || o.total || 0).toFixed(2);
                  const st = o.status || o.order_status || 'pending';
                  return (
                    <tr
                      key={id}
                      onClick={() => toggleOrderSelection(id)}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                        backgroundColor: isChecked ? 'rgba(136, 19, 55, 0.04)' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOrderSelection(id)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px' }}
                        />
                      </td>
                      <td style={{ padding: '6px', fontWeight: 700, color: '#881337', fontFamily: 'monospace' }}>#{id.slice(-6).toUpperCase()}</td>
                      <td style={{ padding: '6px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cust}</div>
                        {phone && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{phone}</div>}
                      </td>
                      <td style={{ padding: '6px', color: '#475569' }}>{count} {isKm ? 'មុខម្ហូប' : 'items'}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <span style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700, backgroundColor: st === 'completed' ? '#dcfce7' : st === 'cancelled' ? '#fee2e2' : '#fef3c7', color: st === 'completed' ? '#15803d' : st === 'cancelled' ? '#b91c1c' : '#b45309' }}>
                          {st}
                        </span>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700 }}>${amt}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    {isKm ? 'មិនមានទិន្នន័យស្របតាមតម្រងនេះទេ' : 'No records match active filter.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
          <Button variant="ghost" onClick={onClose}>
            {isKm ? 'បោះបង់ (Cancel)' : 'Cancel'}
          </Button>
          <Button
            variant="primary"
            onClick={handlePrint}
            disabled={ordersToPrint.length === 0}
            icon={<Printer size={16} />}
          >
            {isKm ? `🖨️ បោះពុម្ព ${ordersToPrint.length} ការកុម្ម៉ង់ដែលបានរើស` : `🖨️ Print Selected (${ordersToPrint.length} orders)`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
