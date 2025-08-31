import React from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';

// Smart number formatting function
const formatQuantity = (value) => {
  const num = parseFloat(value) || 0;
  // If it's a whole number, show as integer
  if (num % 1 === 0) {
    return num.toString();
  }
  // If it has decimals, show up to 3 decimal places, removing trailing zeros
  return parseFloat(num.toFixed(3)).toString();
};

const Cart = () => {
  const { cart, updateCartItem, removeFromCart, clearCart, calculateTotal } = useBilling();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  const updateQuantity = (productId, newQuantity) => {
    // Handle empty input - don't remove item, just set to 0 temporarily
    if (newQuantity === '' || newQuantity === null || newQuantity === undefined) {
      updateCartItem(productId, { quantity: 0 });
      return;
    }
    
    const parsedQuantity = parseFloat(newQuantity);
    
    // Only remove if user explicitly sets to 0 or negative, not on empty input
    if (parsedQuantity < 0) {
      removeFromCart(productId);
    } else if (parsedQuantity === 0) {
      // Allow 0 quantity temporarily for editing
      updateCartItem(productId, { quantity: 0 });
    } else {
      updateCartItem(productId, { quantity: parsedQuantity });
    }
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('cart')}</span>
        </h3>
        <div className="text-center py-6 sm:py-8">
          <ShoppingCart className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">Cart is empty</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
          <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>{t('cart')} ({cart.length})</span>
        </h3>
        <button
          onClick={clearCart}
          className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-3 sm:space-y-4 max-h-64 overflow-y-auto">
        {cart.map((item) => (
          <div key={item.id} className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.name}</h4>
                {/* Manual product badge - COMMENTED OUT */}
                {/* {item.isManual && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    Manual
                  </span>
                )} */}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {shopSettings.currency} {item.originalPrice || item.price}
              </p>
            </div>

            {/* Mobile Layout */}
            <div className="flex items-center justify-between sm:hidden">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Minus className="w-4 h-4" />
                </button>
                
                <input
                  type="number"
                  value={formatQuantity(item.quantity)}
                  onChange={(e) => updateQuantity(item.id, e.target.value)}
                  step="0.001"
                  className="w-20 text-center text-sm border border-gray-300 dark:border-gray-600 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  min="0.001"
                />
                
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex sm:items-center sm:space-x-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Minus className="w-4 h-4" />
              </button>
              
              <input
                type="number"
                value={formatQuantity(item.quantity)}
                onChange={(e) => updateQuantity(item.id, e.target.value)}
                step="0.001"
                className="w-24 text-center text-sm border border-gray-300 dark:border-gray-600 rounded px-1 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                min="0.001"
              />
              
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="hidden sm:block text-sm font-medium text-gray-900 dark:text-white w-20 text-right">
              {shopSettings.currency} {(item.price * item.quantity).toLocaleString()}
            </div>

            <button
              onClick={() => removeFromCart(item.id)}
              className="hidden sm:block text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Mobile Total */}
            <div className="sm:hidden text-center">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Total: {shopSettings.currency} {(item.price * item.quantity).toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">{t('total')}:</span>
          <span className="text-base sm:text-lg font-bold text-blue-600 dark:text-blue-400">
            {shopSettings.currency} {calculateTotal().toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Cart;