import React, { createContext, useContext, useState, useEffect } from 'react';
import kmTranslations from '../locales/km.json';
import enTranslations from '../locales/en.json';
import { API_CONFIG } from '../config/api';

const LanguageContext = createContext(null);

const translations = {
  km: kmTranslations,
  en: enTranslations
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem(API_CONFIG.STORAGE_KEYS.LANGUAGE);
    return saved === 'en' || saved === 'km' ? saved : API_CONFIG.DEFAULT_LANGUAGE;
  });

  useEffect(() => {
    localStorage.setItem(API_CONFIG.STORAGE_KEYS.LANGUAGE, language);
    document.documentElement.lang = language;
    document.body.className = `app--${language}`;
  }, [language]);

  const changeLanguage = (lang) => {
    if (lang === 'km' || lang === 'en') {
      setLanguage(lang);
    }
  };

  // Safe nested key translation helper (e.g. 'hero.title_part1')
  const t = (key, fallback = '') => {
    if (!key) return fallback;
    const keys = key.split('.');
    let current = translations[language];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English if missing in Khmer or vice versa
        const fallbackObj = language === 'km' ? translations.en : translations.km;
        let alt = fallbackObj;
        for (const altK of keys) {
          if (alt && typeof alt === 'object' && altK in alt) {
            alt = alt[altK];
          } else {
            return fallback || key;
          }
        }
        return alt || fallback || key;
      }
    }
    return typeof current === 'string' ? current : (fallback || key);
  };

  // Currency formatting helper with 100 KHR minimum threshold
  const formatCurrency = (usdAmount, forcedLang = null) => {
    const activeLang = forcedLang || language;
    const amount = Number(usdAmount) || 0;
    if (activeLang === 'km') {
      if (amount <= 0) return '0 ៛';
      const khr = Math.round(amount * API_CONFIG.CURRENCY_RATE.KHR_PER_USD);
      const displayKhr = Math.max(100, khr);
      return `${displayKhr.toLocaleString()} ៛`;
    }
    if (amount <= 0) return '$0.00';
    if (amount < 0.05) return `$0.02`;
    return `$${amount.toFixed(2)}`;
  };

  // Dual currency helper with 100 KHR minimum threshold
  const formatDualCurrency = (usdAmount) => {
    const amount = Number(usdAmount) || 0;
    if (amount <= 0) return { usd: '$0.00', khr: '0 ៛' };
    const khr = Math.round(amount * API_CONFIG.CURRENCY_RATE.KHR_PER_USD);
    const displayKhr = Math.max(100, khr);
    return {
      usd: amount < 0.05 ? `$0.02` : `$${amount.toFixed(2)}`,
      khr: `${displayKhr.toLocaleString()} ៛`
    };
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, formatCurrency, formatDualCurrency }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
