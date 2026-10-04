import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Minus,
  Flame,
  Star,
  ShoppingBag,
  CheckCircle2
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { useCart } from '../hooks/useCart';
import { DishCard } from '../components/menu/DishCard';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';
import { CATEGORIES } from '../data/menu';
import { getImageUrl } from '../config/api';

export const ItemDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language, t, formatCurrency, formatDualCurrency } = useLanguage();
  const { getDishById, dishes, allCategories } = useRestaurant();
  const { addToCart } = useCart();

  const isKm = language === 'km';
  const dish = getDishById(id);

  const [quantity, setQuantity] = useState(1);
  const [spiceLevel, setSpiceLevel] = useState(dish?.spice_level || 'mild');
  const [specialNotes, setSpecialNotes] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  if (!dish) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-3xl) 0' }}>
        <h2>{t('common.not_found_title')}</h2>
        <p>{t('common.not_found_desc')}</p>
        <Link to="/menu" style={{ display: 'inline-block', marginTop: 'var(--space-md)' }}>
          <Button variant="primary">{t('detail.back_to_menu')}</Button>
        </Link>
      </div>
    );
  }

  const name = isKm ? dish.name_km : dish.name_en;
  const desc = isKm ? dish.desc_km : dish.desc_en;
  const ingredients = isKm ? dish.ingredients_km : dish.ingredients_en;
  const dualPrice = formatDualCurrency(dish.price);

  const categoryList = allCategories && allCategories.length > 0 ? allCategories : CATEGORIES;
  const catObj = categoryList.find((c) => c.id === dish.category);
  const categoryLabel = catObj ? (isKm ? catObj.label_km : catObj.label_en) : dish.category;

  const handleAddToCart = () => {
    addToCart(dish, quantity, spiceLevel, specialNotes);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 800);
  };

  // Find related dishes in same category
  const relatedDishes = dishes
    .filter((d) => d.id !== dish.id && d.category === dish.category)
    .slice(0, 3);

  return (
    <div className="item-detail-page section">
      <div className="container">
        {/* Back Link */}
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          onClick={() => navigate(-1)}
          style={{ marginBottom: 'var(--space-md)' }}
        >
          <ArrowLeft size={18} />
          <span>{t('detail.back_to_menu')}</span>
        </button>

        {/* Layout */}
        <div className="detail-layout">
          {/* Left: Dish Media */}
          <div className="detail-gallery">
            <div className="detail-gallery__main">
              <img
                src={getImageUrl(dish.image)}
                alt={name}
                className="detail-gallery__img"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
                }}
              />
            </div>
          </div>

          {/* Right: Dish Info & Customization */}
          <div className="detail-info">
            <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--space-xs)' }}>
              {dish.featured && (
                <Badge variant="gold">
                  <Star size={12} fill="currentColor" />
                  <span>{t('featured.badge')}</span>
                </Badge>
              )}
              <Badge variant="info">
                <span>{categoryLabel}</span>
              </Badge>
            </div>

            <h1 className="detail-info__title">{name}</h1>

            <div className="detail-info__meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#c59b27' }}>
                <Star size={18} fill="#c59b27" />
                <span style={{ fontWeight: 700 }}>{dish.rating || 4.9}</span>
                <span style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                  ({dish.reviews_count || 120})
                </span>
              </div>
            </div>

            <div className="detail-info__price">
              <span className="detail-info__price-usd">{dualPrice.usd}</span>
              <span className="detail-info__price-khr">({dualPrice.khr})</span>
            </div>

            <p className="detail-info__desc">{desc}</p>

            {/* Ingredients */}
            {ingredients && ingredients.length > 0 && (
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-xs)', color: 'var(--color-text-main)' }}>
                  {t('detail.ingredients')}
                </h4>
                <div className="detail-info__tags">
                  {ingredients.map((ing, idx) => (
                    <span key={idx} className="detail-info__tag">
                      ✓ {ing}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customization Options */}
            <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
              {/* Spice Level */}
              <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} color="var(--color-danger)" />
                  <span>{t('detail.spice_level')}</span>
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['none', 'mild', 'medium', 'hot'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className={`btn btn--sm ${spiceLevel === lvl ? 'btn--primary' : 'btn--outline'}`}
                      onClick={() => setSpiceLevel(lvl)}
                    >
                      {t(`menu.spice_${lvl}`)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{t('detail.special_notes')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('detail.notes_placeholder')}
                  value={specialNotes}
                  onChange={(e) => setSpecialNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div className="detail-info__actions">
              <div className="qty-control" style={{ height: '48px' }}>
                <button
                  type="button"
                  className="qty-control__btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                >
                  <Minus size={18} />
                </button>
                <span className="qty-control__val" style={{ minWidth: '46px', fontSize: '1.1rem' }}>
                  {quantity}
                </span>
                <button
                  type="button"
                  className="qty-control__btn"
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                >
                  <Plus size={18} />
                </button>
              </div>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                className={justAdded ? 'btn--just-added' : ''}
                icon={justAdded ? <CheckCircle2 size={20} /> : <ShoppingBag size={20} />}
                style={{ flexGrow: 1 }}
              >
                {justAdded
                  ? (isKm ? 'បានបញ្ចូលក្នុងកន្ត្រក!' : 'Added to Cart!')
                  : `${t('menu.add_to_cart')} - ${formatCurrency(dish.price * quantity)}`
                }
              </Button>
            </div>
          </div>
        </div>

        {/* Related Dishes */}
        {relatedDishes.length > 0 && (
          <div style={{ marginTop: 'var(--space-3xl)' }}>
            <h3 style={{ marginBottom: 'var(--space-lg)', color: 'var(--color-primary-dark)' }}>
              {t('detail.related_title')}
            </h3>
            <div className="menu-grid">
              {relatedDishes.map((rDish) => (
                <DishCard key={rDish.id} dish={rDish} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
