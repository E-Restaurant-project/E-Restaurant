import React, { useState } from 'react';
import { Phone, Mail, MapPin, Send, MessageSquare, Clock } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';

export const Contact = () => {
  const { t, language } = useLanguage();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
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
    if (!formData.email.trim()) {
      errs.email = t('checkout.validation_required');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = t('checkout.validation_email');
    }
    if (!formData.message.trim()) errs.message = t('checkout.validation_required');

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      showToast(t('contact.send_success'), 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 500);
  };

  return (
    <div className="contact-page">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">{t('nav.contact')}</span>
            <h1 className="section__title">{t('contact.title')}</h1>
            <p className="section__subtitle">{t('contact.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        <div className="contact-grid">
          {/* Left: Contact Info */}
          <div className="contact-card">
            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-lg)' }}>
              {t('contact.get_in_touch')}
            </h3>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <MapPin size={22} />
              </div>
              <div>
                <h4 style={{ marginBottom: '2px' }}>{t('about.location_title')}</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>{t('about.address_text')}</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <Phone size={22} />
              </div>
              <div>
                <h4 style={{ marginBottom: '2px' }}>{t('contact.phone')}</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>023 999 888 / 012 345 678</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <Mail size={22} />
              </div>
              <div>
                <h4 style={{ marginBottom: '2px' }}>{t('contact.email')}</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>contact@phumyeung.com</p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-info-icon">
                <MessageSquare size={22} />
              </div>
              <div>
                <h4 style={{ marginBottom: '2px' }}>Social Channels</h4>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>
                  {t('contact.telegram')} | {t('contact.facebook')}
                </p>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-main)', fontWeight: 600 }}>
                <Clock size={18} color="var(--color-secondary-dark)" />
                <span>{t('about.hours_title')}</span>
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '4px', marginBottom: '2px' }}>{t('about.hours_weekdays')}</p>
              <p style={{ fontSize: '0.85rem', marginBottom: 0 }}>{t('about.hours_weekends')}</p>
            </div>
          </div>

          {/* Right: Message Form */}
          <form onSubmit={handleSubmit} className="contact-card">
            <h3 style={{ color: 'var(--color-primary-dark)', marginBottom: 'var(--space-lg)' }}>
              {t('contact.form_title')}
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label form-label--required">{t('contact.name')}</label>
                <input
                  type="text"
                  className={`form-input ${errors.name ? 'form-input--error' : ''}`}
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={isKm ? 'ឈ្មោះរបស់អ្នក' : 'Your Name'}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label className="form-label form-label--required">{t('checkout.email')}</label>
                <input
                  type="email"
                  className={`form-input ${errors.email ? 'form-input--error' : ''}`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="example@mail.com"
                />
                {errors.email && <span className="form-error">{errors.email}</span>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('contact.subject')}</label>
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder={isKm ? 'ប្រធានបទ...' : 'Subject...'}
              />
            </div>

            <div className="form-group">
              <label className="form-label form-label--required">{t('contact.message')}</label>
              <textarea
                rows={5}
                className={`form-textarea ${errors.message ? 'form-textarea--error' : ''}`}
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder={isKm ? 'សូមបញ្ចូលខ្លឹមសារសារ...' : 'Your message here...'}
              />
              {errors.message && <span className="form-error">{errors.message}</span>}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              type="submit"
              disabled={submitting}
              icon={<Send size={18} />}
            >
              {submitting ? t('checkout.submitting') : t('contact.send_btn')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
