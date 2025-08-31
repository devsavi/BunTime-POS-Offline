import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTheme } from '../../contexts/ThemeContext';

import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import LanguageSelector from './LanguageSelector';
import NotificationCenter from '../notifications/NotificationCenter';
import { Store, Sun, Moon, Bell, Menu, User } from 'lucide-react';
import UserSelector from '../billing/UserSelector';
import { useBilling } from '../../contexts/BillingContext';

const Header = ({ onMobileMenuToggle }) => {
  const { currentUser, isAdmin } = useAuth();
  const { shopSettings } = useShop();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCashierSelector, setShowCashierSelector] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const mobileMenuRef = useRef(null);
  const { selectedCashier, setSelectedCashier } = useBilling();
  // Close mobile menu on outside click
  useEffect(() => {
    if (!showMobileMenu) return;
    function handleClickOutside(event) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMobileMenu]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Check for unread notifications from localStorage
  useEffect(() => {
    if (!currentUser) return;

    const checkUnreadNotifications = () => {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      let count = notifications.filter(notification => (
        (notification.recipientType === 'all' || 
         (notification.recipientType === 'specific' && notification.recipientId === currentUser.uid) ||
         (notification.recipientType === 'role' && notification.recipientRole === (isAdmin() ? 'admin' : 'cashier'))) &&
        notification.senderId !== currentUser.uid &&
        !notification.readBy?.includes(currentUser.uid)
      )).length;
      setUnreadCount(count);
    };

    checkUnreadNotifications();
    window.addEventListener('storage', checkUnreadNotifications);
    
    return () => window.removeEventListener('storage', checkUnreadNotifications);
  }, [currentUser, isAdmin]);

  return (
    <header className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700 sticky top-0 z-20 flex-shrink-0">
      <div className="container-responsive py-3 lg:py-4">
        <div className="flex items-center justify-between">
          {/* Mobile menu button */}
          <button
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors btn-touch"
            title="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Shop info - hidden on mobile, shown on larger screens */}
          <div className="hidden sm:flex items-center space-x-3 lg:space-x-4 min-w-0 flex-1">
            {/* Navigation Logo */}
            {shopSettings.navLogoBase64 ? (
              <img
                src={shopSettings.navLogoBase64}
                alt="Business Logo"
                className="h-8 lg:h-10 w-auto object-contain flex-shrink-0"
              />
            ) : (
              <Store className="w-5 h-5 lg:w-6 lg:h-6 text-blue-600 dark:text-blue-400 flex-shrink-0" />
            )}
            
            <div className="min-w-0 flex-1">
              <h1 className="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {shopSettings.name}
              </h1>
              <div className="text-xs lg:text-sm text-gray-500 dark:text-gray-400 flex items-center truncate">
                <span className="mr-2">{currentDateTime.toLocaleTimeString()}</span>
                <span>{currentDateTime.toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            {/* Cashier selector */}
            <button
              onClick={() => setShowCashierSelector(true)}
              className={`hidden sm:flex items-center justify-center space-x-2 px-4 py-2 ${
                selectedCashier 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              } text-white rounded-lg transition-colors text-sm`}
            >
              <User className="w-4 h-4" />
              <span>{selectedCashier ? `Cashier: ${selectedCashier.name}` : 'Select Cashier'}</span>
            </button>

            {/* Language selector - hidden on mobile */}
            <div className="hidden sm:block">
              <LanguageSelector />
            </div>
            
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(true)}
                className="flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors relative btn-touch"
                title={t('notifications')}
              >
                <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors btn-touch"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-600" />
              )}
            </button>
            {/* Mobile menu toggle */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden flex items-center justify-center p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors btn-touch"
            >
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile user menu */}
        {showMobileMenu && (
          <div ref={mobileMenuRef} className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
            {/* Mobile Actions */}
            <div className="flex justify-center">
              <div className="sm:hidden">
                <LanguageSelector />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Notification Center */}
      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Cashier Selector Modal */}
      <UserSelector
        isOpen={showCashierSelector}
        onClose={() => setShowCashierSelector(false)}
        onSelectUser={(user) => {
          setSelectedCashier(user);
          toast.success(`Selected cashier: ${user.name}`);
          setShowCashierSelector(false);
        }}
        title="Select Cashier"
        addNewLabel="Add New Cashier"
        searchPlaceholder="Search cashiers..."
      />
    </header>
  );
};

export default Header;