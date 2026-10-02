import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  CalendarCheck,
  Sparkles,
  Phone,
  Mail,
  User
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';

export const Reservations = () => {
  const { t, language } = useLanguage();
  const { createReservation } = useRestaurant();
  const { showToast } = useToast();

  const isKm = language === 'km';

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    date: new Date().toISOString().split('T')[0],
    time: '18:30',
    guests: '2',
    seating: 'seating_indoor',
    specialRequests: ''
  });

  const [errors, setErrors] = useState({});
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = t('checkout.validation_required');
    if (!formData.phone.trim()) {
      errs.phone = t('checkout.validation_required');
    } else if (!/^[0-9+ \-\(\)]{8,15}$/.test(formData.phone.trim())) {
      errs.phone = t('checkout.validation_phone');
    }
    if (!formData.date) errs.date = t('checkout.validation_required');
    if (!formData.time) errs.time = t('checkout.validation_required');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      const newRes = createReservation(formData);
      setConfirmedBooking(newRes);
      setSubmitting(false);
      showToast(t('reservations.success_title'), 'success');
    }, 500);
  };

  if (confirmedBooking) {
    return (
      <div className="section">
        <div className="container">
          <div className="confirmation-card">
            <div className="confirmation-card__icon">
              <CheckCircle2 size={44} />
            </div>
            <h2>{t('reservations.success_title')}</h2>
            <p style={{ color: 'var(--color-text-muted)' }}>{t('reservations.success_desc')}</p>

            <div style={{ margin: 'var(--space-md) 0' }}>
              <span style={{ fontWeight: 600 }}>{t('reservations.booking_ref')} </span>
              <strong style={{ color: 'var(--color-primary)', fontSize: '1.2rem' }}>
                {confirmedBooking.id}
              </strong>
            </div>

            <div className="confirmation-receipt">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.name')}:</span>
                <strong>{confirmedBooking.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.phone')}:</span>
                <strong>{confirmedBooking.phone}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.date')}:</span>
                <strong>{confirmedBooking.date}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.time')}:</span>
                <strong>{confirmedBooking.time}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.guests')}:</span>
                <strong>{t(`reservations.guest_options.${confirmedBooking.guests}`)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>{t('reservations.seating')}:</span>
                <strong>{t(`reservations.${confirmedBooking.seating}`)}</strong>
              </div>
              {confirmedBooking.specialRequests && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span>{t('reservations.special_requests')}:</span>
                  <em>"{confirmedBooking.specialRequests}"</em>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Button
                variant="outline"
                onClick={() => setConfirmedBooking(null)}
              >
                {t('reservations.new_booking')}
              </Button>
              <Link to="/">
                <Button variant="primary">{t('checkout.back_home')}</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="reservations-page">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">
              <CalendarCheck size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {t('nav.reservations')}
            </span>
            <h1 className="section__title">{t('reservations.title')}</h1>
            <p className="section__subtitle">{t('reservations.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <form onSubmit={handleSubmit} className="card" style={{ padding: 'var(--space-2xl)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Name */}
              <div className="form-group">
                <label className="form-label form-label--required">{t('reservations.name')}</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder={isKm ? 'ឈ្មោះរបស់អ្នក' : 'Your name'}
                  />
                </div>
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              {/* Phone */}
              <div className="form-group">
                <label className="form-label form-label--required">{t('reservations.phone')}</label>
                <input
                  type="tel"
                  className={`form-input ${errors.phone ? 'form-input--error' : ''}`}
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="012 345 678"
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label className="form-label">{t('reservations.email')}</label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="example@mail.com"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-md)' }}>
              {/* Date */}
              <div className="form-group">
                <label className="form-label form-label--required">{t('reservations.date')}</label>
                <input
                  type="date"
                  className={`form-input ${errors.date ? 'form-input--error' : ''}`}
                  value={formData.date}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                />
                {errors.date && <span className="form-error">{errors.date}</span>}
              </div>

              {/* Time */}
              <div className="form-group">
                <label className="form-label form-label--required">{t('reservations.time')}</label>
                <input
                  type="time"
                  className={`form-input ${errors.time ? 'form-input--error' : ''}`}
                  value={formData.time}
                  onChange={(e) => handleInputChange('time', e.target.value)}
                />
                {errors.time && <span className="form-error">{errors.time}</span>}
              </div>

              {/* Party Size */}
              <div className="form-group">
                <label className="form-label">{t('reservations.guests')}</label>
                <select
                  className="form-select"
                  value={formData.guests}
                  onChange={(e) => handleInputChange('guests', e.target.value)}
                >
                  <option value="1">{t('reservations.guest_options.1')}</option>
                  <option value="2">{t('reservations.guest_options.2')}</option>
                  <option value="3_4">{t('reservations.guest_options.3_4')}</option>
                  <option value="5_8">{t('reservations.guest_options.5_8')}</option>
                  <option value="large">{t('reservations.guest_options.large')}</option>
                </select>
              </div>
            </div>

            {/* Seating preference */}
            <div className="form-group">
              <label className="form-label">{t('reservations.seating')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                {['seating_indoor', 'seating_garden', 'seating_vip'].map((seatKey) => (
                  <button
                    key={seatKey}
                    type="button"
                    className={`btn btn--sm ${formData.seating === seatKey ? 'btn--primary' : 'btn--outline'}`}
                    onClick={() => handleInputChange('seating', seatKey)}
                    style={{ whiteSpace: 'normal', height: 'auto', padding: '10px 8px' }}
                  >
                    {t(`reservations.${seatKey}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Special Requests */}
            <div className="form-group">
              <label className="form-label">{t('reservations.special_requests')}</label>
              <textarea
                rows={3}
                className="form-textarea"
                value={formData.specialRequests}
                onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                placeholder={isKm ? 'ឧ. ខួបកំណើត, តុជ្រុងស្ងប់ស្ងាត់...' : 'e.g. Birthday celebration, quiet corner...'}
              />
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={submitting}
              icon={<CalendarCheck size={18} />}
            >
              {submitting ? t('checkout.submitting') : t('reservations.book_btn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
