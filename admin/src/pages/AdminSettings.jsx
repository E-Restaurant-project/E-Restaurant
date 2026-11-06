import React, { useState } from 'react';
import { Settings, Save, AlertCircle, Megaphone, DollarSign, Power } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useToast } from '../hooks/useToast';
import { Button } from '../components/common/Button';

export const AdminSettings = () => {
  const { t, language } = useLanguage();
  const { storeSettings, updateStoreSettings, promoCodes = [] } = useRestaurant();
  const { showToast } = useToast();
  const isKm = language === 'km';

  const [settings, setSettings] = useState({
    isOpen: storeSettings.isOpen ?? true,
    standardDeliveryFee: storeSettings.standardDeliveryFee ?? 1.50,
    freeDeliveryThreshold: storeSettings.freeDeliveryThreshold ?? 25.00,
    khrRate: storeSettings.khrRate ?? 4100,
    announcement: {
      active: storeSettings.announcement?.active ?? true,
      text_km: storeSettings.announcement?.text_km ?? '',
      text_en: storeSettings.announcement?.text_en ?? ''
    }
  });

  const handleChange = (field, val) => {
    setSettings((prev) => ({ ...prev, [field]: val }));
  };

  const handleAnnouncementChange = (field, val) => {
    setSettings((prev) => ({
      ...prev,
      announcement: {
        ...prev.announcement,
        [field]: val
      }
    }));
  };

  const handleSave = (e) => {
    e.preventDefault();
    updateStoreSettings({
      ...settings,
      standardDeliveryFee: Number(settings.standardDeliveryFee),
      freeDeliveryThreshold: Number(settings.freeDeliveryThreshold),
      khrRate: Number(settings.khrRate)
    });
    showToast(t('admin.settings_saved'), 'success');
  };

  return (
    <div>
      <div className="admin-topbar">
        <h1 className="admin-topbar__title">{t('admin.nav_settings')}</h1>
      </div>

      <div className="admin-content">
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <form onSubmit={handleSave} className="admin-card" style={{ padding: 'var(--space-2xl)' }}>
            {/* 1. Kitchen Status */}
            <div style={{ paddingBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Power size={20} color={settings.isOpen ? 'var(--color-accent)' : 'var(--color-danger)'} />
                <h3 style={{ color: 'var(--color-primary-dark)' }}>{t('admin.settings_store_status')}</h3>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button
                  type="button"
                  className={`btn ${settings.isOpen ? 'btn--primary' : 'btn--outline'}`}
                  onClick={() => handleChange('isOpen', true)}
                >
                  🟢 {t('admin.settings_store_open')}
                </button>
                <button
                  type="button"
                  className={`btn ${!settings.isOpen ? 'btn--danger' : 'btn--outline'}`}
                  onClick={() => handleChange('isOpen', false)}
                >
                  🔴 {t('admin.settings_store_closed')}
                </button>
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
                When closed, customers can browse menus but cannot submit new checkout orders.
              </div>
            </div>

            {/* 2. Delivery & Currency Pricing */}
            <div style={{ paddingBottom: 'var(--space-lg)', borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <DollarSign size={20} color="var(--color-secondary)" />
                <h3 style={{ color: 'var(--color-primary-dark)' }}>Pricing & Delivery Logistics</h3>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">{t('admin.settings_delivery_fee')}</label>
                  <input
                    type="number"
                    step="0.25"
                    className="form-input"
                    value={settings.standardDeliveryFee}
                    onChange={(e) => handleChange('standardDeliveryFee', e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">{t('admin.settings_free_delivery_over')}</label>
                  <input
                    type="number"
                    step="1"
                    className="form-input"
                    value={settings.freeDeliveryThreshold}
                    onChange={(e) => handleChange('freeDeliveryThreshold', e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group" style={{ maxWidth: '300px' }}>
                <label className="form-label">{t('admin.settings_exchange_rate')}</label>
                <input
                  type="number"
                  step="50"
                  className="form-input"
                  value={settings.khrRate}
                  onChange={(e) => handleChange('khrRate', e.target.value)}
                />
              </div>
            </div>

            {/* 3. Announcement Banner */}
            <div style={{ marginBottom: 'var(--space-2xl)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <Megaphone size={20} color="var(--color-primary)" />
                <h3 style={{ color: 'var(--color-primary-dark)' }}>Live Announcement Banner</h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-md)' }}>
                <input
                  type="checkbox"
                  id="banner_toggle"
                  checked={settings.announcement.active}
                  onChange={(e) => handleAnnouncementChange('active', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--color-primary, #881337)' }}
                />
                <label htmlFor="banner_toggle" style={{ fontWeight: 600, cursor: 'pointer' }}>
                  {t('admin.settings_banner_active')}
                </label>
              </div>

              <div className="form-group">
                <label className="form-label">{t('admin.settings_banner_text_km')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcement.text_km}
                  onChange={(e) => handleAnnouncementChange('text_km', e.target.value)}
                  placeholder="សារជូនដំណឹងជាភាសាខ្មែរ..."
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('admin.settings_banner_text_en')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.announcement.text_en}
                  onChange={(e) => handleAnnouncementChange('text_en', e.target.value)}
                  placeholder="Announcement text in English..."
                />
              </div>
            </div>

            <Button variant="primary" size="lg" type="submit" icon={<Save size={18} />}>
              {t('common.save')}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
