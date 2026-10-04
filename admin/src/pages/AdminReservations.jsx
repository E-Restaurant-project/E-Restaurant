import React, { useState, useMemo } from 'react';
import { CalendarCheck, Eye, Clock, CheckCircle2, Utensils, XCircle, Search, User, Phone, Calendar } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Modal } from '../components/common/Modal';
import { ReservationStatusDropdown, RESERVATION_STATUS_CONFIG } from '../components/admin/ReservationStatusDropdown';

export const AdminReservations = () => {
  const { t, language } = useLanguage();
  const { reservations, updateReservationStatus } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [selectedRes, setSelectedRes] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Status counts
  const statusCounts = useMemo(() => {
    const counts = { all: reservations.length, pending: 0, confirmed: 0, seated: 0, cancelled: 0 };
    reservations.forEach((r) => {
      if (counts[r.status] !== undefined) {
        counts[r.status]++;
      }
    });
    return counts;
  }, [reservations]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchId = (r.id || '').toLowerCase().includes(q);
        const matchName = (r.name || '').toLowerCase().includes(q);
        const matchPhone = (r.phone || '').includes(q);
        if (!matchId && !matchName && !matchPhone) return false;
      }
      return true;
    });
  }, [reservations, statusFilter, searchQuery]);

  const handleStatusChange = (resId, newStatus) => {
    updateReservationStatus(resId, newStatus);
    const cfg = RESERVATION_STATUS_CONFIG[newStatus];
    const label = isKm ? cfg?.label_km || newStatus : cfg?.label_en || newStatus;
    showToast(isKm ? `បានផ្លាស់ប្តូរស្ថានភាពការកក់ទៅជា "${label}"!` : `Reservation status updated to "${label}"!`, 'success');
  };

  const filterTabs = [
    { id: 'all', label: isKm ? 'ទាំងអស់' : 'All', count: statusCounts.all, icon: null },
    { id: 'pending', label: isKm ? 'កំពុងរង់ចាំ' : 'Pending', count: statusCounts.pending, icon: Clock, color: '#f59e0b' },
    { id: 'confirmed', label: isKm ? 'បានបញ្ជាក់' : 'Confirmed', count: statusCounts.confirmed, icon: CheckCircle2, color: '#3b82f6' },
    { id: 'seated', label: isKm ? 'បានមកដល់' : 'Seated', count: statusCounts.seated, icon: Utensils, color: '#22c55e' },
    { id: 'cancelled', label: isKm ? 'បានបោះបង់' : 'Cancelled', count: statusCounts.cancelled, icon: XCircle, color: '#ef4444' }
  ];

  return (
    <div>
      <div className="admin-topbar">
        <div>
          <h1 className="admin-topbar__title">{t('admin.nav_reservations')}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
            {isKm ? 'គ្រប់គ្រងការកក់តុរបស់ភ្ញៀវ និងស្ថានភាពតុ' : 'Manage table bookings and guest attendance'}
          </p>
        </div>
      </div>

      <div className="admin-content">
        {/* Quick Filter Tabs */}
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
                  whiteSpace: 'nowrap'
                }}
              >
                {Icon && <Icon size={15} style={{ color: isActive ? '#ffffff' : tab.color }} />}
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
          {/* Search Controls */}
          <div className="admin-card__header">
            <div style={{ position: 'relative', minWidth: '280px', maxWidth: '420px', flex: 1 }}>
              <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
              <input
                type="text"
                className="form-input"
                placeholder={isKm ? 'ស្វែងរកតាមលេខកូដ, ឈ្មោះភ្ញៀវ, លេខទូរស័ព្ទ...' : 'Search by Booking ID, guest, or phone...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '36px', height: '44px', fontSize: '0.88rem', borderRadius: '12px' }}
              />
            </div>
            <div style={{ fontSize: '0.88rem', color: 'var(--color-text-muted)' }}>
              {isKm ? 'ចំនួនការកក់៖' : 'Matching Bookings:'} <strong>{filteredReservations.length}</strong>
            </div>
          </div>

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
                  <th style={{ minWidth: '175px' }}>{isKm ? 'ស្ថានភាព (ចុចប្តូរ)' : 'Status (Click to change)'}</th>
                  <th>Requests</th>
                </tr>
              </thead>
              <tbody>
                {filteredReservations.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
                      <CalendarCheck size={42} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.3 }} />
                      <div style={{ fontWeight: 600 }}>{isKm ? 'មិនមានការកក់តុទេ' : 'No reservations found'}</div>
                    </td>
                  </tr>
                ) : (
                  filteredReservations.map((res) => (
                    <tr key={res.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                        {res.id}
                      </td>
                      <td style={{ fontWeight: 600 }}>{res.name}</td>
                      <td>
                        <div>
                          <a href={`tel:${res.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {res.phone}
                          </a>
                        </div>
                        {res.email && <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{res.email}</div>}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{res.date}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{res.time}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {t(`reservations.guest_options.${res.guests}`) || `${res.guests} Guests`}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge--info">
                          {t(`reservations.${res.seating}`) || res.seating}
                        </span>
                      </td>
                      <td>
                        <ReservationStatusDropdown
                          status={res.status}
                          onChange={(newStatus) => handleStatusChange(res.id, newStatus)}
                        />
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Special Requests Modal */}
      {selectedRes && (
        <Modal
          isOpen={!!selectedRes}
          onClose={() => setSelectedRes(null)}
          title={`Booking: ${selectedRes.id}`}
        >
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <strong>Guest:</strong> {selectedRes.name} ({selectedRes.phone})
              </div>
              <ReservationStatusDropdown
                status={selectedRes.status}
                onChange={(newStatus) => {
                  handleStatusChange(selectedRes.id, newStatus);
                  setSelectedRes((prev) => ({ ...prev, status: newStatus }));
                }}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Date & Time:</strong> {selectedRes.date} at {selectedRes.time}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Party Size:</strong> {t(`reservations.guest_options.${selectedRes.guests}`)}
            </div>
            <div style={{ padding: '12px 14px', backgroundColor: '#fffbeb', border: '1px solid #fef3c7', borderRadius: '10px' }}>
              <strong>Special Request:</strong>
              <p style={{ margin: '6px 0 0 0', fontStyle: 'italic' }}>
                "{selectedRes.specialRequests}"
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
