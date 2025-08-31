import React, { useState, useEffect } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { X, Save, Package, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductForm = ({ product, onClose, shopConfig = { features: [] } }) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    quantity: '',
    minStock: '5',
    category: '',
    barcode: '',
    description: '',
    weight: '',
    prescription: false,
    expiryDate: '',
    batchNumber: '',
    measurements: '',
    material: '',
    tableNumber: '',
    cookingTime: '',
    size: '',
    color: ''
  });

  const [loading, setLoading] = useState(false);
  const [barcodeValidating, setBarcodeValidating] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const [showCurrencyWarning, setShowCurrencyWarning] = useState(false);
  const { addProduct, updateProduct, checkBarcodeUniqueness } = useInventory() || {};
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  useEffect(() => {
    if (product) {
      // Safely merge product data, ensuring no undefined values
      const safeProductData = {
        name: product.name ?? '',
        price: product.price ?? '',
        quantity: product.quantity ?? '',
        minStock: product.minStock ?? '5',
        category: product.category ?? '',
        barcode: product.barcode ?? '',
        description: product.description ?? '',
        weight: product.weight ?? '',
        prescription: product.prescription ?? false,
        expiryDate: product.expiryDate ?? '',
        batchNumber: product.batchNumber ?? '',
        measurements: product.measurements ?? '',
        material: product.material ?? '',
        tableNumber: product.tableNumber ?? '',
        cookingTime: product.cookingTime ?? '',
        size: product.size ?? '',
        color: product.color ?? ''
      };
      
      setFormData(prevFormData => ({
        ...prevFormData,
        ...safeProductData
      }));
      
      // Check if product has different currency than current shop currency
      if (product.currency && product.currency !== shopSettings.currency) {
        setShowCurrencyWarning(true);
      }
    }
  }, [product, shopSettings.currency]);

  const validateBarcode = async (barcode) => {
    if (!barcode || barcode.trim() === '') {
      setBarcodeError('Barcode is required');
      return false;
    }

    setBarcodeValidating(true);
    setBarcodeError('');

    try {
      const result = await checkBarcodeUniqueness(barcode.trim(), product?.id);
      if (!result.isUnique) {
        setBarcodeError(result.error);
        setBarcodeValidating(false);
        return false;
      }
      setBarcodeValidating(false);
      return true;
    } catch (error) {
      setBarcodeError('Error validating barcode');
      setBarcodeValidating(false);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.barcode || formData.barcode.trim() === '') {
      setBarcodeError('Barcode is required');
      setLoading(false);
      return;
    }

    // Validate barcode before submission
    const isBarcodeValid = await validateBarcode(formData.barcode);
    if (!isBarcodeValid) {
      setLoading(false);
      return;
    }

    const productData = {
      ...formData,
      price: parseFloat(formData.price) || 0,
      quantity: parseFloat(formData.quantity) || 0,
      minStock: parseFloat(formData.minStock) || 5,
      weight: formData.weight ? parseFloat(formData.weight) : null,
      cookingTime: formData.cookingTime ? parseFloat(formData.cookingTime) : null,
      currency: shopSettings.currency // Always use current shop currency for new/updated products
    };

    try {
      if (!addProduct || !updateProduct) {
        throw new Error('Inventory context methods are not available');
      }

      let result;
      if (product) {
        result = await updateProduct(product.id, productData);
      } else {
        result = await addProduct(productData);
      }

      if (result.success) {
        onClose();
        toast.success(product ? 'Product updated successfully!' : 'Product added successfully!');
      } else {
        toast.error(result.error || (product ? 'Failed to update product' : 'Failed to add product'));
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear barcode error when user starts typing
    if (name === 'barcode') {
      setBarcodeError('');
    }
  };

  const handleBarcodeBlur = async (e) => {
    const barcode = e.target.value;
    if (barcode && barcode.trim() !== '') {
      await validateBarcode(barcode);
    } else {
      setBarcodeError('Barcode is required');
    }
  };

  const renderShopSpecificFields = () => {
    const fields = [];

    if (shopConfig.features.includes('weight')) {
      fields.push(
        <div key="weight">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight (kg)</label>
          <input
            type="number"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            step="0.001"
            className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      );
    }

    if (shopConfig.features.includes('prescription')) {
      fields.push(
        <div key="prescription">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              name="prescription"
              checked={formData.prescription}
              onChange={handleChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Requires Prescription</span>
          </label>
        </div>
      );
    }

    if (shopConfig.features.includes('expiry')) {
      fields.push(
        <div key="expiry" className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch Number</label>
            <input
              type="text"
              name="batchNumber"
              value={formData.batchNumber}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      );
    }

    if (shopConfig.features.includes('variations')) {
      fields.push(
        <div key="variations" className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
            <input
              type="text"
              name="size"
              value={formData.size}
              onChange={handleChange}
              placeholder="S, M, L, XL"
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
            <input
              type="text"
              name="color"
              value={formData.color}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      );
    }

    return fields;
  };

  // Get the display currency for the product
  const getDisplayCurrency = () => {
    if (product && product.currency) {
      return product.currency;
    }
    return shopSettings.currency;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>{product ? t('editProduct') : t('addProduct')}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Currency Warning for Existing Products */}
          {showCurrencyWarning && product && (
            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200">Currency Update Notice</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                    This product was created with <strong>{product.currency}</strong> currency. 
                    When you save changes, the price will be updated to use the current shop currency <strong>{shopSettings.currency}</strong>.
                  </p>
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                    Make sure to adjust the price value if needed for the new currency.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('productName')} *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name || ''}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter product name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('category')}
              </label>
              <input
                type="text"
                name="category"
                value={formData.category || ''}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter category"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('price')} ({getDisplayCurrency()}) *
                {product && product.currency !== shopSettings.currency && (
                  <span className="text-orange-600 dark:text-orange-400 text-xs ml-2">
                    → Will be saved as {shopSettings.currency}
                  </span>
                )}
              </label>
              <input
                type="number"
                name="price"
                required
                value={formData.price || ''}
                onChange={handleChange}
                step="0.001"
                min="0"
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder={`Enter price in ${getDisplayCurrency()}`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('quantity')} *
              </label>
              <input
                type="number"
                name="quantity"
                required
                value={formData.quantity || ''}
                onChange={handleChange}
                step="0.001"
                min="0"
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter quantity"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('minStock')}
              </label>
              <input
                type="number"
                name="minStock"
                value={formData.minStock}
                onChange={handleChange}
                step="0.001"
                min="0"
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Minimum stock level"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('barcode')} *
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="barcode"
                  required
                  value={formData.barcode || ''}
                  onChange={handleChange}
                  onBlur={handleBarcodeBlur}
                  className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                    barcodeError 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  }`}
                  placeholder="Enter barcode (required)"
                />
                {barcodeValidating && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
              {barcodeError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{barcodeError}</p>
              )}
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Barcode is mandatory for all products
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter product description"
            />
          </div>

          {renderShopSpecificFields()}

          {/* Currency Display */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Currency: {shopSettings.currency}
              </span>
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
              {product ? 
                `This product will be updated to use ${shopSettings.currency} currency.` :
                `All prices will be saved in ${shopSettings.currency}. Change currency in Settings if needed.`
              }
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || barcodeValidating || !!barcodeError || !formData.barcode.trim()}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{t('save')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;