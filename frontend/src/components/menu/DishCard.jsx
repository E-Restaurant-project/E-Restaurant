import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, Star, Tag } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { useRestaurant } from '../../hooks/useRestaurant';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { getImageUrl } from '../../config/api';
import { isNonSpicyCategory } from '../../data/menu';
import { getEffectiveDiscount, getDiscountedPrice } from '../../utils/discount';

export const DishCard = ({ dish }) => {
  const { language, t, formatCurrency } = useLanguage();
  const { addToCart } = useCart();
  const { storeSettings } = useRestaurant();
  const [justAdded, setJustAdded] = useState(false);

  const isKm = language === 'km';
  const name = isKm ? dish.name_km : dish.name_en;
  const desc = isKm ? dish.desc_km : dish.desc_en;

  const effectiveDiscount = getEffectiveDiscount(dish, storeSettings?.categoryDiscounts);
  const discountedPrice = getDiscountedPrice(dish, storeSettings?.categoryDiscounts);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const isNonSpicy = isNonSpicyCategory(dish) || !dish.spice_level || dish.spice_level === 'none';
    addToCart(
      {
        ...dish,
        price: effectiveDiscount > 0 ? discountedPrice : dish.price,
        originalPrice: dish.price,
        discountPercent: effectiveDiscount
      },
      1,
      isNonSpicy ? null : dish.spice_level
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
  };

  return (
    <div className="card card--hover dish-card">
      <Link to={`/menu/${dish.id}`} className="dish-card__media">
        <img
          src={getImageUrl(dish.image)}
          alt={name}
          loading="lazy"
          className="dish-card__img"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Floating Top Deal Badge */}
        {effectiveDiscount > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              fontSize: '0.76rem',
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.4)',
              zIndex: 3,
              letterSpacing: '0.5px',
              display: 'flex',
              alignItems: 'center',
              gap: '3px'
            }}
          >
            -{effectiveDiscount}%
          </div>
        )}

        <div className="dish-card__badge-wrap">
          {dish.featured && (
            <Badge variant="gold">
              <Star size={12} fill="currentColor" />
              <span>{t('featured.badge')}</span>
            </Badge>
          )}
        </div>
      </Link>

      <div className="dish-card__content">
        <div className="dish-card__header">
          <Link to={`/menu/${dish.id}`}>
            <h3 className="dish-card__title">{name}</h3>
          </Link>

          <div className="dish-card__price-box">
            {effectiveDiscount > 0 ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="dish-card__price-usd" style={{ color: '#dc2626', fontWeight: 800 }}>
                    {formatCurrency(discountedPrice)}
                  </span>
                  <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.78rem' }}>
                    {formatCurrency(dish.price)}
                  </span>
                </div>
                <div className="dish-card__price-khr" style={{ color: '#dc2626', fontWeight: 700 }}>
                  {isKm
                    ? `$${discountedPrice.toFixed(2)}`
                    : `${Math.round(discountedPrice * 4100).toLocaleString()} ៛`}
                </div>
              </div>
            ) : (
              <div>
                <div className="dish-card__price-usd">{formatCurrency(dish.price)}</div>
                {isKm ? (
                  <div className="dish-card__price-khr">${dish.price.toFixed(2)}</div>
                ) : (
                  <div className="dish-card__price-khr">{(dish.price * 4100).toLocaleString()} ៛</div>
                )}
              </div>
            )}
          </div>
        </div>

        <p className="dish-card__desc">{desc}</p>

        <div className="dish-card__footer">
          <Link to={`/menu/${dish.id}`} className="btn btn--ghost btn--sm">
            {t('menu.view_detail')}
          </Link>
          <Button
            variant="primary"
            size="sm"
            onClick={handleQuickAdd}
            className={justAdded ? 'btn--just-added' : ''}
            icon={justAdded ? <Check size={16} /> : <Plus size={16} />}
          >
            {justAdded ? (isKm ? 'បានបញ្ចូល' : 'Added') : t('menu.add_to_cart')}
          </Button>
        </div>
      </div>
    </div>
  );
};
