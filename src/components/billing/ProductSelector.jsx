import React, { useState, Component } from 'react';
import { useTranslation } from 'react-i18next';
import { useShop } from '../../contexts/ShopContext';
import { Search, Plus, Package } from 'lucide-react';
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

// Error Boundary Component
class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg">
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p>{this.state.error?.message || 'An unexpected error occurred'}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const ProductSelector = ({ products = [], onAddToCart = () => {}, shopConfig = { features: [] } }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { t } = useTranslation();
  const { shopSettings } = useShop();

  // Defensive check for products array
  const categories = Array.isArray(products)
    ? [...new Set(products.map(p => p.category).filter(Boolean))]
    : [];

  // Log for debugging
  console.log('ProductSelector Component:', { products, shopConfig, categories });

  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        if (!product) return false;
        const matchesSearch = (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                             String(product.barcode || '').includes(searchTerm);
        const matchesCategory = selectedCategory === '' || product.category === selectedCategory;
        return matchesSearch && matchesCategory && (product.quantity > 0);
      })
    : [];

  const handleAddToCart = (product) => {
    if (product?.quantity > 0) {
      onAddToCart(product);
      toast.success(`Added ${product.name} to cart`);
    } else {
      toast.error('Product is out of stock');
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(e.target.value.length > 0);
  };

  const selectProduct = (product) => {
    handleAddToCart(product);
    setSearchTerm('');
    setShowSuggestions(false);
  };

  // Get the currency to display for a product - use product's original currency
  const getProductCurrency = (product) => {
    return product.currency || shopSettings.currency || 'LKR';
  };

  return (
    <ErrorBoundary>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select Products</h3>

        {/* Search */}
        <div className="mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={t('searchProducts') || 'Search products by name or barcode...'}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            
            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="">{t('allCategories') || 'All Categories'}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Product List View */}
        <div className="max-h-96 overflow-hidden border border-gray-200 dark:border-gray-600 rounded-lg">
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white text-sm">Product Name</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white text-sm">Price</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-900 dark:text-white text-sm">Stock</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-900 dark:text-white text-sm">Barcode</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-900 dark:text-white text-sm">Action</th>
                  </tr>
                </thead>
              </table>
              <div className="max-h-80 overflow-y-auto">
                <table className="w-full border-collapse text-sm">
                  <tbody>
                    {filteredProducts.map((product) => (
                      <tr
                        key={product.id}
                        onClick={() => handleAddToCart(product)}
                        className="border-b border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                      >
                        <td className="py-2 px-3 text-gray-900 dark:text-white font-medium text-sm w-[30%]">
                          {product.name || 'Unnamed Product'}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900 dark:text-white text-sm w-[20%]">
                          {getProductCurrency(product)} {(typeof product.price === 'number' ? product.price.toFixed(2) : '0.00')}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-900 dark:text-white text-sm w-[15%]">
                          {formatQuantity(product.quantity)}
                        </td>
                        <td className="py-2 px-3 text-gray-600 dark:text-gray-400 text-sm w-[20%]">
                          {product.barcode || '-'}
                        </td>
                        <td className="py-2 px-3 text-center w-[15%]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent row click when clicking the button
                              handleAddToCart(product);
                            }}
                            className="p-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            title="Add to cart"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noProductsFound') || 'No products found'}</p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ProductSelector;