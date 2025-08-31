import React, { useState, Component } from 'react';
import { useInventory } from '../../contexts/InventoryContext';
import { useShop } from '../../contexts/ShopContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ProductForm from './ProductForm';
import ProductList from './ProductList';
import GRNForm from './GRNForm';
import { Plus, Search, Upload, Download, Truck, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

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

const Inventory = () => {
  const [showForm, setShowForm] = useState(false);
  const [showGRNForm, setShowGRNForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStockStatus, setSelectedStockStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const { products = [], searchProducts, addProduct } = useInventory() || {};
  const { getCurrentShopConfig } = useShop() || {};
  const { isAdmin, canViewInventory, canManageInventory } = useAuth();
  const { t } = useTranslation();

  // Defensive check for shopConfig
  const shopConfig = getCurrentShopConfig ? getCurrentShopConfig() : { name: 'Unknown Shop', features: [] };
  
  // Get unique categories
  const categories = Array.isArray(products)
    ? [...new Set(products.map(p => p.category).filter(Boolean))]
    : [];

  // Filter products by search term, category, and stock status
  const filteredProducts = Array.isArray(products)
    ? products.filter(product => {
        if (!product) return false;
        const matchesSearch = searchTerm 
          ? (product.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            String(product.barcode || '').includes(searchTerm)
          : true;
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        
        // Stock status filtering
        const quantity = product.quantity || 0;
        const minStock = product.minStock || 5;
        let matchesStockStatus = true;
        
        switch (selectedStockStatus) {
          case 'available':
            matchesStockStatus = quantity > minStock;
            break;
          case 'lowStock':
            matchesStockStatus = quantity > 0 && quantity <= minStock;
            break;
          case 'outOfStock':
            matchesStockStatus = quantity <= 0;
            break;
          default: // 'all'
            matchesStockStatus = true;
        }
        
        return matchesSearch && matchesCategory && matchesStockStatus;
      })
    : [];

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedStockStatus]);

  const handleAddProduct = () => {
    if (!canManageInventory()) {
      toast.error('Only administrators can add products');
      return;
    }
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEditProduct = (product) => {
    if (!canManageInventory()) {
      toast.error('Only administrators can edit products');
      return;
    }
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const exportToExcel = () => {
    try {
      if (!products || products.length === 0) {
        toast.error('No products to export');
        return;
      }

      const exportData = products.map(product => ({
        'Product Name': product.name || '',
        'Category': product.category || '',
        'Price (LKR)': product.price || 0,
        'Quantity': product.quantity || 0,
        'Minimum Stock': product.minStock || 5,
        'Barcode': product.barcode || '',
        'Description': product.description || '',
        'Weight (kg)': product.weight || '',
        'Expiry Date': product.expiryDate || '',
        'Batch Number': product.batchNumber || '',
        'Size': product.size || '',
        'Color': product.color || '',
        'Material': product.material || '',
        'Prescription Required': product.prescription ? 'Yes' : 'No',
        'Created Date': product.createdAt ? new Date(product.createdAt).toLocaleDateString() : '',
        'Last Updated': product.updatedAt ? new Date(product.updatedAt).toLocaleDateString() : ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 10 }, { wch: 15 },
        { wch: 15 }, { wch: 30 }, { wch: 12 }, { wch: 12 }, { wch: 15 },
        { wch: 10 }, { wch: 10 }, { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 12 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Inventory');
      
      const fileName = `inventory-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Inventory exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting inventory: ' + error.message);
    }
  };

  const handleFileUpload = (event) => {
    if (!canManageInventory()) {
      toast.error('Only administrators can import products');
      return;
    }

    const file = event.target.files[0];
    if (!file) {
      toast.error('No file selected');
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        let successCount = 0;
        let errorCount = 0;

        for (const row of jsonData) {
          try {
            const productData = {
              name: row['Product Name'] || '',
              category: row['Category'] || '',
              price: Math.round((parseFloat(row['Price (LKR)']) || 0) * 100) / 100,
              quantity: Math.round((parseFloat(row['Quantity']) || 0) * 100) / 100,
              minStock: Math.round((parseFloat(row['Minimum Stock']) || 5) * 100) / 100,
              barcode: row['Barcode'] || '',
              description: row['Description'] || '',
              weight: row['Weight (kg)'] ? parseFloat(row['Weight (kg)']) : null,
              expiryDate: row['Expiry Date'] || '',
              batchNumber: row['Batch Number'] || '',
              size: row['Size'] || '',
              color: row['Color'] || '',
              material: row['Material'] || '',
              prescription: row['Prescription Required'] === 'Yes'
            };

            if (productData.name && productData.price > 0 && addProduct) {
              const result = await addProduct(productData);
              if (result.success) {
                successCount++;
              } else {
                errorCount++;
                console.error('Failed to add product:', result.error);
              }
            } else {
              errorCount++;
            }
          } catch (error) {
            errorCount++;
            console.error('Error adding product:', error);
          }
        }

        toast.success(`Import completed! ${successCount} products added successfully.`);
        if (errorCount > 0) {
          toast.error(`${errorCount} products failed to import. Check console for details.`);
        }
        
        setShowImportModal(false);
      } catch (error) {
        console.error('File read error:', error);
        toast.error('Error reading file: ' + error.message);
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = '';
  };

  const downloadTemplate = () => {
    try {
      const templateData = [{
        'Product Name': 'Sample Product',
        'Category': 'Electronics',
        'Price (LKR)': 1500.50,
        'Quantity': 10.25,
        'Minimum Stock': 5.00,
        'Barcode': '1234567890',
        'Description': 'Sample product description',
        'Weight (kg)': 0.5,
        'Expiry Date': '2024-12-31',
        'Batch Number': 'BATCH001',
        'Size': 'Medium',
        'Color': 'Blue',
        'Material': 'Plastic',
        'Prescription Required': 'No'
      }];

      const ws = XLSX.utils.json_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template');
      
      XLSX.writeFile(wb, 'inventory-import-template.xlsx');
      toast.success('Template downloaded successfully!');
    } catch (error) {
      console.error('Template download error:', error);
      toast.error('Error downloading template: ' + error.message);
    }
  };

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (!useInventory || !useShop) {
    return (
      <div className="p-4 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
        <h2 className="text-lg font-semibold">Context Error</h2>
        <p>Inventory or Shop context is not properly initialized.</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              {t('inventory')} {!canManageInventory() && <span className="text-sm text-gray-500 dark:text-gray-400">(View Only)</span>}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{shopConfig.name} - {products.length} products</p>
          </div>
          
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
            {canManageInventory() && (
              <>
                <button
                  onClick={() => setShowGRNForm(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Truck className="w-4 h-4" />
                  <span>Create GRN</span>
                </button>
                
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Excel</span>
                </button>
              </>
            )}
            
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              <span>Export Excel</span>
            </button>
            
            {canManageInventory() && (
              <button
                onClick={handleAddProduct}
                className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>{t('addProduct')}</span>
              </button>
            )}

            {!canManageInventory() && (
              <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium">View Mode</span>
              </div>
            )}
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchProducts') || 'Search products by name or barcode...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">{t('allCategories') || 'All Categories'}</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>

          <select
            value={selectedStockStatus}
            onChange={(e) => setSelectedStockStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">{t('allStock') || 'All Stock'}</option>
            <option value="available">{t('inStock') || 'In Stock'}</option>
            <option value="lowStock">{t('lowStock') || 'Low Stock'}</option>
            <option value="outOfStock">{t('outOfStock') || 'Out of Stock'}</option>
          </select>
        </div>

        {/* Results Summary */}
        <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            Showing {currentProducts.length} of {filteredProducts.length} products
            {(searchTerm || selectedCategory) && (
              <span className="ml-2">
                (filtered from {products.length} total)
              </span>
            )}
          </div>
          
          {totalPages > 1 && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Page {currentPage} of {totalPages}
            </div>
          )}
        </div>

        {/* Product List */}
        <ProductList
          products={currentProducts}
          onEdit={handleEditProduct}
          shopConfig={shopConfig}
          isViewOnly={!canManageInventory()}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-center sm:space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center justify-center space-x-1 overflow-x-auto">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="flex items-center justify-center space-x-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Product Form Modal - Only for admins */}
        {showForm && canManageInventory() && (
          <ProductForm
            product={editingProduct}
            onClose={handleCloseForm}
            shopConfig={shopConfig}
          />
        )}

        {/* GRN Form Modal - Only for admins */}
        {showGRNForm && canManageInventory() && (
          <GRNForm
            onClose={() => setShowGRNForm(false)}
          />
        )}

        {/* Import Modal - Only for admins */}
        {showImportModal && canManageInventory() && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setShowImportModal(false)}>
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Import Inventory</h2>
                <button
                  onClick={() => setShowImportModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Plus className="w-6 h-6 transform rotate-45" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="mb-2">Upload an Excel file to import products. The file should contain the following columns:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Product Name (required)</li>
                    <li>Category</li>
                    <li>Price (LKR) (required)</li>
                    <li>Quantity (required)</li>
                    <li>Minimum Stock</li>
                    <li>Barcode</li>
                    <li>Description</li>
                    <li>Weight (kg)</li>
                    <li>Expiry Date</li>
                    <li>Batch Number</li>
                    <li>Size, Color, Material</li>
                    <li>Prescription Required (Yes/No)</li>
                  </ul>
                </div>

                <button
                  onClick={downloadTemplate}
                  className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>

                <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Choose Excel file to upload</p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select File
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Inventory;