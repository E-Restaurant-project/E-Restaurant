import React, { useState, useMemo, useEffect } from 'react';
import {
  Printer,
  CheckSquare,
  Square,
  FileSpreadsheet
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { useLanguage } from '../../hooks/useLanguage';
import { printOrdersReport, exportOrdersReportToExcel } from '../../utils/printReport';

export const PrintReportModal = ({
  isOpen,
  onClose,
  orders = [],
  adminUser = null,
  preSelectedOrderIds = []
}) => {
  const { language } = useLanguage();
  const isKm = language === 'km';

  // Selected Order IDs Set for Specific Item Selection
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());

  // Automatically update selectedOrderIds when modal opens or orders / preSelectedOrderIds change
  useEffect(() => {
    if (!isOpen) return;
    if (preSelectedOrderIds && preSelectedOrderIds.length > 0) {
      setSelectedOrderIds(new Set(preSelectedOrderIds.map(String)));
    } else {
      setSelectedOrderIds(new Set(orders.map((o) => String(o.id || o.order_id || o._id))));
    }
  }, [isOpen, orders, preSelectedOrderIds]);

  // Toggle single order selection
  const toggleOrderSelection = (id) => {
    const sId = String(id);
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(sId)) {
        next.delete(sId);
      } else {
        next.add(sId);
      }
      return next;
    });
  };

  // Toggle select all matching orders
  const toggleSelectAll = () => {
    if (selectedOrderIds.size === orders.length && orders.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(orders.map((o) => String(o.id || o.order_id || o._id))));
    }
  };

  // Exactly selected orders to print
  const ordersToPrint = useMemo(() => {
    return orders.filter((o) => selectedOrderIds.has(String(o.id || o.order_id || o._id)));
  }, [orders, selectedOrderIds]);

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
        specificCount: ordersToPrint.length
      },
      adminUser,
      isKm
    });
    onClose();
  };

  const handleExportExcel = () => {
    exportOrdersReportToExcel({
      orders: ordersToPrint,
      filterMeta: {
        specificCount: ordersToPrint.length
      },
      adminUser,
      isKm
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isKm ? '🖨️ ជ្រើសរើសការកុម្ម៉ង់ដើម្បីបោះពុម្ព (Select Orders to Print)' : '🖨️ Select Orders to Print'}
      maxWidth="820px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Selection Toolbar Header with Checkbox Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', paddingBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={toggleSelectAll}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                color: '#334155',
                transition: 'all 0.15s ease'
              }}
            >
              {selectedOrderIds.size === orders.length && orders.length > 0 ? (
                <CheckSquare size={16} color="var(--color-primary, #881337)" />
              ) : (
                <Square size={16} color="#94a3b8" />
              )}
              <span>
                {selectedOrderIds.size === orders.length && orders.length > 0
                  ? (isKm ? 'ដកការជ្រើសទាំងអស់' : 'Deselect All')
                  : (isKm ? 'ជ្រើសទាំងអស់' : 'Select All')}
              </span>
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a' }}>
              {isKm ? `បានជ្រើសរើស ` : `Selected `}
              <span style={{ color: 'var(--color-primary, #881337)', fontSize: '0.98rem' }}>{ordersToPrint.length}</span>
              {isKm ? ` នៃ ` : ` of `}
              <span>{orders.length}</span>
              {isKm ? ` ការកុម្ម៉ង់` : ` orders`}
            </span>
          </div>

          <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--color-primary, #881337)' }}>
            {isKm ? 'ចំណូលសរុប៖ ' : 'Total: '}
            ${reportTotals.totalUSD.toFixed(2)} ({reportTotals.totalKHR.toLocaleString()} ៛)
          </div>
        </div>

        {/* Orders Table with Individual Row Checkboxes */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', border: '1.5px solid #e2e8f0', borderRadius: '8px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
            <thead style={{ position: 'sticky', top: 0, backgroundColor: '#881337', color: '#ffffff', zIndex: 10 }}>
              <tr>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '38px' }}>
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selectedOrderIds.size === orders.length}
                    onChange={toggleSelectAll}
                    style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#881337' }}
                    title={isKm ? 'ជ្រើសទាំងអស់' : 'Select All'}
                  />
                </th>
                <th style={{ padding: '8px 6px', textAlign: 'left', width: '95px' }}>{isKm ? 'លេខកូដ' : 'Order ID'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>{isKm ? 'អតិថិជន & ទូរស័ព្ទ' : 'Customer'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'left' }}>{isKm ? 'មុខម្ហូប' : 'Items'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'center', width: '95px' }}>{isKm ? 'ស្ថានភាព' : 'Status'}</th>
                <th style={{ padding: '8px 6px', textAlign: 'right', width: '90px' }}>{isKm ? 'តម្លៃ' : 'Total'}</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? (
                orders.map((o, idx) => {
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
                        backgroundColor: isChecked ? 'rgba(136, 19, 55, 0.05)' : idx % 2 === 0 ? '#ffffff' : '#fafafa',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '6px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleOrderSelection(id)}
                          style={{ cursor: 'pointer', width: '15px', height: '15px', accentColor: '#881337' }}
                        />
                      </td>
                      <td style={{ padding: '6px', fontWeight: 700, color: '#881337', fontFamily: 'monospace' }}>
                        #{id.startsWith('PY-ORD-') ? id : id.slice(-6).toUpperCase()}
                      </td>
                      <td style={{ padding: '6px' }}>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{cust}</div>
                        {phone && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{phone}</div>}
                      </td>
                      <td style={{ padding: '6px', color: '#475569' }}>{count} {isKm ? 'មុខម្ហូប' : 'items'}</td>
                      <td style={{ padding: '6px', textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          backgroundColor: st === 'completed' ? '#dcfce7' : st === 'cancelled' ? '#fee2e2' : '#fef3c7',
                          color: st === 'completed' ? '#15803d' : st === 'cancelled' ? '#b91c1c' : '#b45309'
                        }}>
                          {st === 'completed' ? (isKm ? 'បានប្រគល់' : 'Completed') :
                           st === 'preparing' ? (isKm ? 'កំពុងចម្អិន' : 'Cooking') :
                           st === 'delivering' ? (isKm ? 'កំពុងដឹក' : 'Delivering') :
                           st === 'cancelled' ? (isKm ? 'បានបោះបង់' : 'Cancelled') :
                           (isKm ? 'កំពុងរង់ចាំ' : 'Pending')}
                        </span>
                      </td>
                      <td style={{ padding: '6px', textAlign: 'right', fontWeight: 700, color: '#0f172a' }}>${amt}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                    {isKm ? 'មិនមានការកុម្ម៉ង់សម្រាប់ជ្រើសរើសទេ' : 'No orders available to select.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Action Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid #e2e8f0', flexWrap: 'wrap', gap: '8px' }}>
          <Button variant="ghost" onClick={onClose}>
            {isKm ? 'បោះបង់' : 'Cancel'}
          </Button>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="outline"
              onClick={handleExportExcel}
              disabled={ordersToPrint.length === 0}
              icon={<FileSpreadsheet size={16} color="#15803d" />}
              style={{
                borderColor: '#86efac',
                color: '#15803d',
                backgroundColor: '#f0fdf4',
                fontWeight: 700
              }}
            >
              {isKm ? `📊 នាំចេញជា Excel (${ordersToPrint.length})` : `📊 Export Excel (${ordersToPrint.length})`}
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              disabled={ordersToPrint.length === 0}
              icon={<Printer size={16} />}
            >
              {isKm ? `🖨️ បោះពុម្ព ${ordersToPrint.length} ការកុម្ម៉ង់` : `🖨️ Print Selected (${ordersToPrint.length})`}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
