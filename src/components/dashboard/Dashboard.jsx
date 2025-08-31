import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import DashboardHome from './DashboardHome';
import Inventory from '../inventory/Inventory';
import Billing from '../billing/Billing';
import Reports from '../reports/Reports';
import Settings from '../settings/Settings';
import Customers from '../customers/Customers';
import Returns from '../returns/Returns';
import Suppliers from '../suppliers/Suppliers';
import Users from '../users/Users';
import About from '../about/About';
import { useAuth } from '../../contexts/AuthContext';

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { canManageUsers, canAccessShops, canAccessGlobalSettings } = useAuth();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      // Auto-close mobile menu on larger screens
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
      // Auto-collapse sidebar on medium screens
      if (window.innerWidth < 1280 && window.innerWidth >= 1024) {
        setSidebarCollapsed(true);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Mobile overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={closeMobileMenu}
      />
      
      {/* Sidebar */}
      <Sidebar 
        isCollapsed={sidebarCollapsed} 
        onToggle={toggleSidebar}
        isMobileOpen={mobileMenuOpen}
        onMobileClose={closeMobileMenu}
      />
      
      {/* Main content area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
        // Desktop: adjust margin based on sidebar state
        // Mobile: no margin (sidebar overlays)
        'lg:ml-0'
      } ${
        // Apply left margin only on large screens when sidebar is visible
        sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Header */}
        <Header onMobileMenuToggle={toggleMobileMenu} />
        
        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="container-responsive py-4 lg:py-6">
            <Routes>
              <Route path="/" element={<DashboardHome />} />
              <Route path="/inventory" element={<Inventory />} />
              <Route path="/billing" element={<Billing />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/returns" element={<Returns />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/users" element={canManageUsers() ? <Users /> : <Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={canAccessGlobalSettings() ? <Settings /> : <Navigate to="/dashboard" replace />} />
              <Route path="/about" element={<About />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;