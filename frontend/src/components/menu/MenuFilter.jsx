import React, { useRef, useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useRestaurant } from '../../hooks/useRestaurant';
import { CATEGORIES } from '../../data/menu';
import { CustomSelect } from '../common/CustomSelect';

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
  const { allCategories } = useRestaurant();
  const isKm = language === 'km';
  const categoryList = allCategories && allCategories.length > 0 ? allCategories : CATEGORIES;

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
    if (e?.currentTarget) {
      e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  const handleWheel = (e) => {
    if (!trackRef.current) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      trackRef.current.scrollLeft += e.deltaY * 0.8;
    }
  };

  const spiceOptions = [
    { id: 'all', label: t('menu.all_spices') },
    { id: 'none', label: t('menu.spice_none') },
    { id: 'mild', label: t('menu.spice_mild') },
    { id: 'medium', label: t('menu.spice_medium') },
    { id: 'hot', label: t('menu.spice_hot') }
  ];

  const sortOptions = [
    { id: 'featured', label: t('menu.sort_featured') },
    { id: 'price_low', label: t('menu.sort_price_low') },
    { id: 'price_high', label: t('menu.sort_price_high') }
  ];

  return (
    <div className="menu-filter">
      <div className="menu-filter__row">
        {/* Search input */}
        <div className="menu-filter__search-box">
          <Search size={18} className="menu-filter__search-icon" />
          <input
            type="text"
            className="form-input menu-filter__search-input"
            placeholder={t('menu.search_placeholder')}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Spice Level & Sort Filters */}
        <div className="menu-filter__dropdowns" style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ minWidth: '160px' }}>
            <CustomSelect
              options={spiceOptions}
              value={spiceFilter}
              onChange={(val) => onSpiceChange(val)}
              placeholder={t('menu.all_spices')}
            />
          </div>

          <div style={{ minWidth: '175px' }}>
            <CustomSelect
              options={sortOptions}
              value={sortBy}
              onChange={(val) => onSortChange(val)}
              placeholder={t('menu.sort_featured')}
            />
          </div>
        </div>
      </div>

      {/* Category Pills - Smooth Horizontal Scroll (No Scrollbar, No Jitter) */}
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
          {categoryList.map((cat) => {
            const isActive = activeCategory === cat.id;
            const label = isKm ? cat.label_km : cat.label_en;
            return (
              <button
                key={cat.id}
                type="button"
                className={`menu-filter__cat-btn ${isActive ? 'menu-filter__cat-btn--active' : ''}`}
                onClick={(e) => handleCategorySelect(cat.id, e)}
              >
                {label}
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
