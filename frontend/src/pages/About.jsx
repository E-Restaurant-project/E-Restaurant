import React from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Truck,
  Award,
  ShieldCheck,
  Star,
  Quote,
  Clock,
  Leaf,
  Heart,
  MapPin,
  Flame,
  Package,
  ChefHat
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/common/Button';
import { TESTIMONIALS } from '../data/gallery';

export const About = () => {
  const { t, language } = useLanguage();
  const isKm = language === 'km';

  return (
    <div className="about-page">
      {/* 1. Page Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">{t('nav.about')}</span>
            <h1 className="section__title">{t('about.title')}</h1>
            <p className="section__subtitle">{t('about.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* 2. Cloud Kitchen Heritage Story */}
      <section className="section">
        <div className="container">
          <div className="story-grid">
            <div className="story__image-wrap">
              <img
                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1000&q=80"
                alt="Phum Yeung Cloud Kitchen Hub"
                className="story__img"
                loading="lazy"
              />
              <div className="story__floating-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={24} color="var(--color-secondary)" />
                  <div>
                    <div style={{ fontWeight: 700 }}>100% Cloud Kitchen</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Cooked Fresh to Order</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="story__content">
              <span className="section__badge">{t('story.badge')}</span>
              <h2 className="section__title">{t('story.title')}</h2>
              <p>{t('story.desc1')}</p>
              <p>{t('story.desc2')}</p>

              <div className="story__features">
                <div className="story__feature-item">
                  <div className="story__feature-icon"><Leaf size={18} color="#16a34a" /></div>
                  <span>{t('story.feature_organic')}</span>
                </div>
                <div className="story__feature-item">
                  <div className="story__feature-icon"><Flame size={18} color="#dc2626" /></div>
                  <span>{t('story.feature_recipe')}</span>
                </div>
                <div className="story__feature-item">
                  <div className="story__feature-icon"><Package size={18} color="#b45309" /></div>
                  <span>{t('story.feature_packaging')}</span>
                </div>
                <div className="story__feature-item">
                  <div className="story__feature-icon"><ChefHat size={18} color="#881337" /></div>
                  <span>{t('story.feature_chef')}</span>
                </div>
              </div>

              <div style={{ marginTop: 'var(--space-xl)' }}>
                <Link to="/">
                  <Button variant="primary" icon={<Utensils size={18} />}>
                    {t('nav.menu')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Mission & Values */}
      <section className="section section--alt">
        <div className="container">
          <div style={{ backgroundColor: 'var(--color-bg-surface)', padding: 'var(--space-2xl)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)' }}>
            <h2 style={{ textAlign: 'center', marginBottom: 'var(--space-xl)', color: 'var(--color-primary-dark)', fontSize: '1.5rem', fontWeight: 800 }}>
              {t('about.mission_title')}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-xl)' }}>
              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-accent-subtle)', color: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Leaf size={24} />
                </div>
                <div>
                  <h4 style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>Organic & Local</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{t('about.mission_point1')}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-primary-subtle)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h4 style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>No Artificial Additives</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{t('about.mission_point2')}</p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--color-secondary-subtle)', color: 'var(--color-secondary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Heart size={24} />
                </div>
                <div>
                  <h4 style={{ marginBottom: '4px', fontSize: '1.05rem', fontWeight: 700 }}>Khmer Hospitality</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>{t('about.mission_point3')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Customer Testimonials */}
      <section className="section">
        <div className="container">
          <div className="section__header">
            <span className="section__badge">{t('testimonials.badge')}</span>
            <h2 className="section__title">{t('testimonials.title')}</h2>
            <p className="section__subtitle">{t('testimonials.subtitle')}</p>
          </div>

          <div className="testimonials-grid">
            {TESTIMONIALS.map((item) => (
              <div key={item.id} className="card testimonial-card">
                <div style={{ color: 'var(--color-secondary)', marginBottom: 'var(--space-xs)' }}>
                  <Quote size={28} />
                </div>
                <p className="testimonial-card__quote">
                  "{isKm ? item.comment_km : item.comment_en}"
                </p>
                <div style={{ display: 'flex', gap: '2px', marginBottom: 'var(--space-sm)' }}>
                  {[...Array(item.rating)].map((_, i) => (
                    <Star key={i} size={16} fill="#c59b27" color="#c59b27" />
                  ))}
                </div>
                <div className="testimonial-card__author">
                  <img
                    src={item.avatar}
                    alt={isKm ? item.name_km : item.name_en}
                    className="testimonial-card__avatar"
                    loading="lazy"
                  />
                  <div>
                    <div className="testimonial-card__name">
                      {isKm ? item.name_km : item.name_en}
                    </div>
                    <div className="testimonial-card__role">
                      {isKm ? item.role_km : item.role_en}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Location & Hours with Map */}
      <section className="section section--alt">
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-2xl)', alignItems: 'center' }}>
            <div>
              <span className="section__badge">{t('about.location_title')}</span>
              <h2 className="section__title" style={{ fontSize: '1.4rem', marginBottom: 'var(--space-md)' }}>
                {t('about.address_text')}
              </h2>

              <div style={{ margin: 'var(--space-lg) 0' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-sm)', color: 'var(--color-primary)' }}>
                  <Clock size={20} />
                  <span>{t('about.hours_title')}</span>
                </h3>
                <p style={{ marginBottom: '6px', color: 'var(--color-text-main)' }}>{t('about.hours_weekdays')}</p>
                <p style={{ color: 'var(--color-text-main)' }}>{t('about.hours_weekends')}</p>
                <p style={{ marginTop: '8px', color: 'var(--color-secondary-dark)', fontWeight: 600 }}>
                  Express delivery within 20 - 35 mins
                </p>
              </div>
            </div>

            <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid var(--color-border)', height: '340px' }}>
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
      </section>

      {/* 6. Call To Action Banner */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta-banner">
            <h2 className="cta-banner__title">{t('cta.title')}</h2>
            <p className="cta-banner__desc">{t('cta.description')}</p>
            <div className="cta-banner__actions">
              <Link to="/">
                <Button variant="secondary" size="lg" icon={<Utensils size={18} />}>
                  {t('cta.order_now')}
                </Button>
              </Link>
              <Link to="/track-order">
                <Button variant="outline" size="lg" style={{ borderColor: '#fff', color: '#fff' }} icon={<Truck size={18} />}>
                  {t('cta.track_order')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
