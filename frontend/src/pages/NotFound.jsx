import React from 'react';
import { Link } from 'react-router-dom';
import { Home, AlertTriangle } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';
import { Button } from '../components/common/Button';

export const NotFound = () => {
  const { t } = useLanguage();

  return (
    <div className="container section" style={{ textAlign: 'center', padding: 'var(--space-3xl) var(--space-md)' }}>
      <div className="empty-state">
        <div className="empty-state__icon" style={{ backgroundColor: '#ffebee', color: 'var(--color-danger)' }}>
          <AlertTriangle size={40} />
        </div>
        <h1 style={{ fontSize: '3.5rem', color: 'var(--color-primary-dark)', marginBottom: 'var(--space-xs)' }}>
          404
        </h1>
        <h2 style={{ marginBottom: 'var(--space-sm)' }}>{t('common.not_found_title')}</h2>
        <p style={{ maxWidth: '420px', margin: '0 auto var(--space-lg)' }}>
          {t('common.not_found_desc')}
        </p>
        <Link to="/">
          <Button variant="primary" size="lg" icon={<Home size={18} />}>
            {t('common.back_home')}
          </Button>
        </Link>
      </div>
    </div>
  );
};
