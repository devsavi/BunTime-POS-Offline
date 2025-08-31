import React, { createContext, useContext, useState, useEffect } from 'react';
import { getReturns, saveReturns, generateId } from '../services/localStorage';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';

import toast from 'react-hot-toast';

const ReturnsContext = createContext();

export const useReturns = () => {
  const context = useContext(ReturnsContext);
  if (!context) {
    throw new Error('useReturns must be used within a ReturnsProvider');
  }
  return context;
};

export const ReturnsProvider = ({ children }) => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { updateStock, products } = useInventory();

  useEffect(() => {
    if (!currentUser) {
      setReturns([]);
      setLoading(false);
      return;
    }

    try {
      // Load returns from localStorage
      const allReturns = getReturns();
      const sortedReturns = allReturns.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      setReturns(sortedReturns);
    } catch (error) {
      console.error('Error loading returns:', error);
      toast.error('Failed to load returns');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const validateReturnQuantities = (returnItems) => {
    const errors = [];
    
    for (const item of returnItems) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        errors.push(`Product "${item.productName}" not found in inventory`);
        continue;
      }
      
      const returnQty = parseFloat((parseFloat(item.quantity) || 0).toFixed(2));
      const availableQty = parseFloat((parseFloat(product.quantity) || 0).toFixed(2));
      
      if (returnQty > availableQty) {
        errors.push(`Cannot return ${returnQty} units of "${item.productName}". Only ${availableQty} units available in inventory.`);
      }
    }
    
    return errors;
  };

  const addReturn = async (returnData) => {
    try {
      // Validate return quantities
      const validationErrors = validateReturnQuantities(returnData.items);
      if (validationErrors.length > 0) {
        return { success: false, error: validationErrors[0] };
      }

      const returnId = generateId();
      const newReturn = {
        ...returnData,
        id: returnId,
        status: 'pending',

        createdAt: new Date().toISOString(),
        createdBy: currentUser.id,
        cashierEmail: currentUser.email
      };

      // Save to localStorage
      const allReturns = getReturns();
      saveReturns([...allReturns, newReturn]);
      setReturns(prev => [newReturn, ...prev]);
      
      return { success: true, id: returnId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const approveReturn = async (returnId) => {
    try {
      const returnItem = returns.find(r => r.id === returnId);
      if (!returnItem) {
        throw new Error('Return not found');
      }

      // Validate return quantities before approval
      const validationErrors = validateReturnQuantities(returnItem.items);
      if (validationErrors.length > 0) {
        return { success: false, error: 'Cannot approve return: ' + validationErrors[0] };
      }

      // Remove stock for each returned item (subtract from inventory)
      for (const item of returnItem.items) {
        const result = await updateStock(item.productId, item.quantity, 'subtract');
        if (!result.success) {
          throw new Error(`Failed to update stock for ${item.productName}: ${result.error}`);
        }
      }

      // Update return status in localStorage
      const allReturns = getReturns();
      const updatedReturns = allReturns.map(ret => 
        ret.id === returnId
          ? {
              ...ret,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser.id,
              adminEmail: currentUser.email
            }
          : ret
      );

      saveReturns(updatedReturns);
      setReturns(prev => prev.map(ret =>
        ret.id === returnId
          ? {
              ...ret,
              status: 'approved',
              approvedAt: new Date().toISOString(),
              approvedBy: currentUser.id,
              adminEmail: currentUser.email
            }
          : ret
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const rejectReturn = async (returnId, rejectionReason = '') => {
    try {
      const allReturns = getReturns();
      const updatedReturns = allReturns.map(ret =>
        ret.id === returnId
          ? {
              ...ret,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: currentUser.id,
              adminEmail: currentUser.email,
              rejectionReason
            }
          : ret
      );

      saveReturns(updatedReturns);
      setReturns(prev => prev.map(ret =>
        ret.id === returnId
          ? {
              ...ret,
              status: 'rejected',
              rejectedAt: new Date().toISOString(),
              rejectedBy: currentUser.id,
              adminEmail: currentUser.email,
              rejectionReason
            }
          : ret
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteReturn = async (returnId) => {
    try {
      const allReturns = getReturns();
      const updatedReturns = allReturns.filter(ret => ret.id !== returnId);
      
      saveReturns(updatedReturns);
      setReturns(prev => prev.filter(ret => ret.id !== returnId));
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const generateReturnNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `RET${year}${month}${day}${time}`;
  };

  const getPendingReturns = () => {
    return returns.filter(r => r.status === 'pending');
  };

  const getApprovedReturns = () => {
    return returns.filter(r => r.status === 'approved');
  };

  const getRejectedReturns = () => {
    return returns.filter(r => r.status === 'rejected');
  };

  const value = {
    returns,
    loading,
    addReturn,
    approveReturn,
    rejectReturn,
    deleteReturn,
    generateReturnNumber,
    getPendingReturns,
    getApprovedReturns,
    getRejectedReturns,
    validateReturnQuantities
  };

  return (
    <ReturnsContext.Provider value={value}>
      {children}
    </ReturnsContext.Provider>
  );
};