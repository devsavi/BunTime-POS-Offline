import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const BusinessContext = createContext();

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) {
    throw new Error('useBusiness must be used within a BusinessProvider');
  }
  return context;
};

export const BusinessProvider = ({ children }) => {
  const [businessType, setBusinessType] = useState('grocery');
  const [businessSettings, setBusinessSettings] = useState({
    name: 'Bun Time',
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

  const businessTypes = {
    grocery: {
      name: 'Grocery Store',
      icon: '🛒',
      features: ['barcode', 'weight'],
      customFields: ['weight', 'unit']
    },
    pharmacy: {
      name: 'Pharmacy',
      icon: '💊',
      features: ['prescription', 'expiry', 'batch'],
      customFields: ['prescription', 'expiryDate', 'batchNumber']
    },
    hardware: {
      name: 'Hardware Store',
      icon: '🔧',
      features: ['bulk', 'pricing', 'measurements'],
      customFields: ['measurements', 'material']
    },
    restaurant: {
      name: 'Restaurant',
      icon: '🍽️',
      features: ['tables', 'kitchen', 'categories'],
      customFields: ['tableNumber', 'category', 'cookingTime']
    },
    textile: {
      name: 'Textile Shop',
      icon: '👕',
      features: ['variations', 'sizes', 'colors'],
      customFields: ['size', 'color', 'material']
    }
  };

  // Load business settings from localStorage
  useEffect(() => {
    const loadBusinessSettings = () => {
      try {
        const savedBusinessType = localStorage.getItem('pos_business_type') || 'grocery';
        const savedBusinessSettings = JSON.parse(localStorage.getItem('pos_business_settings') || '{}');
        
        // Ensure all required fields are present
        const mergedSettings = {
          ...businessSettings, // Keep default values
          ...savedBusinessSettings // Override with saved values
        };
        
        setBusinessType(savedBusinessType);
        setBusinessSettings(mergedSettings);
        
        console.log('Business settings loaded:', mergedSettings); // Debug log
      } catch (error) {
        console.error('Error loading business settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBusinessSettings();
  }, []);

  const changeBusinessType = (type) => {
    setBusinessType(type);
    localStorage.setItem('pos-business-type', type);
    toast.success('Business type changed successfully!');
  };

  const updateBusinessSettings = async (settings) => {
    try {
      const newSettings = {
        ...businessSettings,
        ...settings,
        updatedAt: new Date().toISOString()
      };
      
      // Save to state
      setBusinessSettings(newSettings);
      
      // Save to localStorage with correct key
      localStorage.setItem('pos_business_settings', JSON.stringify(newSettings));
      
      console.log('Business settings saved:', newSettings); // Debug log
      toast.success('Business settings saved successfully!');
      return { success: true, settings: newSettings };
    } catch (error) {
      console.error('Error saving business settings:', error);
      toast.error('Error saving business settings: ' + error.message);
      return { success: false, error: error.message };
    }
  };

  const getCurrentBusinessConfig = () => businessTypes[businessType];

  const value = {
    businessType,
    businessTypes,
    businessSettings,
    loading,
    changeBusinessType,
    updateBusinessSettings,
    getCurrentBusinessConfig
  };

  return (
    <BusinessContext.Provider value={value}>
      {children}
    </BusinessContext.Provider>
  );
};
