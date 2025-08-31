import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useReturns } from '../../contexts/ReturnsContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Package,
  Receipt,
  BarChart3,
  Settings,
  ShoppingCart,
  Users,
  UserCog,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Truck,
  X,
  Info,
  Store
} from 'lucide-react';

const Sidebar = ({ isCollapsed, onToggle, isMobileOpen, onMobileClose }) => {
  const { canManageUsers, canAccessGlobalSettings, canManageReturns } = useAuth();
  const { getPendingReturns } = useReturns();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  const pendingReturnsCount = getPendingReturns().length;

  const navigationItems = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      show: true
    },
    {
      name: t('billing'),
      href: '/dashboard/billing',
      icon: Receipt,
      show: true
    },
    {
      name: t('inventory'),
      href: '/dashboard/inventory',
      icon: Package,
      show: true
    },
    // {
    //   name: t('suppliers'),
    //   href: '/dashboard/suppliers',
    //   icon: Truck,
    //   show: true
    // },
    {
      name: t('customers'),
      href: '/dashboard/customers',
      icon: Users,
      show: true
    },
    {
      name: t('returns'),
      href: '/dashboard/returns',
      icon: RotateCcw,
      show: true,
      badge: canManageReturns() && pendingReturnsCount > 0 ? pendingReturnsCount : null
    },
    {
      name: t('reports'),
      href: '/dashboard/reports',
      icon: BarChart3,
      show: true
    },
    {
      name: t('users'),
      href: '/dashboard/users',
      icon: UserCog,
      show: canManageUsers()
    },
    {
      name: t('settings'),
      href: '/dashboard/settings',
      icon: Settings,
      show: true
    },
    {
      name: t('about'),
      href: '/dashboard/about',
      icon: Info,
      show: true
    }
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <div className={`bg-white dark:bg-gray-800 shadow-lg h-screen fixed left-0 top-0 z-30 transition-all duration-300 border-r border-gray-200 dark:border-gray-700 hidden lg:flex lg:flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        {/* Header */}
        <div className="flex-shrink-0 p-4">
          <div className="flex items-center justify-between">
            {/* Logo and title */}
            <div className={`flex flex-col items-center transition-all duration-300 overflow-hidden ${
              isCollapsed ? 'w-8' : 'w-full'
            }`}>
              {shopSettings.navLogoBase64 ? (
                <img
                  src={shopSettings.navLogoBase64}
                  alt="Shop Logo"
                  className={`object-contain flex-shrink-0 transition-all duration-300 ${
                    isCollapsed ? 'w-8 h-8' : 'w-32 h-auto max-h-16'
                  }`}
                />
              ) : (
                <ShoppingCart className={`text-blue-600 dark:text-blue-400 flex-shrink-0 transition-all duration-300 ${
                  isCollapsed ? 'w-8 h-8' : 'w-16 h-16'
                }`} />
              )}
              
              {!isCollapsed && (
                <span className="text-lg font-bold text-gray-900 dark:text-white text-center mt-2 whitespace-nowrap">
                  {shopSettings.name || 'Kashero POS-System'}
                </span>
              )}
            </div>
            
            {/* Toggle button */}
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex-shrink-0 group"
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 px-4 pb-4 overflow-x-hidden overflow-y-auto overscroll-contain sidebar-scroll ${isCollapsed ? '' : ''}`}>
          <div className="space-y-2">
            {navigationItems.filter(item => item.show).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/dashboard'}
                className={({ isActive }) => {
                  const baseClasses = "flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group relative";
                  
                  if (isActive) {
                    // When collapsed: no background, only icon color change
                    // When expanded: full background highlight
                    if (isCollapsed) {
                      return `${baseClasses} text-gray-600 dark:text-gray-300`;
                    } else {
                      return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-r-2 border-blue-700 dark:border-blue-400`;
                    }
                  }
                  
                  return `${baseClasses} text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`;
                }}
                title={isCollapsed ? item.name : ''}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex-shrink-0">
                      <item.icon className={`w-5 h-5 transition-colors ${
                        isActive
                          ? (isCollapsed 
                              ? 'text-blue-600 dark:text-blue-400' // Collapsed active: blue icon only
                              : 'text-blue-700 dark:text-blue-400') // Expanded active: blue icon with background
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                      }`} />
                      
                      {/* Badge for notifications */}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    
                    <span className={`ml-3 transition-all duration-300 whitespace-nowrap ${
                      isCollapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                    }`}>
                      {item.name}
                    </span>
                    
                    {/* Badge for expanded state */}
                    {item.badge && !isCollapsed && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                    
                    {/* Tooltip for collapsed state */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                        {item.name}
                        {item.badge && (
                          <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-1">
                            {item.badge}
                          </span>
                        )}
                        <div className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-2 border-b-2 border-r-2 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`text-center text-xs text-gray-500 dark:text-gray-400 transition-opacity duration-300 ${isCollapsed ? 'opacity-0' : 'opacity-100'}`}>
            <p>Created by</p>
            {/* <p className="font-bold">Savindu Weththasinghe</p> */}
            <span>
            <a 
              href="https://my-portfolio-kappa-ochre.vercel.app/"
              target='_blank'
              rel='noopener noreferrer'
              className='font-bold'
              >
              Savindu Weththasinghe
            </a>
          </span>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`bg-white dark:bg-gray-800 shadow-lg h-screen fixed left-0 top-0 z-50 transition-transform duration-300 border-r border-gray-200 dark:border-gray-700 lg:hidden w-80 max-w-[85vw] flex flex-col ${
        isMobileOpen ? 'transform-none' : '-translate-x-full'
      }`}>
        {/* Mobile Header */}
        <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              {shopSettings.navLogoBase64 ? (
                <img
                  src={shopSettings.navLogoBase64}
                  alt="Shop Logo"
                  className="w-24 h-auto max-h-12 object-contain flex-shrink-0"
                />
              ) : (
                <ShoppingCart className="w-12 h-12 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              )}
              <span className="text-base font-bold text-gray-900 dark:text-white text-center mt-2">
                {shopSettings.name || 'Kashero POS-System'}
              </span>
            </div>
            
            <button
              onClick={onMobileClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Close menu"
            >
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation - Scrollable */}
        <nav className="flex-1 px-4 py-4 overflow-y-auto overscroll-contain sidebar-scroll">
          <div className="space-y-2">
            {navigationItems.filter(item => item.show).map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                end={item.href === '/dashboard'}
                onClick={onMobileClose}
                className={({ isActive }) => {
                  const baseClasses = "flex items-center px-4 py-4 rounded-lg text-base font-medium transition-all duration-200 group relative btn-touch";
                  
                  if (isActive) {
                    return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400`;
                  }
                  
                  return `${baseClasses} text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white`;
                }}
              >
                {({ isActive }) => (
                  <>
                    <div className="relative flex-shrink-0">
                      <item.icon className={`w-6 h-6 transition-colors ${
                        isActive 
                          ? 'text-blue-700 dark:text-blue-400'
                          : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-200'
                      }`} />
                      
                      {/* Badge for notifications */}
                      {item.badge && (
                        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {item.badge > 9 ? '9+' : item.badge}
                        </span>
                      )}
                    </div>
                    
                    <span className="ml-4 whitespace-nowrap">
                      {item.name}
                    </span>
                    
                    {/* Badge for mobile */}
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-sm rounded-full px-2 py-1">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Mobile Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center text-sm text-gray-500 dark:text-gray-400">
            <p>Created by</p>
            {/* <p className="font-bold">Savindu Weththasinghe</p> */}
            <span>
            <a 
              href="https://my-portfolio-kappa-ochre.vercel.app/"
              target='_blank'
              rel='noopener noreferrer'
              className='font-bold'
              >
              Savindu Weththasinghe
            </a>
          </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;