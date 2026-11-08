import React, { useRef, useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useRestaurant } from '../../hooks/useRestaurant';
import { CustomSelect } from '../common/CustomSelect';

const resolveCategoryLabel = (cat, isKm) => {
  if (!cat) return '';
  if (isKm) {
    return cat.label_km || cat.name_km || cat.label_en || cat.name_en || cat.id || '';
  }
  return cat.label_en || cat.name_en || cat.label_km || cat.name_km || cat.id || '';
};

export const MenuFilter = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  spiceFilter,
  onSpiceChange,
  sortBy,
  onSortChange
}) => {
  const { language, t } = useLanguage();
  const { allCategories, storeSettings } = useRestaurant();
  const isKm = language === 'km';
  const categoryList = allCategories || [];

  const trackRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = () => {
    if (!trackRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = trackRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
  };

  useEffect(() => {
    checkScroll();
    const el = trackRef.current;
    if (el) {
      el.addEventListener('scroll', checkScroll, { passive: true });
      window.addEventListener('resize', checkScroll);
      return () => {
        el.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [categoryList]);

  const scrollTrack = (direction) => {
    if (!trackRef.current) return;
    const amount = direction === 'left' ? -260 : 260;
    trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  const handleCategorySelect = (catId, e) => {
    onCategoryChange(catId);
    if (e && e.currentTarget && trackRef.current) {
      const btn = e.currentTarget;
      const track = trackRef.current;
      const btnLeft = btn.offsetLeft;
      const btnWidth = btn.offsetWidth;
      const trackWidth = track.clientWidth;
      const targetScroll = btnLeft - (trackWidth / 2) + (btnWidth / 2);
      track.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  };

  const handleWheel = (e) => {
    if (trackRef.current && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      trackRef.current.scrollLeft += e.deltaY;
    }
  };

  const sortOptions = [
    { id: 'default', label: isKm ? 'លំនាំដើម' : 'Default' },
    { id: 'price-asc', label: isKm ? 'តម្លៃ: ទាប ទៅ ខ្ពស់' : 'Price: Low to High' },
    { id: 'price-desc', label: isKm ? 'តម្លៃ: ខ្ពស់ ទៅ ទាប' : 'Price: High to Low' },
    { id: 'name-asc', label: isKm ? 'ឈ្មោះ: ក-អ (A-Z)' : 'Name: A-Z' },
    { id: 'rating', label: isKm ? 'ពិន្ទុពេញនិយមបំផុត' : 'Highest Rated' }
  ];

  return (
    <div className="menu-filter">
      {/* Top Search & Filter Bar */}
      <div className="menu-filter__row">
        {/* Search Input */}
        <div className="menu-filter__search-box">
          <Search size={18} className="menu-filter__search-icon" />
          <input
            type="text"
            className="form-input menu-filter__search-input"
            placeholder={t('menu.search_placeholder') || (isKm ? 'ស្វែងរកមុខម្ហូបតាមឈ្មោះ...' : 'Search dishes by name...')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="menu-filter__search-clear"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filter Controls (Spice & Sort) in unified flex row */}
        <div className="menu-filter__dropdowns">
          {/* Spice Filter */}
          <div className="menu-filter__dropdown-item">
            <CustomSelect
              options={[
                { id: 'all', label: isKm ? 'កម្រិតហិរទាំងអស់' : 'All Spice Levels' },
                { id: 'none', label: isKm ? 'មិនហិរ' : 'Non-Spicy' },
                { id: 'mild', label: isKm ? 'ហិរតិចៗ' : 'Mild' },
                { id: 'medium', label: isKm ? 'ហិរមធ្យម' : 'Medium' },
                { id: 'hot', label: isKm ? 'ហិរខ្លាំង' : 'Hot' }
              ]}
              value={spiceFilter}
              onChange={onSpiceChange}
              placeholder={isKm ? 'កម្រិតហិរទាំងអស់' : 'All Spice Levels'}
            />
          </div>

          {/* Sort Filter */}
          <div className="menu-filter__dropdown-item">
            <CustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={onSortChange}
              placeholder={isKm ? 'តម្រៀបតាម...' : 'Sort by...'}
            />
          </div>
        </div>
      </div>

      {/* Category Pills - Smooth Horizontal Scroll */}
      <div className="menu-filter__categories-wrapper">
        {canScrollLeft && (
          <button
            type="button"
            className="menu-filter__scroll-arrow menu-filter__scroll-arrow--left"
            onClick={() => scrollTrack('left')}
            aria-label="Scroll categories left"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div
          ref={trackRef}
          className="menu-filter__categories-scroll-area"
          onWheel={handleWheel}
        >
          {/* Primary All Dishes Pill */}
          <button
            type="button"
            className={`menu-filter__cat-btn ${activeCategory === 'all' ? 'menu-filter__cat-btn--active' : ''}`}
            onClick={(e) => handleCategorySelect('all', e)}
          >
            <span>{isKm ? 'មុខម្ហូបទាំងអស់' : 'All Dishes'}</span>
          </button>

          {categoryList.length === 0 && (
            <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', display: 'inline-flex', alignItems: 'center', padding: '0 8px', fontStyle: 'italic', whiteSpace: 'nowrap' }}>
              {isKm ? '(មិនទាន់មានប្រភេទមុខម្ហូបនៅឡើយទេ)' : '(No categories created yet)'}
            </span>
          )}
          {categoryList
            .filter((cat) => {
              if (!cat || cat.id === 'all' || cat.slug === 'all') return false;
              const lbl = resolveCategoryLabel(cat, isKm);
              return typeof lbl === 'string' && lbl.trim().length > 0;
            })
            .map((cat, idx) => {
              const rawId = cat.id || cat.slug || cat.category_id || String(cat._id || `cat-${idx}`);
              const catId = rawId.replace(/_/g, '-');
              const uniqueKey = `cat-btn-${catId}-${idx}`;
              const isActive = activeCategory === catId || activeCategory === rawId;
              const label = resolveCategoryLabel(cat, isKm);
              return (
                <button
                  key={uniqueKey}
                  type="button"
                  className={`menu-filter__cat-btn ${isActive ? 'menu-filter__cat-btn--active' : ''}`}
                  onClick={(e) => handleCategorySelect(catId, e)}
                >
                  <span>{label}</span>
                  {(() => {
                    const catKey = String(catId).trim().toLowerCase();
                    const catDisc = Number(storeSettings?.categoryDiscounts?.[catKey] || storeSettings?.categoryDiscounts?.[cat.id] || 0);
                    if (catDisc > 0) {
                      return (
                        <span
                          style={{
                            marginLeft: '6px',
                            backgroundColor: isActive ? '#ffffff' : '#dc2626',
                            color: isActive ? '#dc2626' : '#ffffff',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '1px 6px',
                            borderRadius: '9999px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                          }}
                        >
                          -{catDisc}%
                        </span>
                      );
                    }
                    return null;
                  })()}
                </button>
              );
            })}
        </div>

        {canScrollRight && (
          <button
            type="button"
            className="menu-filter__scroll-arrow menu-filter__scroll-arrow--right"
            onClick={() => scrollTrack('right')}
            aria-label="Scroll categories right"
          >
            <ChevronRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
