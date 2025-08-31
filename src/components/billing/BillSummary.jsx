import React, { useState } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useCustomer } from '../../contexts/CustomerContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { Receipt, User, Phone, CreditCard, Calculator, Search, Eye, Printer, X } from 'lucide-react';
import BillPreview from './BillPreview';

const BillSummary = ({ onBillProcessed }) => {
  const [customerInfo, setCustomerInfo] = useState({
    id: '',
    name: '',
    phone: '',
    email: ''
  });
  
  const { cart, processBill, calculateTotal, applyDiscount } = useBilling();
  
  const [paymentInfo, setPaymentInfo] = useState({
    method: 'cash',
    amountPaid: '',
    reference: ''
  });

  const [discountInfo, setDiscountInfo] = useState({
    amount: '',
    type: 'amount'
  });

  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  
  const { customers, searchCustomers, updateCustomerPurchase } = useCustomer();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  // Customer info is now optional, no need for auto-updating

  const subtotal = calculateTotal();
  
  // Validate discount
  const validateDiscount = (amount, type) => {
    if (!amount || amount === '') return { isValid: true, discountAmount: 0 };
    
    const discountValue = parseFloat(amount);
    if (isNaN(discountValue) || discountValue < 0) {
      return { isValid: false, error: 'Discount must be a positive number', discountAmount: 0 };
    }

    if (type === 'percentage') {
      if (discountValue > 100) {
        return { isValid: false, error: 'Discount percentage cannot exceed 100%', discountAmount: 0 };
      }
      const discountAmount = subtotal * (discountValue / 100);
      return { isValid: true, discountAmount };
    } else {
      if (discountValue > subtotal) {
        return { isValid: false, error: 'Discount amount cannot exceed subtotal', discountAmount: 0 };
      }
      return { isValid: true, discountAmount: discountValue };
    }
  };

  const discountValidation = validateDiscount(discountInfo.amount, discountInfo.type);
  const discountAmount = discountValidation.discountAmount;
  const total = Math.max(0, subtotal - discountAmount);
  const change = paymentInfo.method === 'cash' && paymentInfo.amountPaid ? 
                Math.max(0, parseFloat(paymentInfo.amountPaid) - total) : 0;

  const filteredCustomers = customerSearchTerm ? searchCustomers(customerSearchTerm) : customers.slice(0, 10);

  const handleDiscountChange = (e) => {
    const { name, value } = e.target;
    setDiscountInfo({ ...discountInfo, [name]: value });
    
    // Clear error when user starts typing
    if (discountError) {
      setDiscountError('');
    }
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    // Check for items with zero quantity or amount
    const invalidItems = cart.filter(item => item.quantity <= 0 || (item.price * item.quantity) <= 0);
    if (invalidItems.length > 0) {
      alert('Cannot process bill with items that have zero quantity or amount. Please remove or update these items.');
      return;
    }

    // Validate discount
    if (!discountValidation.isValid) {
      setDiscountError(discountValidation.error);
      return;
    }

    if (paymentInfo.method === 'cash' && parseFloat(paymentInfo.amountPaid) < total) {
      alert('Insufficient payment amount!');
      return;
    }

    setLoading(true);
    setShowPreview(false); // Close preview if open
    
    try {
      const result = await processBill(
        customerInfo,
        {
          ...paymentInfo,
          amountPaid: parseFloat(paymentInfo.amountPaid) || total,
          change
        },
        discountInfo.amount ? { ...discountInfo, amount: discountAmount } : {}
      );

      if (result.success) {
        // Update customer purchase history if customer is selected (optional)
        if (customerInfo && customerInfo.id) {
          await updateCustomerPurchase(customerInfo.id, total);
        }

        // Pass the bill data to parent and show print modal
        onBillProcessed(result.billData);
        
        // Reset forms
        setCustomerInfo({ id: '', name: '', phone: '', email: '' });
        setPaymentInfo({ method: 'cash', amountPaid: '', reference: '' });
        setDiscountInfo({ amount: '', type: 'amount' });
        setDiscountError('');
      } else {
        alert(result.error || 'Failed to process bill');
      }
    } catch (error) {
      console.error('Error processing bill:', error);
      alert('Failed to process bill. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const selectCustomer = (customer) => {
    setCustomerInfo({
      id: customer.id,
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || ''
    });
    setShowCustomerSearch(false);
    setCustomerSearchTerm('');
  };

  const handlePreview = () => {
    if (cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    // Check for items with zero quantity or amount
    const invalidItems = cart.filter(item => item.quantity <= 0 || (item.price * item.quantity) <= 0);
    if (invalidItems.length > 0) {
      alert('Cannot preview bill with items that have zero quantity or amount. Please remove or update these items.');
      return;
    }

    // Validate discount before preview
    if (!discountValidation.isValid) {
      setDiscountError(discountValidation.error);
      return;
    }

    if (paymentInfo.method === 'cash' && parseFloat(paymentInfo.amountPaid) < total) {
      alert('Insufficient payment amount!');
      return;
    }

    setShowPreview(true);
  };

  const handlePrintPreview = () => {
    window.print();
  };

  if (cart.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
          <Receipt className="w-5 h-5" />
          <span>Bill Summary</span>
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center py-4">Add items to cart to proceed</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
          <Receipt className="w-4 h-4" />
          <span>Bill Summary</span>
        </h3>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Customer Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-1">
              <User className="w-3 h-3" />
              <span>{t('customerInformation')}</span>
            </h4>
            
            <div className="relative flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCustomerSearch(!showCustomerSearch)}
                className="flex-1 text-left px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center justify-between bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <span className={customerInfo.name ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}>
                  {customerInfo.name || t('selectOrAddCustomer')}
                </span>
                <Search className="w-3 h-3 text-gray-400 dark:text-gray-500" />
              </button>
              
              {customerInfo.id && (
                <button
                  type="button"
                  onClick={() => setCustomerInfo({ id: '', name: '', phone: '', email: '' })}
                  className="px-2 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  title="Clear customer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {showCustomerSearch && (
                <>
                  {/* Overlay for click-outside-to-close */}
                  <div 
                    className="fixed inset-0 z-5" 
                    onClick={() => setShowCustomerSearch(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder={t('searchCustomers')}
                        value={customerSearchTerm}
                        onChange={(e) => setCustomerSearchTerm(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                    </div>
                    <div className="max-h-32 overflow-y-auto">
                      {filteredCustomers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => selectCustomer(customer)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                        >
                          <div className="font-medium text-gray-900 dark:text-white">{customer.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{customer.phone}</div>
                        </button>
                      ))}
                      {filteredCustomers.length === 0 && (
                        <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">{t('noCustomersFound')}</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* <input
              type="text"
              placeholder={t('customerName')}
              value={customerInfo.name}
              onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
              className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            
            <input
              type="tel"
              placeholder={t('customerPhone')}
              value={customerInfo.phone}
              onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
              className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            /> */}
          </div>

          {/* Discount */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-1">
              <Calculator className="w-3 h-3" />
              <span>{t('discount')}</span>
            </h4>
            
            <div className="flex space-x-2">
              <input
                type="number"
                name="amount"
                placeholder="Discount amount"
                value={discountInfo.amount}
                onChange={handleDiscountChange}
                className={`flex-1 px-2 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm ${
                  discountError || !discountValidation.isValid
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                }`}
                step="0.01"
                min="0"
              />
              <select
                name="type"
                value={discountInfo.type}
                onChange={handleDiscountChange}
                className="px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="amount">Amount</option>
                <option value="percentage">%</option>
              </select>
            </div>
            
            {(discountError || !discountValidation.isValid) && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {discountError || discountValidation.error}
              </p>
            )}
          </div>

          {/* Payment Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-1">
              <CreditCard className="w-3 h-3" />
              <span>Payment</span>
            </h4>
            
            <select
              value={paymentInfo.method}
              onChange={(e) => setPaymentInfo({...paymentInfo, method: e.target.value})}
              className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
            </select>

            {paymentInfo.method === 'cash' && (
              <input
                type="number"
                placeholder="Amount Paid"
                value={paymentInfo.amountPaid}
                onChange={(e) => setPaymentInfo({...paymentInfo, amountPaid: e.target.value})}
                className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                step="0.01"
                min="0"
                required
              />
            )}

            {paymentInfo.method !== 'cash' && (
              <input
                type="text"
                placeholder="Reference Number"
                value={paymentInfo.reference}
                onChange={(e) => setPaymentInfo({...paymentInfo, reference: e.target.value})}
                className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            )}
          </div>

          {/* Bill Calculation */}
          <div className="space-y-1 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between text-xs">
              <span className="text-gray-700 dark:text-gray-300">{t('subtotal')}:</span>
              <span className="text-gray-900 dark:text-white">{shopSettings?.currency || 'LKR'} {subtotal.toLocaleString()}</span>
            </div>
            
            {discountAmount > 0 && (
              <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                <span>{t('discount')}:</span>
                <span>-{shopSettings?.currency || 'LKR'} {discountAmount.toLocaleString()}</span>
              </div>
            )}
            
            <div className="flex justify-between text-sm font-bold text-gray-900 dark:text-white border-t border-gray-200 dark:border-gray-700 pt-1">
              <span>{t('total')}:</span>
              <span>{shopSettings?.currency || 'LKR'} {total.toLocaleString()}</span>
            </div>

            {change > 0 && (
              <div className="flex justify-between text-xs text-blue-600 dark:text-blue-400">
                <span>Change:</span>
                <span>{shopSettings?.currency || 'LKR'} {change.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!discountValidation.isValid}
                className="flex-1 flex items-center justify-center space-x-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                <Eye className="w-4 h-4" />
                <span>Preview</span>
              </button>

              <button
                type="submit"
                disabled={loading || !discountValidation.isValid || cart.length === 0}
                className="flex-1 flex items-center justify-center space-x-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Receipt className="w-4 h-4" />
                    <span>Process</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bill Preview Modal */}
      {showPreview && (
        <BillPreview
          cart={cart}
          customerInfo={customerInfo}
          paymentInfo={{
            ...paymentInfo,
            amountPaid: parseFloat(paymentInfo.amountPaid) || total,
            change
          }}
          discountInfo={discountInfo}
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
          onClose={() => setShowPreview(false)}
          onPrint={handlePrintPreview}
          onConfirm={handleSubmit}
          loading={loading}
        />
      )}
    </>
  );
};

export default BillSummary;