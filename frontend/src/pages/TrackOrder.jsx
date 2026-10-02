import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  Clock,
  ChefHat,
  Truck,
  PackageCheck,
  AlertCircle,
  MapPin,
  Phone,
  ArrowRight
} from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { useRestaurant } from '../hooks/useRestaurant';
import { Button } from '../components/common/Button';
import { Badge } from '../components/common/Badge';

export const TrackOrder = () => {
  const { t, language, formatCurrency, formatDualCurrency } = useLanguage();
  const { getOrderById, orders } = useRestaurant();
  const [searchParams, setSearchParams] = useSearchParams();
  const isKm = language === 'km';

  const [inputOrderId, setInputOrderId] = useState(searchParams.get('id') || '');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const idFromQuery = searchParams.get('id');
    if (idFromQuery) {
      setInputOrderId(idFromQuery);
      const found = getOrderById(idFromQuery);
      setSearchedOrder(found || null);
      setSearched(true);
    }
  }, [searchParams, orders]);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!inputOrderId.trim()) return;

    setSearchParams({ id: inputOrderId.trim() });
    const found = getOrderById(inputOrderId.trim());
    setSearchedOrder(found || null);
    setSearched(true);
  };

  const stages = [
    { key: 'pending', title: t('track.step_pending'), desc: t('track.step_pending_desc'), icon: Clock },
    { key: 'preparing', title: t('track.step_preparing'), desc: t('track.step_preparing_desc'), icon: ChefHat },
    { key: 'delivering', title: t('track.step_delivering'), desc: t('track.step_delivering_desc'), icon: Truck },
    { key: 'completed', title: t('track.step_completed'), desc: t('track.step_completed_desc'), icon: PackageCheck }
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'preparing': return 1;
      case 'delivering': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentStageIdx = searchedOrder ? getStageIndex(searchedOrder.status) : 0;
  const isCancelled = searchedOrder?.status === 'cancelled';

  return (
    <div className="track-order-page">
      {/* Header */}
      <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border)', padding: 'var(--space-2xl) 0 var(--space-xl)' }}>
        <div className="container">
          <div className="section__header" style={{ marginBottom: 0 }}>
            <span className="section__badge">
              <Truck size={14} style={{ display: 'inline', marginRight: '4px' }} />
              {t('nav.track_order')}
            </span>
            <h1 className="section__title">{t('track.title')}</h1>
            <p className="section__subtitle">{t('track.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="container section">
        {/* Search Box */}
        <div style={{ maxWidth: '640px', margin: '0 auto var(--space-2xl)' }}>
          <form onSubmit={handleSearch} className="card" style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <div style={{ position: 'relative', flexGrow: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('track.placeholder')}
                  value={inputOrderId}
                  onChange={(e) => setInputOrderId(e.target.value)}
                  style={{ paddingLeft: '38px' }}
                />
              </div>
              <Button variant="primary" type="submit" icon={<Search size={16} />}>
                {t('track.track_btn')}
              </Button>
            </div>

            {/* Helper chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '10px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              <span>Sample Orders:</span>
              {orders.slice(0, 3).map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => {
                    setInputOrderId(o.id);
                    setSearchParams({ id: o.id });
                  }}
                  style={{ color: 'var(--color-primary)', textDecoration: 'underline', fontWeight: 600 }}
                >
                  {o.id}
                </button>
              ))}
            </div>
          </form>
        </div>

        {/* Order Details & Timeline */}
        {searched && (
          <div style={{ maxWidth: '780px', margin: '0 auto' }}>
            {searchedOrder ? (
              <div className="card" style={{ padding: 'var(--space-2xl)' }}>
                {/* Header info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-md)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-lg)', marginBottom: 'var(--space-xl)' }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t('checkout.order_id')}</span>
                    <h2 style={{ color: 'var(--color-primary-dark)' }}>{searchedOrder.id}</h2>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {new Date(searchedOrder.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ marginBottom: '6px' }}>
                      {isCancelled ? (
                        <Badge variant="danger">{t('admin.status_cancelled')}</Badge>
                      ) : (
                        <Badge variant={searchedOrder.status === 'completed' ? 'success' : 'gold'}>
                          {t(`admin.status_${searchedOrder.status}`)}
                        </Badge>
                      )}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                      {t('track.est_time')}
                    </div>
                  </div>
                </div>

                {/* Graphical Timeline */}
                {!isCancelled ? (
                  <div style={{ margin: 'var(--space-2xl) 0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative' }}>
                      {stages.map((st, idx) => {
                        const Icon = st.icon;
                        const isDone = idx <= currentStageIdx;
                        const isCurrent = idx === currentStageIdx;
                        return (
                          <div key={st.key} style={{ textAlign: 'center', position: 'relative' }}>
                            <div
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: '50%',
                                backgroundColor: isDone ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                                color: isDone ? '#fff' : 'var(--color-text-light)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 10px',
                                border: isCurrent ? '3px solid var(--color-secondary)' : 'none',
                                boxShadow: isCurrent ? '0 0 0 4px rgba(197, 155, 39, 0.25)' : 'none',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <Icon size={22} />
                            </div>
                            <div style={{ fontWeight: isDone ? 700 : 500, fontSize: '0.85rem', color: isDone ? 'var(--color-text-main)' : 'var(--color-text-light)' }}>
                              {st.title}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px', display: 'none' }}>
                              {st.desc}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ padding: 'var(--space-lg)', backgroundColor: '#ffebee', borderRadius: 'var(--radius-lg)', color: 'var(--color-danger)', textAlign: 'center', margin: 'var(--space-xl) 0' }}>
                    <AlertCircle size={32} style={{ margin: '0 auto 8px' }} />
                    <h3 style={{ color: 'var(--color-danger)' }}>{t('track.step_cancelled')}</h3>
                    <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>This order has been cancelled. Please contact our support team if you have questions.</p>
                  </div>
                )}

                {/* Delivery details & Receipt */}
                <div style={{ backgroundColor: 'var(--color-bg-subtle)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-lg)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-md)' }}>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Customer:</div>
                      <div style={{ fontWeight: 600 }}>{searchedOrder.customerName}</div>
                      <div style={{ fontSize: '0.85rem' }}>{searchedOrder.phone}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Delivery Destination:</div>
                      <div style={{ fontWeight: 600 }}>{searchedOrder.address || 'Central Kitchen Hub (Self-Pickup)'}</div>
                    </div>
                  </div>

                  <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-md)' }}>
                    <h4 style={{ marginBottom: '8px' }}>{t('cart.item')} ({searchedOrder.items?.length}):</h4>
                    {searchedOrder.items?.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '4px' }}>
                        <span>{it.quantity}x {isKm ? it.name_km : it.name_en}</span>
                        <span>{formatCurrency(it.price * it.quantity)}</span>
                      </div>
                    ))}

                    <div style={{ borderTop: '1px solid var(--color-border)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
                      <span>{t('cart.grand_total')}:</span>
                      <span style={{ color: 'var(--color-primary)' }}>{formatCurrency(searchedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon" style={{ backgroundColor: '#ffebee', color: 'var(--color-danger)' }}>
                  <AlertCircle size={38} />
                </div>
                <h3>{t('track.not_found')}</h3>
                <p>Please double-check your Order Reference ID or check your confirmation message.</p>
                <Link to="/menu" style={{ marginTop: 'var(--space-md)', display: 'inline-block' }}>
                  <Button variant="primary">{t('cart.browse_menu')}</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
