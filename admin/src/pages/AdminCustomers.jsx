import React, { useState } from 'react';
import { Users, Search, ShoppingBag, Eye, Phone, Mail, MapPin } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AdminCustomers = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const { customers } = useRestaurant();
  const isKm = language === 'km';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const filteredCustomers = customers.filter((cust) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      cust.name.toLowerCase().includes(q) ||
      cust.phone.includes(q) ||
      (cust.email && cust.email.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_customers')}</h1>
        <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          Total Customers: <strong>{customers.length}</strong>
        </div>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-card__header">
            <div style={{ position: 'relative', minWidth: '260px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by customer name or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '32px', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t('admin.customer_name')}</th>
                  <th>{t('admin.customer_phone')}</th>
                  <th>Email</th>
                  <th>{t('admin.customer_orders_count')}</th>
                  <th>{t('admin.customer_total_spent')}</th>
                  <th>{t('admin.customer_last_order')}</th>
                  <th>{t('admin.action')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                          {cust.name.charAt(0)}
                        </div>
                        <strong style={{ color: 'var(--color-text-main)' }}>{cust.name}</strong>
                      </div>
                    </td>
                    <td>{cust.phone}</td>
                    <td>{cust.email || 'N/A'}</td>
                    <td>
                      <span className="badge badge--gold">
                        <ShoppingBag size={12} />
                        <span>{cust.ordersCount} Orders</span>
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {formatCurrency(cust.totalSpent)}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {new Date(cust.lastOrderDate).toLocaleDateString()}
                    </td>
                    <td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCustomer(cust)}
                        icon={<Eye size={14} />}
                      >
                        History
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <Modal
          isOpen={!!selectedCustomer}
          onClose={() => setSelectedCustomer(null)}
          title={`Customer: ${selectedCustomer.name}`}
          maxWidth="640px"
        >
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px', backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-md)', marginBottom: 'var(--space-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Phone Number:</div>
                <div style={{ fontWeight: 600 }}>{selectedCustomer.phone}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Total Money Spent:</div>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {formatCurrency(selectedCustomer.totalSpent)}
                </div>
              </div>
            </div>

            <h4 style={{ marginBottom: '10px' }}>
              Order History ({selectedCustomer.orders.length}):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '350px', overflowY: 'auto' }}>
              {selectedCustomer.orders.map((ord) => (
                <div
                  key={ord.id}
                  style={{
                    padding: '12px',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#fff'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ color: 'var(--color-primary)' }}>{ord.id}</strong>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                      {new Date(ord.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                    Items ({ord.items?.length}): {ord.items?.map((it) => `${it.quantity}x ${it.name_en}`).join(', ')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <span style={{ fontWeight: 700 }}>Total: {formatCurrency(ord.total)}</span>
                    <Badge variant={ord.status === 'completed' ? 'success' : 'gold'}>
                      {ord.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
