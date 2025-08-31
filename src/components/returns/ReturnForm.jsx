import React, { useState } from 'react';
import { useReturns } from '../../contexts/ReturnsContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { X, Plus, Search, Save, Trash2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

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

const ReturnForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    returnNumber: '',
    customerName: '',
    customerPhone: '',
    notes: ''
  });
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const { addReturn, generateReturnNumber, validateReturnQuantities } = useReturns();
  const { products } = useInventory();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  React.useEffect(() => {
    setFormData(prev => ({ ...prev, returnNumber: generateReturnNumber() }));
  }, []);

  // Validate quantities whenever items change
  React.useEffect(() => {
    if (selectedItems.length > 0) {
      const errors = validateReturnQuantities(selectedItems);
      setValidationErrors(errors);
    } else {
      setValidationErrors([]);
    }
  }, [selectedItems, validateReturnQuantities]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(product.barcode || '').includes(searchTerm)
  );

  const addItem = (product) => {
    const existingItem = selectedItems.find(item => item.productId === product.id);
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (newQuantity > product.quantity) {
        alert(`Cannot add more items. Only ${product.quantity} units available in inventory.`);
        return;
      }
      setSelectedItems(selectedItems.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity }
          : item
      ));
    } else {
      if (product.quantity === 0) {
        alert(`Cannot return "${product.name}". No units available in inventory.`);
        return;
      }
      setSelectedItems([...selectedItems, {
        productId: product.id,
        productName: product.name,
        productBarcode: product.barcode,
        productPrice: product.price,
        productCurrency: product.currency || shopSettings.currency,
        quantity: 1,
        reason: '',
        customReason: '', // Add custom reason field
        maxQuantity: product.quantity
      }]);
    }
  };

  const updateItem = (productId, field, value) => {
    if (field === 'quantity') {
      const product = products.find(p => p.id === productId);
      const quantity = parseFloat(value) || 0;
      
      if (quantity > product.quantity) {
        alert(`Cannot return ${quantity} units. Only ${product.quantity} units available in inventory.`);
        return;
      }
    }
    
    setSelectedItems(selectedItems.map(item =>
      item.productId === productId
        ? { ...item, [field]: field === 'quantity' ? parseFloat(value) || 0 : value }
        : item
    ));
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.productId !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.productPrice * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the return');
      return;
    }

    // Check for items with zero quantity
    const zeroQuantityItems = selectedItems.filter(item => item.quantity <= 0);
    if (zeroQuantityItems.length > 0) {
      toast.error('Please set a quantity greater than zero for all items or remove them from the return');
      return;
    }

    // Validate that all items have reasons
    const itemsWithoutReason = selectedItems.filter(item => {
      if (item.reason === 'Other') {
        return !item.customReason || !item.customReason.trim();
      }
      return !item.reason || !item.reason.trim();
    });
    
    if (itemsWithoutReason.length > 0) {
      toast.error('Please provide a reason for all return items');
      return;
    }

    // Check for validation errors
    if (validationErrors.length > 0) {
      alert('Please fix the following errors:\n' + validationErrors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      // Process items to use custom reason when "Other" is selected
      const processedItems = selectedItems.map(item => ({
        ...item,
        reason: item.reason === 'Other' ? item.customReason : item.reason
      }));

      const returnData = {
        ...formData,
        items: processedItems,
        totalValue: calculateTotal(),
        totalItems: selectedItems.reduce((sum, item) => sum + item.quantity, 0)
      };

      const result = await addReturn(returnData);
      if (result.success) {
        onClose();
        toast.success('Return request submitted successfully!');
      } else {
        toast.error(result.error || 'Failed to submit return request');
      }
    } catch (error) {
      console.error('Error submitting return:', error);
      toast.error(error.message || 'Failed to submit return request');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const returnReasons = [
    'Damaged product',
    'Wrong item received',
    'Customer return',
    'Expired product',
    'Quality issue',
    'Overstocked',
    'Other'
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create Return Request</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Validation Errors</h4>
                  <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Return Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Return Number</label>
              <input
                type="text"
                name="returnNumber"
                value={formData.returnNumber}
                onChange={handleChange}
                required
                readOnly
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Name</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter customer name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Phone</label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter customer phone (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
              <input
                type="text"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Additional notes (optional)"
              />
            </div>
          </div>

          {/* Product Selection */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Products to Return</h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products by name or barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-h-48 overflow-y-auto mb-6">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className={`border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer ${
                    product.quantity === 0 
                      ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' 
                      : 'border-gray-200 dark:border-gray-600'
                  }`}
                  onClick={() => addItem(product)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {product.currency || shopSettings.currency} {product.price} • Stock: {formatQuantity(product.quantity)}
                      </p>
                      {product.barcode && (
                        <p className="text-xs text-gray-400 dark:text-gray-500">Barcode: {product.barcode}</p>
                      )}
                      {product.quantity === 0 && (
                        <p className="text-xs text-red-600 dark:text-red-400 font-medium">Out of stock</p>
                      )}
                    </div>
                    <Plus className={`w-4 h-4 ${
                      product.quantity === 0 
                        ? 'text-red-400 dark:text-red-500' 
                        : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Return Items</h3>
              
              <div className="space-y-4">
                {selectedItems.map((item) => {
                  const product = products.find(p => p.id === item.productId);
                  const hasError = item.quantity > (product?.quantity || 0);
                  
                  return (
                    <div key={item.productId} className={`border rounded-lg p-4 ${hasError ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600'}`}>
                      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-start">
                        {/* Product Info */}
                        <div className="md:col-span-2">
                          <div className="font-medium text-gray-900 dark:text-white">{item.productName}</div>
                          {item.productBarcode && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Barcode: {item.productBarcode}
                            </div>
                          )}
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            Available: {formatQuantity(product?.quantity || 0)} units
                          </div>
                          {hasError && (
                            <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                              Exceeds available stock
                            </div>
                          )}
                        </div>

                        {/* Quantity */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Quantity</label>
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => updateItem(item.productId, 'quantity', Math.max(0, (item.quantity || 0) - 1))}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.productId, 'quantity', e.target.value)}
                              min="0"
                              step="0.001"
                              max={product?.quantity || 0}
                              className={`w-24 px-2 py-1 border rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center ${
                                hasError
                                  ? 'border-red-500 dark:border-red-400'
                                  : 'border-gray-300 dark:border-gray-600'
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const newQuantity = (item.quantity || 0) + 1;
                                if (newQuantity <= (product?.quantity || 0)) {
                                  updateItem(item.productId, 'quantity', newQuantity);
                                }
                              }}
                              disabled={item.quantity >= (product?.quantity || 0)}
                              className={`p-1 ${
                                item.quantity >= (product?.quantity || 0)
                                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                              }`}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </div>

                        {/* Unit Price */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Unit Price</label>
                          <div className="text-sm text-gray-900 dark:text-white">
                            {item.productCurrency} {item.productPrice.toLocaleString()}
                          </div>
                        </div>

                        {/* Total */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Total</label>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {item.productCurrency} {(item.productPrice * item.quantity).toLocaleString()}
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Reason Selection */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Return Reason *</label>
                          <select
                            value={item.reason}
                            onChange={(e) => updateItem(item.productId, 'reason', e.target.value)}
                            required
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="">Select reason...</option>
                            {returnReasons.map(reason => (
                              <option key={reason} value={reason}>{reason}</option>
                            ))}
                          </select>
                        </div>

                        {/* Custom Reason Input - Show when "Other" is selected */}
                        {item.reason === 'Other' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Specify Reason *</label>
                            <input
                              type="text"
                              value={item.customReason || ''}
                              onChange={(e) => updateItem(item.productId, 'customReason', e.target.value)}
                              placeholder="Enter custom reason..."
                              required
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Total Items: {formatQuantity(selectedItems.reduce((sum, item) => sum + item.quantity, 0))}
                </div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Value: {shopSettings.currency} {calculateTotal().toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0 || validationErrors.length > 0}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Submit Return Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReturnForm;