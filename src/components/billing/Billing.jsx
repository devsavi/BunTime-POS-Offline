import React, { useState } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useInventory } from '../../contexts/InventoryContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import ProductSelector from './ProductSelector';
import Cart from './Cart';
import BillSummary from './BillSummary';
import InvoicePrint from './InvoicePrint';
import DailyTransactions from './DailyTransactions';
import QRScanner from '../common/QRScanner';
import UserSelector from './UserSelector';
import { Receipt, Search, Camera, User /*, Plus, X */ } from 'lucide-react';

const Billing = () => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  // const [showManualEntry, setShowManualEntry] = useState(false);
  // const [manualProduct, setManualProduct] = useState({
  //   name: '',
  //   price: '',
  //   quantity: 1
  // });
  const { cart, addToCart, selectedCashier, setSelectedCashier } = useBilling();
  const { products, searchProducts } = useInventory();
  const { isAdmin } = useAuth();
  const { t } = useTranslation();

  // State for cashier selector modal
  const [showCashierSelector, setShowCashierSelector] = useState(false);

  // Effect to check if cashier is selected when component mounts
  React.useEffect(() => {
    if (!selectedCashier) {
      setShowCashierSelector(true);
    }
  }, [selectedCashier]);

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const foundProducts = searchProducts(barcodeInput.trim());
    if (foundProducts.length > 0) {
      addToCart(foundProducts[0]);
      setBarcodeInput('');
      document.getElementById('barcode-input').focus();
    } else {
      alert('Product not found with barcode: ' + barcodeInput);
    }
  };

  const handleBillProcessed = (billData) => {
    // Show success message
    toast.success('Bill processed successfully!');
    
    // Set bill data and show print modal
    setLastBill(billData);
    setShowInvoice(true);
  };

  const handleScanSuccess = (decodedText) => {
    console.log('Scanned barcode:', decodedText);
    
    // Search for product by barcode
    const foundProducts = searchProducts(decodedText.trim());
    if (foundProducts.length > 0) {
      addToCart(foundProducts[0]);
      toast.success(`Added ${foundProducts[0].name} to cart`);
    } else {
      toast.error('Product not found with barcode: ' + decodedText);
    }
    
    setShowScanner(false);
  };

  // const handleManualEntry = (e) => {
  //   e.preventDefault();
  //   
  //   if (!manualProduct.name.trim() || !manualProduct.price || manualProduct.price <= 0) {
  //     toast.error('Please enter valid product name and price');
  //     return;
  //   }

  //   // Create a manual product object
  //   const manualProductItem = {
  //     id: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  //     name: manualProduct.name.trim(),
  //     price: parseFloat(manualProduct.price),
  //     category: 'Manual Entry',
  //     isManual: true, // Flag to identify manual products
  //     barcode: null,
  //     quantity: parseFloat(manualProduct.quantity) || 1
  //   };

  //   // Add to cart with the specified quantity
  //   addToCart(manualProductItem, manualProductItem.quantity);
  //   
  //   // Show success message
  //   toast.success(`Added ${manualProduct.name} to cart`);
  //   
  //   // Reset form and close modal
  //   setManualProduct({ name: '', price: '', quantity: 1 });
  //   setShowManualEntry(false);
  // };

  // const resetManualForm = () => {
  //   setManualProduct({ name: '', price: '', quantity: 1 });
  //   setShowManualEntry(false);
  // };

  return (
    <div className="space-y-mobile">
      <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:items-center justify-between">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">{t('billing')}</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Process sales and generate invoices</p>
        </div>

        <div className="flex flex-col space-y-3 lg:space-y-0 lg:flex-row lg:items-center lg:space-x-3">
          {/* Manual Entry Button - COMMENTED OUT */}
          {/* <button
            onClick={() => setShowManualEntry(true)}
            className="btn-touch flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('manualEntry')}</span>
          </button> */}

          {/* QR/Barcode Scanner Button */}
          {/* <button
            onClick={() => setShowScanner(true)}
            className="btn-touch flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Code</span>
          </button> */}
          
          {/* Manual Barcode Input */}
          {/* <form onSubmit={handleBarcodeSubmit} className="flex items-center space-x-2">
            <div className="relative flex-1 lg:flex-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                id="barcode-input"
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder="Enter barcode..."
                className="form-input-mobile pl-9 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-48 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
            <button
              type="submit"
              className="btn-touch px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap text-sm"
            >
              Add
            </button>
          </form> */}

          {cart.length > 0 && (
            <div className="flex items-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg">
              <Receipt className="w-4 h-4" />
              <span className="text-sm font-medium">{cart.length} items</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
        {/* Product Selection */}
        <div className="w-full">
          <ProductSelector
            products={products}
            onAddToCart={addToCart}
          />
        </div>

        {/* Cart and Bill Summary */}
        <div className="w-full space-y-mobile">
          <Cart />
          <BillSummary onBillProcessed={handleBillProcessed} />
        </div>
      </div>

      {/* Daily Transactions Section */}
      <DailyTransactions />

      {/* Invoice Print Modal */}
      {showInvoice && lastBill && (
        <InvoicePrint
          bill={lastBill}
          onClose={() => setShowInvoice(false)}
        />
      )}

      {/* QR/Barcode Scanner Modal */}
      <QRScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onScanSuccess={handleScanSuccess}
        onScanError={(error) => {
          console.error('Scan error:', error);
          toast.error('Failed to scan code');
        }}
      />

      {/* Cashier Selector Modal */}
      <UserSelector
        isOpen={showCashierSelector}
        onClose={() => setShowCashierSelector(false)}
        onSelectUser={(user) => {
          setSelectedCashier(user);
          toast.success(`Selected cashier: ${user.name}`);
          setShowCashierSelector(false);
        }}
        title="Select Cashier"
        addNewLabel="Add New Cashier"
        searchPlaceholder="Search cashiers..."
      />

      {/* Manual Product Entry Modal - COMMENTED OUT */}
      {/* {showManualEntry && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={resetManualForm}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('manualProductEntry')}</h3>
              <button
                onClick={resetManualForm}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleManualEntry} className="p-6 space-y-4">
              <div>
                <label htmlFor="manual-product-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('productName')} *
                </label>
                <input
                  id="manual-product-name"
                  type="text"
                  value={manualProduct.name}
                  onChange={(e) => setManualProduct({ ...manualProduct, name: e.target.value })}
                  placeholder={t('enterProductName')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="manual-product-price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('price')} ({shopConfig.currency}) *
                </label>
                <input
                  id="manual-product-price"
                  type="number"
                  value={manualProduct.price}
                  onChange={(e) => setManualProduct({ ...manualProduct, price: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label htmlFor="manual-product-quantity" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('quantity')}
                </label>
                <input
                  id="manual-product-quantity"
                  type="number"
                  value={manualProduct.quantity}
                  onChange={(e) => setManualProduct({ ...manualProduct, quantity: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  step="0.01"
                  min="0.01"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetManualForm}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('addToCartBtn')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Billing;