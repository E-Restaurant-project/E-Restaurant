import React from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export const LanguageSwitcher = ({ className = '', light = false }) => {
  const { language, changeLanguage } = useLanguage();

  return (
    <div className={`lang-switch ${light ? 'lang-switch--light' : ''} ${className}`}>
      <button
        type="button"
        className={`lang-switch__btn ${language === 'km' ? 'lang-switch__btn--active' : ''}`}
        onClick={() => changeLanguage('km')}
        aria-label="Switch to Khmer"
      >
        <span>🇰🇭</span>
        <span>ខ្មែរ</span>
      </button>
      <button
        type="button"
        className={`lang-switch__btn ${language === 'en' ? 'lang-switch__btn--active' : ''}`}
        onClick={() => changeLanguage('en')}
        aria-label="Switch to English"
      >
        <span>🇬🇧</span>
        <span>EN</span>
      </button>
    </div>
  );
};
