import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const MultiShopContext = createContext();

export const useMultiShop = () => {
  const context = useContext(MultiShopContext);
  if (!context) {
    throw new Error('useMultiShop must be used within a MultiShopProvider');
  }
  return context;
};

export const MultiShopProvider = ({ children }) => {
  const [shops, setShops] = useState([]);
  const [currentShop, setCurrentShop] = useState(null);
  const [userShops, setUserShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, userProfile, canManageShops } = useAuth();

  // Initialize shops and user shop access
  useEffect(() => {
    if (!currentUser || !userProfile) {
      console.log('Missing current user or user profile, clearing shops state');
      setShops([]);
      setUserShops([]);
      setCurrentShop(null);
      setLoading(false);
      return;
    }

    // Additional validation for user profile
    if (!userProfile.isActive) {
      console.log('User profile is not active, clearing shops state');
      setShops([]);
      setUserShops([]);
      setCurrentShop(null);
      setLoading(false);
      return;
    }

    try {
      // Load shops from localStorage
      const shopsData = JSON.parse(localStorage.getItem('shops') || '[]');
      setShops(shopsData);
      
      // Filter user shops based on role and assignments
      if (userProfile.role === 'super_admin') {
        setUserShops(shopsData);
      } else if (userProfile.assignedShops && Array.isArray(userProfile.assignedShops) && userProfile.assignedShops.length > 0) {
        const filteredShops = shopsData.filter(shop => 
          userProfile.assignedShops.includes(shop.id)
        );
        setUserShops(filteredShops);
      } else {
        // User has no shop assignments
        setUserShops([]);
      }
      
      // Set current shop if not already set
      if (!currentShop && shopsData.length > 0) {
        if (userProfile.role === 'super_admin') {
          setCurrentShop(shopsData[0]);
        } else if (userProfile.assignedShops && Array.isArray(userProfile.assignedShops) && userProfile.assignedShops.length > 0) {
          const primaryShop = shopsData.find(shop => shop.id === userProfile.primaryShop);
          const firstAssignedShop = shopsData.find(shop => userProfile.assignedShops.includes(shop.id));
          setCurrentShop(primaryShop || firstAssignedShop || null);
        }
      }
    } catch (error) {
      console.error('Error loading shops:', error);
      toast.error('Failed to load shops');
    } finally {
      setLoading(false);
    }
  }, [currentUser, userProfile]);

  // Create a new shop (admin only)
  const createShop = async (shopData) => {
    try {
      if (!canManageShops()) {
        throw new Error('Only super administrators can create shops');
      }

      const newShop = {
        ...shopData,
        id: `shop_${Date.now()}`,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        settings: {
          currency: 'LKR',
          taxRate: 0,
          receiptFooter: '',
          allowNegativeStock: false,
          autoGenerateSKU: true,
          ...shopData.settings
        }
      };

      const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
      existingShops.push(newShop);
      localStorage.setItem('shops', JSON.stringify(existingShops));
      
      // Initialize shop-specific collections
      localStorage.setItem(`${newShop.id}_products`, '[]');
      localStorage.setItem(`${newShop.id}_customers`, '[]');
      localStorage.setItem(`${newShop.id}_suppliers`, '[]');
      
      toast.success(`Shop "${shopData.name}" created successfully!`);
      return { success: true, id: newShop.id };
    } catch (error) {
      console.error('Error creating shop:', error);
      toast.error('Failed to create shop: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  // Initialize shop-specific collections
  const initializeShopCollections = async (shopId) => {
    try {
      const collections = ['products', 'customers', 'suppliers'];
      for (const collectionName of collections) {
        localStorage.setItem(`${shopId}_${collectionName}`, '[]');
      }
    } catch (error) {
      console.error('Error initializing shop collections:', error);
      // Don't throw error as this is not critical
    }
  };

  // Update shop information
  const updateShop = async (shopId, updates) => {
    try {
      // Check permissions: super_admin can update any shop, shop_admin can update assigned shops
      const canUpdate = userProfile.role === 'super_admin' || 
                       (userProfile.role === 'shop_admin' && 
                        userProfile.assignedShops && 
                        Array.isArray(userProfile.assignedShops) && 
                        userProfile.assignedShops.includes(shopId));
      
      if (!canUpdate) {
        throw new Error('You do not have permission to update this shop');
      }

      const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
      const shopIndex = existingShops.findIndex(shop => shop.id === shopId);
      
      if (shopIndex === -1) {
        throw new Error('Shop not found');
      }

      existingShops[shopIndex] = {
        ...existingShops[shopIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.uid
      };

      localStorage.setItem('shops', JSON.stringify(existingShops));
      toast.success('Shop updated successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error updating shop:', error);
      toast.error('Failed to update shop: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  // Delete shop (admin only)
  const deleteShop = async (shopId) => {
    try {
      if (!canManageShops()) {
        throw new Error('Only super administrators can delete shops');
      }

      // Remove shop from shops list
      const existingShops = JSON.parse(localStorage.getItem('shops') || '[]');
      const updatedShops = existingShops.filter(shop => shop.id !== shopId);
      localStorage.setItem('shops', JSON.stringify(updatedShops));

      // Clean up shop-specific collections
      const collections = ['products', 'customers', 'suppliers', 'grns', 'notifications'];
      for (const collection of collections) {
        localStorage.removeItem(`${shopId}_${collection}`);
      }
      
      // If current shop is being deleted, switch to another shop
      if (currentShop && currentShop.id === shopId) {
        const remainingShops = shops.filter(shop => shop.id !== shopId);
        setCurrentShop(remainingShops.length > 0 ? remainingShops[0] : null);
      }

      toast.success('Shop deleted successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error deleting shop:', error);
      toast.error('Failed to delete shop: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  // Switch current shop
  const switchShop = (shop) => {
    if (!shop) return;
    
    // Check if user has access to this shop
    let hasAccess = false;
    
    if (userProfile.role === 'super_admin') {
      hasAccess = true;
    } else if (userProfile.assignedShops && Array.isArray(userProfile.assignedShops)) {
      hasAccess = userProfile.assignedShops.includes(shop.id);
    }
    
    if (!hasAccess) {
      toast.error('You do not have access to this shop');
      return;
    }

    setCurrentShop(shop);
    toast.success(`Switched to ${shop.name}`);
  };

  // Get shop-specific collection data
  const getShopCollection = (collectionName, shopId = null) => {
    const targetShopId = shopId || (currentShop ? currentShop.id : null);
    if (!targetShopId) {
      throw new Error('No shop selected');
    }
    return JSON.parse(localStorage.getItem(`${targetShopId}_${collectionName}`) || '[]');
  };

  // Get shop-specific document data
  const getShopDoc = (collectionName, docId, shopId = null) => {
    const targetShopId = shopId || (currentShop ? currentShop.id : null);
    if (!targetShopId) {
      throw new Error('No shop selected');
    }
    const collection = JSON.parse(localStorage.getItem(`${targetShopId}_${collectionName}`) || '[]');
    return collection.find(doc => doc.id === docId);
  };

  // Check if user can access specific shop
  const canAccessShop = (shopId) => {
    if (!userProfile) return false;
    return userProfile.role === 'super_admin' || 
           (userProfile.assignedShops && Array.isArray(userProfile.assignedShops) && userProfile.assignedShops.includes(shopId));
  };

  // Get shops accessible to current user
  const getAccessibleShops = () => {
    return userShops;
  };

  // Get all shops (admin only)
  const getAllShops = () => {
    if (userProfile && userProfile.role === 'super_admin') {
      return shops;
    }
    return userShops;
  };

  const value = {
    // State
    shops,
    currentShop,
    userShops,
    loading,
    
    // Shop management
    createShop,
    updateShop,
    deleteShop,
    switchShop,
    
    // Utility functions
    getShopCollection,
    getShopDoc,
    canAccessShop,
    getAccessibleShops,
    getAllShops,
    
    // Computed values
    isMultiShopMode: shops.length > 1,
    hasShopAccess: userShops.length > 0
  };

  return (
    <MultiShopContext.Provider value={value}>
      {children}
    </MultiShopContext.Provider>
  );
};