import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Default values for a super admin user
  const defaultUser = {
    uid: 'default_user',
    email: 'admin@example.com',
    name: 'Admin',
    role: 'super_admin',
    isActive: true
  };

  const [currentUser, setCurrentUser] = useState(defaultUser);
  const [userRole] = useState('super_admin');
  const [userProfile] = useState(defaultUser);
  const [loading, setLoading] = useState(false);

  // Role check functions - all return true since we're using a super admin account
  const isAdmin = () => true;
  const isSuperAdmin = () => true;
  const isCashier = () => true;
  
  // Permission check functions - all return true
  const canViewInventory = () => true;
  const canManageInventory = () => true;
  const canManageUsers = () => true;
  const canAccessGlobalSettings = () => true;
  const canManageReturns = () => true;

  const login = async () => ({ success: true });
  const logout = async () => {};

  const value = {
    currentUser,
    userRole,
    userProfile,
    login,
    logout,
    isAdmin,
    isSuperAdmin,
    isCashier,
    canViewInventory,
    canManageInventory,
    canManageUsers,
    canAccessGlobalSettings,
    canManageReturns,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};