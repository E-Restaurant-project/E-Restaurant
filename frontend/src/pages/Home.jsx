import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Utensils,
  Truck,
  Award,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Star,
  Quote,
  Clock,
  Package,
  ChevronLeft,
  ChevronRight,
  Leaf,
  Flame,
  ChefHat
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { DishCard } from '../components/menu/DishCard';
import { Button } from '../components/common/Button';
import { TESTIMONIALS } from '../data/gallery';

export const Home = () => {
  const { t, language } = useLanguage();
  const { dishes } = useRestaurant();
  const isKm = language === 'km';

  // Gather a rich pool of featured and top-rated dishes to loop through
  const featuredList = useMemo(() => {
    if (!dishes || dishes.length === 0) return [];
    const featured = dishes.filter((d) => d.featured);
    if (featured.length >= 12) return featured;
    const others = dishes.filter((d) => !d.featured).slice(0, 16);
    return [...featured, ...others];
  }, [dishes]);

  // Carousel State: 4 items per page on desktop
  const [currentPage, setCurrentPage] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const itemsPerPage = 4;
  const totalPages = Math.max(1, Math.ceil(featuredList.length / itemsPerPage));

  // Auto-advance loop every 4 seconds
  useEffect(() => {
    if (isHovered || totalPages <= 1) return;
    const interval = setInterval(() => {
      setCurrentPage((prev) => (prev + 1) % totalPages);
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, totalPages]);

  const handlePrev = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNext = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  return (
    <div className="home-page">
      {/* 1. Hero Section */}
      <section className="hero">
        <div className="container hero__container">
          <div className="hero__badge">
            <Sparkles size={16} />
            <span>{t('hero.badge')}</span>
          </div>

          <h1 className="hero__title">
            <span>{t('hero.title_part1')}</span>
            <span className="hero__title-accent">{t('hero.title_part2')}</span>
          </h1>

          <p className="hero__description">{t('hero.description')}</p>

          <div className="hero__actions">
            <Link to="/menu">
              <Button variant="secondary" size="lg" icon={<Utensils size={18} />}>
                {t('hero.order_btn')}
              </Button>
            </Link>
            <Link to="/track-order">
              <Button variant="outline" size="lg" icon={<Truck size={18} />} style={{ borderColor: '#fff', color: '#fff' }}>
                {t('hero.track_btn')}
              </Button>
            </Link>
          </div>

          <div className="hero__stats">
            <div className="hero__stat-item">
              <span className="hero__stat-number">40+</span>
              <span className="hero__stat-label">{t('hero.stats_dishes')}</span>
            </div>
            <div className="hero__stat-item">
              <span className="hero__stat-number">25-35</span>
              <span className="hero__stat-label">{t('hero.stats_experience')}</span>
            </div>
            <div className="hero__stat-item">
              <span className="hero__stat-number">25,000+</span>
              <span className="hero__stat-label">{t('hero.stats_customers')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Dishes */}
      <section className="section section--alt">
        <div className="container">
          <div className="section__header">
            <span className="section__badge">{t('featured.badge')}</span>
            <h2 className="section__title">{t('featured.title')}</h2>
            <p className="section__subtitle">{t('featured.subtitle')}</p>
          </div>

          {/* Featured Dishes Looping Carousel */}
          <div
            className="featured-carousel-container"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Arrow Nav Left */}
            {totalPages > 1 && (
              <button
                type="button"
                className="featured-carousel-nav featured-carousel-nav--prev"
                onClick={handlePrev}
                aria-label="Previous dishes"
              >
                <ChevronLeft size={22} />
              </button>
            )}

            {/* Slider Viewport */}
            <div className="featured-carousel-viewport">
              <div
                className="featured-carousel-track"
                style={{
                  transform: `translateX(-${currentPage * 100}%)`,
                  transition: 'transform 0.75s cubic-bezier(0.25, 1, 0.5, 1)'
                }}
              >
                {Array.from({ length: totalPages }).map((_, pageIdx) => {
                  const chunk = featuredList.slice(pageIdx * itemsPerPage, (pageIdx + 1) * itemsPerPage);
                  return (
                    <div key={pageIdx} className="featured-carousel-page">
                      <div className="menu-grid">
                        {chunk.map((dish) => (
                          <DishCard key={dish.id} dish={dish} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Arrow Nav Right */}
            {totalPages > 1 && (
              <button
                type="button"
                className="featured-carousel-nav featured-carousel-nav--next"
                onClick={handleNext}
                aria-label="Next dishes"
              >
                <ChevronRight size={22} />
              </button>
            )}
          </div>

          {/* Dots Indicator */}
          {totalPages > 1 && (
            <div className="featured-carousel-dots">
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`featured-carousel-dot ${currentPage === idx ? 'featured-carousel-dot--active' : ''}`}
                  onClick={() => setCurrentPage(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: 'var(--space-2xl)' }}>
            <Link to="/menu">
              <Button variant="outline" size="lg" icon={<ArrowRight size={18} />}>
                {t('featured.view_all')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Cloud Kitchen Story Teaser */}
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
                <Link to="/about">
                  <Button variant="primary">
                    {t('story.learn_more')}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Testimonials */}
      <section className="section section--alt">
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

      {/* 5. Call To Action Banner */}
      <section className="section">
        <div className="container">
          <div className="cta-banner">
            <h2 className="cta-banner__title">{t('cta.title')}</h2>
            <p className="cta-banner__desc">{t('cta.description')}</p>
            <div className="cta-banner__actions">
              <Link to="/menu">
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
