import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const ShopContext = createContext();

export const useShop = () => {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
};

export const ShopProvider = ({ children }) => {
  const [shopSettings, setShopSettings] = useState({
    name: 'Bun Time',
    branch: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    currency: 'LKR',
    registrationNo: '',
    receiptFooter: 'Thank you for shopping with us!',
    navLogoBase64: null,
    invoiceLogoBase64: null
  });
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  // Load shop settings from localStorage
  useEffect(() => {
    const loadShopSettings = () => {
      try {
        const savedShopSettings = JSON.parse(localStorage.getItem('pos_shop_settings') || '{}');
        
        // Default settings that should always exist
        const defaultSettings = {
          name: 'Bun Time',
          branch: '',
          description: '',
          address: '',
          phone: '',
          email: '',
          currency: 'LKR',
          registrationNo: '',
          receiptFooter: 'Thank you for shopping with us!',
          navLogoBase64: null,
          invoiceLogoBase64: null
        };
        
        // Merge in this order: defaults < saved settings
        const mergedSettings = {
          ...defaultSettings,
          ...savedShopSettings
        };
        
        // Log the settings for debugging
        console.log('Loading shop settings:', {
          mergedSettings: mergedSettings
        });
        
        setShopSettings(mergedSettings);
      } catch (error) {
        console.error('Error loading shop settings:', error);
        // If there's an error, ensure we at least have the default settings
        setShopSettings({
          name: 'Bun Time',
          branch: '',
          description: '',
          address: '',
          phone: '',
          email: '',
          currency: 'LKR',
          registrationNo: '',
          receiptFooter: 'Thank you for shopping with us!',
          navLogoBase64: null,
          invoiceLogoBase64: null
        });
      } finally {
        setLoading(false);
      }
    };

    loadShopSettings();
  }, []);

  const updateShopSettings = async (settings) => {
    try {
      const newSettings = {
        ...shopSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      // Save to state
      setShopSettings(newSettings);
      
      // Save to localStorage with correct key
      localStorage.setItem('pos_shop_settings', JSON.stringify(newSettings));
      
      console.log('Shop settings saved:', newSettings); // Debug log
      toast.success('Shop settings saved successfully!');
      return { success: true, settings: newSettings };
    } catch (error) {
      console.error('Error saving shop settings:', error);
      toast.error('Error saving shop settings: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const value = {
    shopSettings,
    loading,
    updateShopSettings
  };

  return (
    <ShopContext.Provider value={value}>
      {children}
    </ShopContext.Provider>
  );
};