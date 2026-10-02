import React from 'react';
import { MapPin, Clock, Heart, Award, ShieldCheck, Leaf } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

export const About = () => {
  const { t } = useLanguage();

  return (
    <div className="about-page">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">{t('nav.about')}</span>
            <h1 className="section__title">{t('about.title')}</h1>
            <p className="section__subtitle">{t('about.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        {/* Heritage Story */}
        <div className="story-grid" style={{ marginBottom: 'var(--space-3xl)' }}>
          <div>
            <span className="section__badge">{t('story.badge')}</span>
            <h2 className="section__title">{t('about.heritage_title')}</h2>
            <p>{t('about.heritage_desc1')}</p>
            <p>{t('about.heritage_desc2')}</p>
            <p>{t('story.desc2')}</p>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
              alt="Phum Yeung Heritage"
              style={{ borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)', width: '100%', aspectRatio: '4/3', objectFit: 'cover' }}
              loading="lazy"
            />
          </div>
        </div>

        {/* Mission Values */}
        <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-2xl)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-3xl)' }}>
          <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', color: 'var(--color-primary-dark)' }}>
            {t('about.mission_title')}
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Leaf size={24} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Organic & Local</h4>
                <p style={{ fontSize: '0.9rem' }}>{t('about.mission_point1')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ShieldCheck size={24} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>No Artificial Additives</h4>
                <p style={{ fontSize: '0.9rem' }}>{t('about.mission_point2')}</p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Heart size={24} />
              </div>
              <div>
                <h4 style={{ marginBottom: '4px' }}>Khmer Hospitality</h4>
                <p style={{ fontSize: '0.9rem' }}>{t('about.mission_point3')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Location & Map Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2xl)', alignItems: 'center' }}>
          <div>
            <span className="section__badge">{t('about.location_title')}</span>
            <h2 className="section__title">{t('about.address_text')}</h2>

            <div style={{ margin: 'var(--space-lg) 0' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
                <Clock size={20} />
                <span>{t('about.hours_title')}</span>
              </h3>
              <p style={{ marginBottom: '6px' }}>{t('about.hours_weekdays')}</p>
              <p>{t('about.hours_weekends')}</p>
            </div>
          </div>

          {/* Interactive Map Embed */}
          <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', height: '350px' }}>
            <iframe
              title="Phum Yeung Restaurant Location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3908.868779698544!2d104.9213192758652!3d11.539747944219468!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3109513dc76a6be3%3A0x9c2ee448512b9714!2sBoeung%20Keng%20Kang%20I%2C%20Phnom%20Penh!5e0!3m2!1sen!2skh!4v1710000000000!5m2!1sen!2skh"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
