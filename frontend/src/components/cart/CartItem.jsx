import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { getImageUrl } from '../../config/api';
import { isNonSpicyCategory } from '../../data/menu';

export const CartItem = ({ item }) => {
  const { language, formatCurrency, t } = useLanguage();
  const { updateQuantity, removeFromCart } = useCart();
  const isKm = language === 'km';

  const name = isKm ? item.name_km : item.name_en;
  const itemTotal = item.price * item.quantity;

  return (
    <div className="cart-item">
      <img
        src={getImageUrl(item.image)}
        alt={name}
        className="cart-item__img"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=300&q=80';
        }}
      />

      <div className="cart-item__info">
        <h4>{name}</h4>
        <div className="cart-item__meta">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 700, color: item.discountPercent > 0 ? '#dc2626' : 'inherit' }}>
              {formatCurrency(item.price)}
            </span>
            {item.discountPercent > 0 && item.originalPrice && (
              <>
                <span style={{ textDecoration: 'line-through', color: '#94a3b8', fontSize: '0.78rem' }}>
                  {formatCurrency(item.originalPrice)}
                </span>
                <span
                  style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}
                >
                  -{item.discountPercent}%
                </span>
              </>
            )}
          </div>
          {item.spiceLevel && item.spiceLevel !== 'none' && !isNonSpicyCategory(item) && (
            <span> • {t('detail.spice_level')}: {t(`menu.spice_${item.spiceLevel}`) || item.spiceLevel}</span>
          )}
          {item.notes && (
            <div><em>"{item.notes}"</em></div>
          )}
        </div>
      </div>

      {/* Quantity increment/decrement */}
      <div className="qty-control">
        <button
          type="button"
          className="qty-control__btn"
          onClick={() => updateQuantity(item.cartItemId, -1)}
          aria-label="Decrease quantity"
        >
          <Minus size={14} />
        </button>
        <span className="qty-control__val">{item.quantity}</span>
        <button
          type="button"
          className="qty-control__btn"
          onClick={() => updateQuantity(item.cartItemId, 1)}
          aria-label="Increase quantity"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="cart-item__subtotal">
        {formatCurrency(itemTotal)}
      </div>

      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={() => removeFromCart(item.cartItemId)}
        style={{ color: 'var(--color-danger)' }}
        title={t('cart.remove')}
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
};
