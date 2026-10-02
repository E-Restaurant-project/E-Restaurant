import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Utensils, RotateCcw, ArrowUp, X } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { DishCard } from '../components/menu/DishCard';
import { MenuFilter } from '../components/menu/MenuFilter';
import { Button } from '../components/common/Button';

export const Menu = () => {
  const { t, language } = useLanguage();
  const { dishes, allCategories } = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();
  const isKm = language === 'km';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(searchParams.get('category') || 'all');
  const [spiceFilter, setSpiceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filter and sort dishes
  const filteredDishes = useMemo(() => {
    return dishes
      .filter((dish) => {
        // Category filter
        if (activeCategory !== 'all' && dish.category !== activeCategory) {
          return false;
        }

        // Spice filter
        if (spiceFilter !== 'all' && dish.spice_level !== spiceFilter) {
          return false;
        }

        // Search filter (searches in both Khmer and English names and descriptions)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchKm = dish.name_km.toLowerCase().includes(q) || (dish.desc_km && dish.desc_km.toLowerCase().includes(q));
          const matchEn = dish.name_en.toLowerCase().includes(q) || (dish.desc_en && dish.desc_en.toLowerCase().includes(q));
          if (!matchKm && !matchEn) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        // Default: featured first, then by rating
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return (b.rating || 0) - (a.rating || 0);
      });
  }, [dishes, activeCategory, spiceFilter, searchQuery, sortBy]);

  const handleCategoryChange = (catId) => {
    setActiveCategory(catId);
    if (catId === 'all') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', catId);
    }
    setSearchParams(searchParams);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setActiveCategory('all');
    setSpiceFilter('all');
    setSortBy('featured');
    setSearchParams({});
  };

  const activeCategoryObj = allCategories?.find((c) => c.id === activeCategory);

  return (
    <div className="menu-page">
      {/* Header Banner */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">
              <Utensils size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {t('nav.menu')}
            </span>
            <h1 className="section__title">{t('menu.title')}</h1>
            <p className="section__subtitle">{t('menu.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Sticky Filter Controls */}
      <div className="menu-sticky-controls">
        <div className="container">
          <MenuFilter
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            activeCategory={activeCategory}
            onCategoryChange={handleCategoryChange}
            spiceFilter={spiceFilter}
            onSpiceChange={setSpiceFilter}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>
      </div>

      <div className="container section" style={{ paddingTop: 'var(--space-sm)' }}>
        {/* Active Filter Chips & Counter */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              <strong>{t('menu.dish_count')}</strong> {filteredDishes.length}
            </div>

            {activeCategory !== 'all' && (
              <span className="filter-chip">
                {isKm ? activeCategoryObj?.label_km || activeCategory : activeCategoryObj?.label_en || activeCategory}
                <button type="button" onClick={() => handleCategoryChange('all')} aria-label="Remove category">
                  <X size={12} />
                </button>
              </span>
            )}

            {searchQuery && (
              <span className="filter-chip">
                "{searchQuery}"
                <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search">
                  <X size={12} />
                </button>
              </span>
            )}

            {spiceFilter !== 'all' && (
              <span className="filter-chip">
                {t(`menu.spice_${spiceFilter}`) || spiceFilter}
                <button type="button" onClick={() => setSpiceFilter('all')} aria-label="Clear spice">
                  <X size={12} />
                </button>
              </span>
            )}
          </div>

          {(searchQuery || activeCategory !== 'all' || spiceFilter !== 'all') && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} icon={<RotateCcw size={14} />}>
              {t('menu.reset_filter')}
            </Button>
          )}
        </div>

        {/* Dishes Grid */}
        {filteredDishes.length > 0 ? (
          <div className="menu-grid">
            {filteredDishes.map((dish) => (
              <DishCard key={dish.id} dish={dish} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <Utensils size={36} />
            </div>
            <h3>{t('menu.no_items')}</h3>
            <p>{t('common.empty')}</p>
            <Button variant="primary" onClick={handleResetFilters} style={{ marginTop: 'var(--space-md)' }}>
              {t('menu.reset_filter')}
            </Button>
          </div>
        )}
      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          type="button"
          className="back-to-top-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title={isKm ? 'ត្រឡប់ទៅខាងលើ' : 'Back to top'}
          aria-label="Back to top"
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
};
