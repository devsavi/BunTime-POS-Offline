import React, { createContext, useContext, useState, useEffect } from 'react';
import { getInventory, saveInventory, generateId } from '../services/localStorage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const InventoryContext = createContext();

// Default shop configuration
const DEFAULT_SHOP = {
  id: 'default-shop',
  name: 'Default Shop'
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};

export const InventoryProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser) {
      setProducts([]);
      setLoading(false);
      return;
    }

    try {
      // Load all products from localStorage
      const allProducts = getInventory();
      setProducts(allProducts);
      console.log(`Loaded ${allProducts.length} products`);
    } catch (error) {
      console.error('Error loading products:', error);
      toast.error('Failed to load products: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const checkBarcodeUniqueness = (barcode, excludeProductId = null) => {
    if (!barcode || barcode.trim() === '') {
      return { isUnique: true };
    }

    try {
      const allProducts = getInventory();
      const existingProduct = allProducts.find(
        product => 
          product.barcode === barcode.trim() &&
          product.id !== excludeProductId
      );
      
      if (!existingProduct) {
        return { isUnique: true };
      }

      return {
        isUnique: false,
        error: `Barcode "${barcode}" already exists. Please use a different barcode.`
      };
    } catch (error) {
      console.error('Error checking barcode uniqueness:', error);
      return {
        isUnique: false,
        error: 'Error validating barcode. Please try again.'
      };
    }
  };

  const addProduct = async (productData) => {
    try {
      // Check barcode uniqueness if barcode is provided
      if (productData.barcode && productData.barcode.trim() !== '') {
        const barcodeCheck = checkBarcodeUniqueness(productData.barcode);
        if (!barcodeCheck.isUnique) {
          return { success: false, error: barcodeCheck.error };
        }
      }

      const productId = generateId();
      const newProduct = {
        ...productData,
        id: productId,
        // Store quantity as decimal number with 3 decimal places precision
        quantity: parseFloat((parseFloat(productData.quantity) || 0).toFixed(3)),
        price: parseFloat(productData.price) || 0,
        minStock: parseFloat((parseFloat(productData.minStock) || 5).toFixed(3)),
        weight: productData.weight ? parseFloat(productData.weight) : null,
        shopId: DEFAULT_SHOP.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };

      const allProducts = getInventory();
      saveInventory([...allProducts, newProduct]);
      setProducts(prev => [...prev, newProduct]);

      return { success: true, id: productId };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateProduct = async (productId, updates) => {
    try {
      // Check barcode uniqueness if barcode is being updated
      if (updates.barcode && updates.barcode.trim() !== '') {
        const barcodeCheck = checkBarcodeUniqueness(updates.barcode, productId);
        if (!barcodeCheck.isUnique) {
          return { success: false, error: barcodeCheck.error };
        }
      }

      // Ensure numeric fields are properly converted
      const processedUpdates = {
        ...updates,
        quantity: updates.quantity !== undefined ? parseFloat((parseFloat(updates.quantity) || 0).toFixed(3)) : undefined,
        price: updates.price !== undefined ? parseFloat(updates.price) || 0 : undefined,
        minStock: updates.minStock !== undefined ? parseFloat((parseFloat(updates.minStock) || 5).toFixed(3)) : undefined,
        weight: updates.weight !== undefined ? (updates.weight ? parseFloat(updates.weight) : null) : undefined,
        updatedAt: new Date().toISOString()
      };

      // Remove undefined values
      Object.keys(processedUpdates).forEach(key => {
        if (processedUpdates[key] === undefined) {
          delete processedUpdates[key];
        }
      });

      const allProducts = getInventory();
      const updatedProducts = allProducts.map(product =>
        product.id === productId ? { ...product, ...processedUpdates } : product
      );
      
      saveInventory(updatedProducts);
      setProducts(prev => prev.map(product =>
        product.id === productId ? { ...product, ...processedUpdates } : product
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const deleteProduct = async (productId) => {
    try {
      const allProducts = getInventory();
      const updatedProducts = allProducts.filter(product => product.id !== productId);
      
      saveInventory(updatedProducts);
      setProducts(prev => prev.filter(product => product.id !== productId));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const updateStock = async (productId, quantity, operation = 'subtract') => {
    try {
      const product = products.find(p => p.id === productId);
      if (!product) throw new Error('Product not found');

      const quantityChange = parseFloat((parseFloat(quantity) || 0).toFixed(3));
      const currentQuantity = parseFloat((parseFloat(product.quantity) || 0).toFixed(3));
      const newQuantity = operation === 'add'
        ? parseFloat((currentQuantity + quantityChange).toFixed(3))
        : parseFloat((currentQuantity - quantityChange).toFixed(3));

      if (newQuantity < 0) {
        throw new Error('Insufficient stock');
      }

      const allProducts = getInventory();
      const updatedProducts = allProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() }
          : p
      );

      saveInventory(updatedProducts);
      setProducts(prev => prev.map(p =>
        p.id === productId
          ? { ...p, quantity: newQuantity, updatedAt: new Date().toISOString() }
          : p
      ));

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const getLowStockProducts = () => {
    return products.filter(product => {
      const qty = parseFloat((parseFloat(product.quantity) || 0).toFixed(3));
      const minStock = parseFloat((parseFloat(product.minStock) || 5).toFixed(3));
      return qty > 0 && qty <= minStock;
    });
  };

  const getOutOfStockProducts = () => {
    return products.filter(product => {
      const qty = parseFloat((parseFloat(product.quantity) || 0).toFixed(3));
      return qty === 0;
    });
  };

  const searchProducts = (searchTerm) => {
    return products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(product.barcode || '').includes(searchTerm) ||
      String(product.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const value = {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    getLowStockProducts,
    getOutOfStockProducts,
    searchProducts,
    checkBarcodeUniqueness
  };

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
};