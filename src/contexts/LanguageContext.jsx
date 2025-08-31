import React, { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../utils/i18n';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = useState('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('pos-language') || 'en';
    setCurrentLanguage(savedLanguage);
    i18n.changeLanguage(savedLanguage);
    
    // Apply language-specific CSS classes
    document.body.className = savedLanguage === 'si' ? 'sinhala' : 
                             savedLanguage === 'ta' ? 'tamil' : '';
  }, []);

  const changeLanguage = (language) => {
    setCurrentLanguage(language);
    i18n.changeLanguage(language);
    localStorage.setItem('pos-language', language);
    
    // Apply language-specific CSS classes
    document.body.className = language === 'si' ? 'sinhala' : 
                             language === 'ta' ? 'tamil' : '';
  };

  const value = {
    currentLanguage,
    changeLanguage,
    languages: [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'si', name: 'සිංහල', flag: '🇱🇰' },
      { code: 'ta', name: 'தமிழ்', flag: '🇱🇰' }
    ]
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};