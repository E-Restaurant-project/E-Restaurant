import React from 'react';
import { Trash2, Plus, Minus } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { useCart } from '../../hooks/useCart';
import { getImageUrl } from '../../config/api';

export const CartItem = ({ item }) => {
  const { language, formatCurrency, t } = useLanguage();
  const { updateQuantity, removeFromCart } = useCart();
  const isKm = language === 'km';

  const name = isKm ? item.name_km : item.name_en;
  const itemTotal = item.price * item.quantity;

  return (
    <div className="cart-item">
      <img src={getImageUrl(item.image)} alt={name} className="cart-item__img" />

      <div className="cart-item__info">
        <h4>{name}</h4>
        <div className="cart-item__meta">
          <span>{formatCurrency(item.price)}</span>
          {item.spiceLevel && (
            <span> • {t('detail.spice_level')}: {item.spiceLevel}</span>
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
