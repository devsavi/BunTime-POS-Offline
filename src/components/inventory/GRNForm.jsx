import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useGRN } from '../../contexts/GRNContext';
import { useTranslation } from 'react-i18next';
import { Plus, Search, X, Save, Truck } from 'lucide-react';
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

const GRNForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    grnNumber: ''
  });
  
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { products, updateStock } = useInventory();
  const { currentUser } = useAuth();
  const { addGRN } = useGRN();
  const defaultShop = {
    id: 'default-shop',
    name: 'Default Shop'
  };
  const { t } = useTranslation();

  useEffect(() => {
    // Generate GRN number
    const now = new Date();
    const grnNumber = `GRN${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}${now.getTime().toString().slice(-4)}`;
    setFormData(prev => ({ ...prev, grnNumber }));
  }, []);



  const filteredProducts = products.filter(product =>
    (selectedCategory === 'all' || product.category === selectedCategory) &&
    (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(product.barcode || '').includes(searchTerm))
  );

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category).filter(Boolean))];

  const addItem = (product) => {
    const existingItem = selectedItems.find(item => item.id === product.id);
    if (existingItem) {
      setSelectedItems(selectedItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setSelectedItems([...selectedItems, {
        id: product.id,
        name: product.name,
        currentStock: product.quantity,
        quantity: 1,
        price: product.price || 0
      }]);
    }
  };

  const updateItem = (productId, field, value) => {
    setSelectedItems(selectedItems.map(item =>
      item.id === productId
        ? { ...item, [field]: field === 'quantity' ? parseFloat(value) || 0 : parseFloat(value) || 0 }
        : item
    ));
  };

  const removeItem = (productId) => {
    setSelectedItems(selectedItems.filter(item => item.id !== productId));
  };

  const calculateTotal = () => {
    return selectedItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedItems.length === 0) {
      toast.error('Please add at least one item to the GRN');
      return;
    }

    // Check for items with zero quantity
    const zeroQuantityItems = selectedItems.filter(item => item.quantity <= 0);
    if (zeroQuantityItems.length > 0) {
      toast.error('Please set a quantity greater than zero for all items or remove them from the GRN');
      return;
    }

    setLoading(true);

    try {
      // Update stock for each item
      for (const item of selectedItems) {
        await updateStock(item.id, item.quantity, 'add');
      }

      // Create GRN record
      const grnData = {
        grnNumber: formData.grnNumber,
        items: selectedItems,
        totalValue: calculateTotal(),
        shopId: defaultShop.id,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.email,
        status: 'received'
      };

      // Save GRN using context function
      const result = await addGRN(grnData);
      
      if (!result.success) {
        throw new Error('Failed to save GRN');
      }
      
      toast.success('GRN created successfully and stock updated!');
      onClose();
    } catch (error) {
      console.error('Error creating GRN:', error);
      toast.error('Error creating GRN: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[95vh] flex flex-col border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Truck className="w-5 h-5" />
            <span>Create Goods Receive Note</span>
          </h2>
          <div className="flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-sm text-gray-600 dark:text-gray-400">GRN Number</span>
              <span className="text-sm font-semibold text-gray-900 dark:text-white">{formData.grnNumber}</span>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6">
          {/* Product Selection */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add Products</h3>
            
            <div className="flex space-x-4 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-80 overflow-y-auto mb-6 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => addItem(product)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm">{product.name}</h4>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-500 dark:text-gray-400">Current: {formatQuantity(product.quantity)}</span>
                        <span className="text-gray-500 dark:text-gray-400">•</span>
                        <span className="text-gray-500 dark:text-gray-400">LKR {product.price?.toLocaleString() || '0'}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Selected Items */}
          {selectedItems.length > 0 && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Selected Items</h3>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Current Stock</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Cost</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {selectedItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{formatQuantity(item.currentStock)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center space-x-1">
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, 'quantity', Math.max(0, (item.quantity || 0) - 1))}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                              min="0"
                              step="0.001"
                              className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
                            />
                            <button
                              type="button"
                              onClick={() => updateItem(item.id, 'quantity', (item.quantity || 0) + 1)}
                              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          LKR {item.price?.toLocaleString() || '0'}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          LKR {(item.quantity * item.price).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex justify-end">
                <div className="text-lg font-semibold text-gray-900 dark:text-white">
                  Total Value: LKR {calculateTotal().toLocaleString()}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-auto flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || selectedItems.length === 0}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>Create GRN & Update Stock</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GRNForm;