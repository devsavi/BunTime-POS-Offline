import React, { useState } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, AlertTriangle, Package, Eye } from 'lucide-react';
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

const ProductList = ({ products = [], onEdit, shopConfig = { features: [] }, isViewOnly = false }) => {
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const { deleteProduct } = useInventory() || {};
  const { isAdmin, canManageInventory } = useAuth();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  const handleDelete = async (productId) => {
    if (!canManageInventory()) {
      toast.error('Only administrators can delete products');
      return;
    }

    try {
      if (!deleteProduct) {
        throw new Error('Delete product function is not available');
      }
      const result = await deleteProduct(productId);
      if (result.success) {
        setDeleteConfirm(null);
        toast.success('Product deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete product');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete product');
    }
  };

  const handleEdit = (product) => {
    if (!canManageInventory()) {
      toast.error('Only administrators can edit products');
      return;
    }
    onEdit(product);
  };

  const isLowStock = (product) => {
    const qty = parseFloat(product.quantity) || 0;
    const minStock = parseFloat(product.minStock) || 5;
    return qty > 0 && qty <= minStock;
  };

  const isOutOfStock = (product) => {
    const qty = parseFloat(product.quantity) || 0;
    return qty === 0;
  };

  // Get the currency to display for a product - ALWAYS use the product's original currency
  const getProductCurrency = (product) => {
    // If product has a currency saved, use it (this preserves original currency)
    if (product.currency) {
      return product.currency;
    }
    // For very old products without currency field, use current shop currency as fallback
    return shopSettings.currency || 'LKR';
  };

  // Check if product has different currency than current shop currency
  const hasOldCurrency = (product) => {
    return product.currency && product.currency !== shopSettings.currency;
  };

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No products found</h3>
        <p className="text-gray-500 dark:text-gray-400">
          {canManageInventory() ? 'Start by adding your first product' : 'No products available to view'}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Stock
                </th>
                {shopConfig.features.includes('barcode') && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Barcode
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map((product) => {
                const productCurrency = getProductCurrency(product);
                const isOldCurrency = hasOldCurrency(product);
                
                return (
                  <tr key={product.id} className={
                    isOutOfStock(product) ? 'bg-red-50 dark:bg-red-900/20' :
                    isLowStock(product) ? 'bg-yellow-50 dark:bg-yellow-900/20' : ''
                  }>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isOutOfStock(product) && (
                          <Package className="w-4 h-4 text-red-500 mr-2" />
                        )}
                        {!isOutOfStock(product) && isLowStock(product) && (
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mr-2" />
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{product.name || 'Unnamed Product'}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{product.description}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {product.category || 'Uncategorized'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {productCurrency} {(product.price || 0).toLocaleString()}
                      </div>
                      {isOldCurrency && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">
                          Previous currency
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {formatQuantity(product.quantity)}
                      </div>
                      {isOutOfStock(product) && (
                        <div className="text-xs text-red-600 dark:text-red-400">Out of stock!</div>
                      )}
                      {!isOutOfStock(product) && isLowStock(product) && (
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">Low stock!</div>
                      )}
                    </td>
                    {shopConfig.features.includes('barcode') && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {product.barcode || '-'}
                      </td>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {isViewOnly ? (
                          <button
                            onClick={() => setViewingProduct(product)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleEdit(product)}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(product.id)}
                              className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                              title="Delete Product"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Delete Confirmation Modal - Only for admins */}
          {deleteConfirm && canManageInventory() && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    onClick={() => handleDelete(deleteConfirm)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Product View Modal - For cashiers */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Product Details</span>
              </h2>
              <button
                onClick={() => setViewingProduct(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <Eye className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Product Name</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.name || 'N/A'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.category || 'Uncategorized'}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Price</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">
                    {getProductCurrency(viewingProduct)} {(viewingProduct.price || 0).toLocaleString()}
                    {hasOldCurrency(viewingProduct) && (
                      <span className="ml-2 text-xs text-orange-600 dark:text-orange-400">
                        (Previous currency)
                      </span>
                    )}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Stock</label>
                  <p className={`mt-1 text-sm ${isLowStock(viewingProduct) ? 'text-yellow-600 dark:text-yellow-400' : 'text-gray-900 dark:text-white'}`}>
                    {formatQuantity(viewingProduct.quantity)} {isLowStock(viewingProduct) && '(Low Stock!)'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Stock</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{formatQuantity(viewingProduct.minStock || 5)}</p>
                </div>

                {viewingProduct.barcode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.barcode}</p>
                  </div>
                )}
              </div>

              {viewingProduct.description && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.description}</p>
                </div>
              )}

              {/* Currency Information */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                    Currency: {getProductCurrency(viewingProduct)}
                  </span>
                  {hasOldCurrency(viewingProduct) && (
                    <span className="text-xs text-orange-600 dark:text-orange-400">
                      (Previous currency - current shop uses {shopSettings.currency})
                    </span>
                  )}
                </div>
              </div>

              {/* Shop-specific fields */}
              {shopConfig.features.includes('weight') && viewingProduct.weight && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Weight</label>
                  <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.weight} kg</p>
                </div>
              )}

              {shopConfig.features.includes('expiry') && (
                <div className="grid grid-cols-2 gap-4">
                  {viewingProduct.expiryDate && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Expiry Date</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.expiryDate}</p>
                    </div>
                  )}
                  {viewingProduct.batchNumber && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Batch Number</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.batchNumber}</p>
                    </div>
                  )}
                </div>
              )}

              {shopConfig.features.includes('variations') && (
                <div className="grid grid-cols-2 gap-4">
                  {viewingProduct.size && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.size}</p>
                    </div>
                  )}
                  {viewingProduct.color && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-white">{viewingProduct.color}</p>
                    </div>
                  )}
                </div>
              )}

              {shopConfig.features.includes('prescription') && viewingProduct.prescription && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prescription Required</label>
                  <p className="mt-1 text-sm text-green-600 dark:text-green-400">Yes</p>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewingProduct(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ProductList;