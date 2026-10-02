import React, { useState } from 'react';
import { CalendarCheck, Eye } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';

export const AdminReservations = () => {
  const { t, language } = useLanguage();
  const { reservations, updateReservationStatus } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [selectedRes, setSelectedRes] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredReservations = statusFilter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === statusFilter);

  const handleStatusChange = (resId, newStatus) => {
    updateReservationStatus(resId, newStatus);
    showToast(isKm ? 'បានផ្លាស់ប្តូរស្ថានភាពការកក់តុ!' : 'Reservation status updated!', 'success');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'confirmed':
        return <Badge variant="success">{t('admin.status_confirmed')}</Badge>;
      case 'seated':
        return <Badge variant="info">{t('admin.status_seated')}</Badge>;
      case 'cancelled':
        return <Badge variant="danger">{t('admin.status_cancelled')}</Badge>;
      default:
        return <Badge variant="gold">{t('admin.status_pending')}</Badge>;
    }
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_reservations')}</h1>
        <select
          className="form-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ width: 'auto', fontSize: '0.85rem' }}
        >
          <option value="all">All Bookings</option>
          <option value="pending">{t('admin.status_pending')}</option>
          <option value="confirmed">{t('admin.status_confirmed')}</option>
          <option value="seated">{t('admin.status_seated')}</option>
          <option value="cancelled">{t('admin.status_cancelled')}</option>
        </select>
      </div>

      <div className="admin-content">
        <div className="admin-card">
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Guest Name</th>
                  <th>Contact</th>
                  <th>Date & Time</th>
                  <th>Party Size</th>
                  <th>Seating</th>
                  <th>{t('admin.status')}</th>
                  <th>Update</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.map((res) => (
                  <tr key={res.id}>
                    <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                      {res.id}
                    </td>
                    <td style={{ fontWeight: 600 }}>{res.name}</td>
                    <td>
                      <div>{res.phone}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{res.email}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{res.date}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{res.time}</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>
                        {t(`reservations.guest_options.${res.guests}`)}
                      </span>
                    </td>
                    <td>
                      <span className="badge badge--info">
                        {t(`reservations.${res.seating}`)}
                      </span>
                    </td>
                    <td>{getStatusBadge(res.status)}</td>
                    <td>
                      <select
                        className="form-select"
                        value={res.status}
                        onChange={(e) => handleStatusChange(res.id, e.target.value)}
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                      >
                        <option value="pending">{t('admin.status_pending')}</option>
                        <option value="confirmed">{t('admin.status_confirmed')}</option>
                        <option value="seated">{t('admin.status_seated')}</option>
                        <option value="cancelled">{t('admin.status_cancelled')}</option>
                      </select>
                    </td>
                    <td>
                      {res.specialRequests ? (
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => setSelectedRes(res)}
                          title="View Special Request"
                        >
                          <Eye size={16} />
                        </button>
                      ) : (
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.8rem' }}>None</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Special Request Modal */}
      {selectedRes && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`Booking Request: ${selectedRes.id}`}
        >
          <div>
            <p style={{ marginBottom: '8px' }}>
              <strong>Guest:</strong> {selectedRes.name} ({selectedRes.phone})
            </p>
            <p style={{ marginBottom: '8px' }}>
              <strong>Reservation:</strong> {selectedRes.date} at {selectedRes.time}
            </p>
            <div style={{ backgroundColor: 'var(--color-bg-subtle)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)', marginTop: '12px' }}>
              <strong>Special Note / Occasion:</strong>
              <p style={{ marginTop: '6px', fontStyle: 'italic', marginBottom: 0 }}>
                "{selectedRes.specialRequests}"
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
