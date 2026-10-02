import React, { useState } from 'react';
import { Image, ZoomIn } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { GALLERY_ITEMS } from '../data/gallery';
import { Modal } from '../components/common/Modal';

export const Gallery = () => {
  const { t, language } = useLanguage();
  const isKm = language === 'km';

  const [activeTab, setActiveTab] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const tabs = [
    { id: 'all', label: t('gallery.tab_all') },
    { id: 'food', label: t('gallery.tab_food') },
    { id: 'ambience', label: t('gallery.tab_ambience') },
    { id: 'kitchen', label: t('gallery.tab_kitchen') },
    { id: 'events', label: t('gallery.tab_events') }
  ];

  const filteredItems = activeTab === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter((item) => item.category === activeTab);

  return (
    <div className="gallery-page">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">
              <Image size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {t('nav.gallery')}
            </span>
            <h1 className="section__title">{t('gallery.title')}</h1>
            <p className="section__subtitle">{t('gallery.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        {/* Category Tabs */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: 'var(--space-2xl)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={`btn btn--sm ${activeTab === tab.id ? 'btn--primary' : 'btn--outline'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="gallery-grid">
          {filteredItems.map((item) => {
            const title = isKm ? item.title_km : item.title_en;
            return (
              <div
                key={item.id}
                className="gallery-card"
                onClick={() => setSelectedPhoto(item)}
              >
                <img
                  src={item.image}
                  alt={title}
                  loading="lazy"
                  className="gallery-card__img"
                />
                <div className="gallery-card__overlay">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{title}</span>
                    <ZoomIn size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedPhoto && (
        <Modal
          isOpen={!!selectedPhoto}
          onClose={() => setSelectedPhoto(null)}
          title={isKm ? selectedPhoto.title_km : selectedPhoto.title_en}
          maxWidth="750px"
        >
          <img
            src={selectedPhoto.image}
            alt={isKm ? selectedPhoto.title_km : selectedPhoto.title_en}
            style={{ width: '100%', borderRadius: 'var(--radius-md)', maxHeight: '70vh', objectFit: 'contain' }}
          />
        </Modal>
      )}
    </div>
  );
};
