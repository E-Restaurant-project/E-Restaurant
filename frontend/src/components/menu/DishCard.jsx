import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Check, Flame, Star } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { getImageUrl } from '../../config/api';

export const DishCard = ({ dish }) => {
  const { language, t, formatCurrency } = useLanguage();
  const { addToCart } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const isKm = language === 'km';
  const name = isKm ? dish.name_km : dish.name_en;
  const desc = isKm ? dish.desc_km : dish.desc_en;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(dish, 1, dish.spice_level || 'mild');
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 700);
  };

  const renderSpiceIndicator = () => {
    if (!dish.spice_level || dish.spice_level === 'none') return null;
    const spiceCount = dish.spice_level === 'hot' ? 3 : dish.spice_level === 'medium' ? 2 : 1;
    return (
      <div className="dish-card__spice" title={`${t('menu.filter_spice')}: ${dish.spice_level}`}>
        <Flame size={14} color="var(--color-danger)" />
        <span>{'🌶️'.repeat(spiceCount)}</span>
      </div>
    );
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
        <div className="dish-card__badge-wrap">
          {dish.featured && (
            <Badge variant="gold">
              <Star size={12} fill="currentColor" />
              <span>{t('featured.badge')}</span>
            </Badge>
          )}
        </div>
        {renderSpiceIndicator()}
      </Link>

      <div className="dish-card__content">
        <div className="dish-card__header">
          <Link to={`/menu/${dish.id}`}>
            <h3 className="dish-card__title">{name}</h3>
          </Link>
          <div className="dish-card__price-box">
            <div className="dish-card__price-usd">{formatCurrency(dish.price)}</div>
            {isKm ? (
              <div className="dish-card__price-khr">${dish.price.toFixed(2)}</div>
            ) : (
              <div className="dish-card__price-khr">{(dish.price * 4100).toLocaleString()} ៛</div>
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
