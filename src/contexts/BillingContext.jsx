import React, { createContext, useContext, useState, useEffect } from 'react';
import { getBills, saveBills, generateId } from '../services/localStorage';
import { useAuth } from './AuthContext';
import { useInventory } from './InventoryContext';
import toast from 'react-hot-toast';

const BillingContext = createContext();

// Default shop configuration
const DEFAULT_SHOP = {
  id: 'default-shop',
  name: 'Default Shop'
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (!context) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};

export const BillingProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCashier, setSelectedCashier] = useState(null);
  const { currentUser, userProfile } = useAuth();
  const { updateStock, products } = useInventory();

  useEffect(() => {
    if (!currentUser) {
      setBills([]);
      setLoading(false);
      return;
    }

    try {
      // Load bills from localStorage
      const allBills = getBills();
      // Sort bills by createdAt in descending order
      allBills.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      
      console.log(`Loaded ${allBills.length} bills`);
      setBills(allBills);
    } catch (error) {
      console.error('Error loading bills:', error);
      toast.error('Failed to load bills');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const addToCart = (product, quantity = 1, customPrice = null) => {
    // Skip stock check for manual products - COMMENTED OUT MANUAL PRODUCT LOGIC
    // if (!product.isManual) {
      const availableStock = parseFloat(product.quantity || 0);
      const existingItem = cart.find(item => item.id === product.id);
      const currentCartQuantity = existingItem ? existingItem.quantity : 0;
      const totalRequestedQuantity = currentCartQuantity + quantity;
      
      if (totalRequestedQuantity > availableStock) {
        toast.error(`Insufficient stock for ${product.name}. Available: ${availableStock}, In cart: ${currentCartQuantity}`);
        return;
      }
    // }
    
    // const existingItem = cart.find(item => item.id === product.id); // Removed duplicate declaration
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      ));
    } else {
      setCart([...cart, {
        ...product,
        quantity,
        originalPrice: product.price,
        price: customPrice || product.price
      }]);
    }
  };

  const updateCartItem = (productId, updates) => {
    const processedUpdates = { ...updates };
    
    // Ensure numeric fields are properly converted
    if (processedUpdates.quantity !== undefined) {
      processedUpdates.quantity = parseFloat((parseFloat(processedUpdates.quantity) || 0).toFixed(3));
    }
    if (processedUpdates.price !== undefined) {
      processedUpdates.price = parseFloat(processedUpdates.price) || 0;
    }
    
    // Check stock if quantity is being updated
    if (processedUpdates.quantity !== undefined) {
      const cartItem = cart.find(item => item.id === productId);
      // COMMENTED OUT MANUAL PRODUCT LOGIC
      // if (cartItem && !cartItem.isManual) {
      if (cartItem) {
        const currentProduct = products.find(p => p.id === productId);
        if (currentProduct) {
          const availableStock = parseFloat(currentProduct.quantity || 0);
          
          if (processedUpdates.quantity > availableStock) {
            toast.error(`Insufficient stock for ${cartItem.name}. Available: ${availableStock}, Requested: ${processedUpdates.quantity}`);
            return;
          }
        }
      }
    }
    
    setCart(cart.map(item =>
      item.id === productId ? { ...item, ...processedUpdates } : item
    ));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const applyDiscount = (discountAmount, discountType = 'amount') => {
    const total = calculateTotal();
    if (discountType === 'percentage') {
      return total * (discountAmount / 100);
    }
    return discountAmount;
  };

  const deleteBill = async (billId) => {
    try {
      const allBills = getBills();
      const updatedBills = allBills.filter(bill => bill.id !== billId);
      saveBills(updatedBills);
      setBills(prev => prev.filter(bill => bill.id !== billId));
      return { success: true };
    } catch (error) {
      console.error('Error deleting bill:', error);
      return { success: false, error: error.message };
    }
  };

  const processBill = async (customerInfo, paymentInfo, discountInfo = {}) => {
    try {
      if (cart.length === 0) {
        throw new Error('Cart is empty');
      }

      // Check stock availability before processing
      for (const item of cart) {
        // Skip stock check for manual products - COMMENTED OUT MANUAL PRODUCT LOGIC
        // if (!item.isManual) {
          // Find the current product in inventory to get latest stock
          const currentProduct = products.find(p => p.id === item.id);
          if (currentProduct) {
            const availableStock = parseFloat(currentProduct.quantity || 0);
            const requestedQuantity = parseFloat(item.quantity || 0);
            
            if (requestedQuantity > availableStock) {
              throw new Error(`Insufficient stock for ${item.name}. Available: ${availableStock}, Requested: ${requestedQuantity}`);
            }
          }
        // }
      }

      const subtotal = calculateTotal();
      const discountAmount = discountInfo.amount || 0;
      const total = subtotal - discountAmount;

      // Update stock for each item (skip manual products) - COMMENTED OUT MANUAL PRODUCT LOGIC
      for (const item of cart) {
        // Skip inventory update for manual products
        // if (!item.isManual) {
          await updateStock(item.id, item.quantity, 'subtract');
        // }
      }

      // Create bill document
      const billData = {
        items: cart,
        subtotal,
        discount: {
          amount: discountAmount,
          type: discountInfo.type || 'amount'
        },
        total,
        customer: customerInfo || null,
        payment: paymentInfo,
        cashier: selectedCashier ? {
          id: selectedCashier.id,
          name: selectedCashier.name
        } : {
          id: currentUser.uid,
          name: userProfile?.name || currentUser.email
        },
        shopId: DEFAULT_SHOP.id, // Add shop reference
        createdAt: new Date().toISOString(),
        billNumber: generateBillNumber()
      };

      // Save to localStorage
      const billId = generateId();
      const newBill = { ...billData, id: billId };
      const allBills = getBills();
      saveBills([...allBills, newBill]);
      setBills(prev => [newBill, ...prev]);
      
      clearCart();
      
      return { 
        success: true, 
        billId: billId,
        billData: newBill 
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `${year}${month}${day}${time}`;
  };

  const value = {
    cart,
    bills,
    loading,
    selectedCashier,
    setSelectedCashier,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    calculateTotal,
    applyDiscount,
    processBill,
    deleteBill,
    generateBillNumber
  };

  return (
    <BillingContext.Provider value={value}>
      {children}
    </BillingContext.Provider>
  );
};