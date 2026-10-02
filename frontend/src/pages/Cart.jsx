import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft, Trash2, Utensils } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../components/cart/CartItem';
import { OrderSummary } from '../components/cart/OrderSummary';
import { Button } from '../components/common/Button';

export const Cart = () => {
  const { t } = useLanguage();
  const { items, clearCart } = useCart();

  return (
    <div className="cart-page section">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
          <div>
            <h1 style={{ color: 'var(--color-primary-dark)' }}>{t('cart.title')}</h1>
            <Link to="/menu" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.9rem', color: 'var(--color-primary)', marginTop: '4px' }}>
              <ArrowLeft size={16} />
              <span>{t('detail.back_to_menu')}</span>
            </Link>
          </div>

          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              style={{ color: 'var(--color-danger)' }}
              icon={<Trash2 size={16} />}
            >
              {t('cart.clear_cart')}
            </Button>
          )}
        </div>

        {items.length > 0 ? (
          <div className="cart-layout">
            <div className="cart-list">
              {items.map((item) => (
                <CartItem key={item.cartItemId} item={item} />
              ))}
            </div>

            <OrderSummary showCheckoutBtn={true} />
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">
              <ShoppingBag size={38} />
            </div>
            <h2>{t('cart.empty_title')}</h2>
            <p>{t('cart.empty_subtitle')}</p>
            <Link to="/menu" style={{ display: 'inline-block', marginTop: 'var(--space-md)' }}>
              <Button variant="primary" size="lg" icon={<Utensils size={18} />}>
                {t('cart.browse_menu')}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
