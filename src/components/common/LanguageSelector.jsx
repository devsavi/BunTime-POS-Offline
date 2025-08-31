import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSelector = () => {
  const { currentLanguage, changeLanguage, languages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center space-x-2 p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 border border-gray-200 dark:border-gray-600 btn-touch"
        title="Select Language"
        aria-label="Select Language"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Globe className="w-5 h-5" />
        <span className="text-sm font-medium hidden sm:block">
          {languages.find(lang => lang.code === currentLanguage)?.flag}
        </span>
      </button>

      {isOpen && (
        <>
          {/* Overlay for click-outside-to-close */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50">
            <div className="py-1">
              {languages.map((language) => (
                <button
                  key={language.code}
                  onClick={() => {
                    changeLanguage(language.code);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-3 ${
                    currentLanguage === language.code 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                  role="menuitem"
                  aria-current={currentLanguage === language.code ? 'true' : 'false'}
                >
                  <span className="text-lg">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{language.name}</span>
                    {currentLanguage === language.code && (
                      <span className="text-xs text-blue-500 dark:text-blue-400">Current</span>
                    )}
                  </div>
                  {currentLanguage === language.code && (
                    <span className="ml-auto text-blue-500">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSelector;