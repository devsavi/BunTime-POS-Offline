import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCustomers, saveCustomers } from '../services/localStorage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const CustomerContext = createContext();

export const useCustomer = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};

export const CustomerProvider = ({ children }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setCustomers([]);
      setLoading(false);
      return;
    }

    try {
      // Load customers from localStorage
      const allCustomers = getCustomers();
      setCustomers(allCustomers);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const updateCustomerPurchase = async (customerId, purchaseAmount) => {
    try {
      const allCustomers = getCustomers();
      const customerIndex = allCustomers.findIndex(c => c.id === customerId);
      
      if (customerIndex !== -1) {
        const updatedCustomers = [...allCustomers];
        updatedCustomers[customerIndex] = {
          ...updatedCustomers[customerIndex],
          totalPurchases: (updatedCustomers[customerIndex].totalPurchases || 0) + purchaseAmount,
          lastVisit: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        saveCustomers(updatedCustomers);
        setCustomers(prev => prev.map(c =>
          c.id === customerId
            ? {
                ...c,
                totalPurchases: (c.totalPurchases || 0) + purchaseAmount,
                lastVisit: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Error updating customer purchase:', error);
      toast.error('Failed to update customer purchase history');
    }
  };

  const searchCustomers = (searchTerm) => {
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone?.includes(searchTerm) ||
      customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const addCustomer = async (customerData) => {
    try {
      const newCustomer = {
        ...customerData,
        id: `customer_${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid,
        totalPurchases: 0
      };

      const allCustomers = getCustomers();
      const updatedCustomers = [...allCustomers, newCustomer];
      
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      
      return { success: true, customer: newCustomer };
    } catch (error) {
      console.error('Error adding customer:', error);
      toast.error('Failed to add customer');
      return { success: false, error: error.message };
    }
  };

  const updateCustomer = async (customerId, updates) => {
    try {
      const allCustomers = getCustomers();
      const customerIndex = allCustomers.findIndex(c => c.id === customerId);
      
      if (customerIndex === -1) {
        throw new Error('Customer not found');
      }

      const updatedCustomer = {
        ...allCustomers[customerIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      allCustomers[customerIndex] = updatedCustomer;
      
      saveCustomers(allCustomers);
      setCustomers(allCustomers);
      
      return { success: true, customer: updatedCustomer };
    } catch (error) {
      console.error('Error updating customer:', error);
      toast.error('Failed to update customer');
      return { success: false, error: error.message };
    }
  };

  const deleteCustomer = async (customerId) => {
    try {
      const allCustomers = getCustomers();
      const updatedCustomers = allCustomers.filter(c => c.id !== customerId);
      
      saveCustomers(updatedCustomers);
      setCustomers(updatedCustomers);
      
      return { success: true };
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast.error('Failed to delete customer');
      return { success: false, error: error.message };
    }
  };

  const value = {
    customers,
    loading,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    updateCustomerPurchase,
    searchCustomers
  };

  return (
    <CustomerContext.Provider value={value}>
      {children}
    </CustomerContext.Provider>
  );
};