import React from 'react';
import { useShop } from '../../contexts/ShopContext';

import { useBilling } from '../../contexts/BillingContext';
import { X, Printer, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const BillPreview = ({ 
  cart, 
  customerInfo, 
  paymentInfo, 
  discountInfo, 
  subtotal, 
  discountAmount, 
  total, 
  onClose, 
  onConfirm, 
  loading 
}) => {
  const { shopSettings } = useShop();

  const { selectedCashier } = useBilling();

  // Debug log for settings and warn if no cashier selected
  React.useEffect(() => {
    console.log('Shop Settings:', shopSettings);
    console.log('Business Settings:', businessSettings);
    
    if (!selectedCashier) {
      toast.error('Please select a cashier before proceeding', {
        duration: 5000,
        id: 'no-cashier-warning'
      });
    }
  }, [shopSettings, businessSettings, selectedCashier]);

  const generateBillNumber = () => {
    const now = new Date();
    const year = now.getFullYear().toString().slice(-2);
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const time = now.getTime().toString().slice(-6);
    return `${year}${month}${day}${time}`;
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    // Check if the window was successfully opened (not blocked by pop-up blocker)
    if (!printWindow) {
      alert('Pop-up blocked! Please allow pop-ups for this site to print receipts. You can usually do this by clicking the pop-up blocker icon in your browser\'s address bar.');
      return;
    }
    
    // Get the bill content
    const billContent = document.getElementById('bill-content-for-print').innerHTML;
    
    // Create the print document
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${generateBillNumber()}</title>
          <style>
            /* Reset and base styles */
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.4;
              color: #000;
              background: #fff;
              width: 58mm;
              margin: 0 auto;
              padding: 5mm;
            }
            
            /* Receipt specific styles */
            .receipt-container {
              width: 100%;
              max-width: 58mm;
            }
            
            .receipt-header {
              text-align: center;
              margin-bottom: 10px;
              border-bottom: 1px dashed #000;
              padding-bottom: 5px;
            }
            
            .shop-logo {
              max-width: 40mm;
              max-height: 15mm;
              margin: 0 auto 5px auto;
              display: block;
            }
            
            .shop-name {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 2px;
            }
            
            .shop-details {
              font-size: 10px;
              margin-bottom: 1px;
            }
            
            .bill-info {
              margin: 10px 0;
              font-size: 10px;
            }
            
            .bill-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
            }
            
            .items-table {
              width: 100%;
              margin: 10px 0;
              border-collapse: collapse;
            }
            
            .items-table th,
            .items-table td {
              text-align: left;
              padding: 2px 1px;
              font-size: 10px;
              border: none;
            }
            
            .items-table th {
              border-bottom: 1px dashed #000;
              font-weight: bold;
            }
            
            .item-name {
              width: 60%;
            }
            
            .item-qty {
              width: 15%;
              text-align: center;
            }
            
            .item-price {
              width: 25%;
              text-align: right;
            }
            
            .totals-section {
              margin-top: 10px;
              border-top: 1px dashed #000;
              padding-top: 5px;
            }
            
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 2px;
              font-size: 11px;
            }
            
            .total-row.final {
              font-weight: bold;
              font-size: 12px;
              border-top: 1px solid #000;
              padding-top: 3px;
              margin-top: 3px;
            }
            
            .payment-info {
              margin: 10px 0;
              font-size: 10px;
            }
            
            .receipt-footer {
              text-align: center;
              margin-top: 15px;
              border-top: 1px dashed #000;
              padding-top: 5px;
              font-size: 10px;
            }
            
            /* Print specific styles */
            @media print {
              body {
                width: 58mm;
                margin: 0;
                padding: 2mm;
              }
              
              @page {
                size: 58mm auto;
                margin: 0;
              }
            }
            
            /* Alternative 80mm width */
            @media screen and (min-width: 80mm) {
              body {
                width: 80mm;
                padding: 8mm;
              }
              
              @page {
                size: 80mm auto;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              ${shopSettings.invoiceLogoBase64 ? `<img src="${shopSettings.invoiceLogoBase64}" alt="Shop Logo" class="shop-logo" />` : ''}
              <div class="shop-name">${shopSettings.name || 'My Shop'}</div>
              ${shopSettings.address ? `<div class="shop-details">${shopSettings.address}</div>` : ''}
              ${shopSettings.phone ? `<div class="shop-details">Tel: ${shopSettings.phone}</div>` : ''}
              ${shopSettings.email ? `<div class="shop-details">Email: ${shopSettings.email}</div>` : ''}
            </div>
            
            <div class="bill-info">
              <div class="bill-info-row">
                <span>Bill #:</span>
                <span>${generateBillNumber()}</span>
              </div>
              <div class="bill-info-row">
                <span>Date:</span>
                <span>${new Date().toLocaleDateString()}</span>
              </div>
              <div class="bill-info-row">
                <span>Time:</span>
                <span>${new Date().toLocaleTimeString()}</span>
              </div>
                          <div class="bill-info-row">
              <span>Cashier:</span>
              <span>${selectedCashier?.name || 'No cashier selected'}</span>
            </div>
            ${customerInfo.name ? `
              <div class="bill-info-row">
                <span>Customer:</span>
                <span>${customerInfo.name}</span>
              </div>
            ` : ''}
            </div>
            
            <table class="items-table">
              <thead>
                <tr>
                  <th class="item-name">Item</th>
                  <th class="item-qty">Qty</th>
                  <th class="item-price">Amount</th>
                </tr>
              </thead>
              <tbody>
                ${cart.map(item => `
                  <tr>
                    <td class="item-name">${item.name}</td>
                    <td class="item-qty">${item.quantity}</td>
                    <td class="item-price">${shopSettings.currency} ${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals-section">
              <div class="total-row">
                <span>Subtotal:</span>
                <span>${shopSettings.currency} ${subtotal.toLocaleString()}</span>
              </div>
              ${discountAmount > 0 ? `
                <div class="total-row">
                  <span>Discount:</span>
                  <span>-${shopSettings.currency} ${discountAmount.toLocaleString()}</span>
                </div>
              ` : ''}
              <div class="total-row final">
                <span>TOTAL:</span>
                <span>${shopSettings.currency} ${total.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="payment-info">
              <div class="total-row">
                <span>Payment:</span>
                <span>${paymentInfo.method.replace('_', ' ').toUpperCase()}</span>
              </div>
              ${paymentInfo.method === 'cash' ? `
                <div class="total-row">
                  <span>Amount Paid:</span>
                  <span>${shopSettings.currency} ${paymentInfo.amountPaid.toLocaleString()}</span>
                </div>
                <div class="total-row">
                  <span>Change:</span>
                  <span>${shopSettings.currency} ${paymentInfo.change.toLocaleString()}</span>
                </div>
              ` : ''}
              ${paymentInfo.method !== 'cash' && paymentInfo.reference ? `
                <div class="total-row">
                  <span>Ref:</span>
                  <span>${paymentInfo.reference}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="receipt-footer">
              <div>${shopSettings?.receiptFooter || 'Thank you for your business!'}</div>
              <div style="margin-top: 5px; font-size: 8px;">
                Powered by Kashero POS System
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Write the document to the new window
    printWindow.document.write(printDocument);
    printWindow.document.close();
    
    // Wait for the content to load, then print
    printWindow.onload = function() {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        
        // Close the window after printing (optional)
        printWindow.onafterprint = function() {
          printWindow.close();
        };
      }, 250);
    };
  };

  // Handle click outside to close modal
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Bill Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Bill Content - Hidden div for print content */}
        <div id="bill-content-for-print" style={{ display: 'none' }}>
          {/* This content is used for printing but not displayed */}
        </div>

        {/* Visible Bill Content */}
        <div className="p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          {/* Shop Header */}
          <div className="text-center mb-8">
            {/* Invoice Logo - Try both business and shop settings */}
            {(businessSettings.invoiceLogoBase64 || shopSettings.invoiceLogoBase64) && (
              <img
                src={businessSettings.invoiceLogoBase64 || shopSettings.invoiceLogoBase64}
                alt="Shop Logo"
                className="max-h-20 mx-auto mb-4 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {shopSettings?.name || 'My Shop'}
            </h1>
            {shopSettings?.branch && (
              <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mt-1">
                {shopSettings.branch} Branch
              </p>
            )}
            {shopSettings?.address && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {shopSettings.address}
              </p>
            )}
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
              {shopSettings?.phone && 
                <span>Tel: {shopSettings.phone}</span>
              }
              {shopSettings?.email && 
                <span>Email: {shopSettings.email}</span>
              }
            </div>
            {shopSettings?.registrationNo && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Reg. No: {shopSettings.registrationNo}
              </p>
            )}
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bill To:</h3>
              <p className="text-gray-700 dark:text-gray-300">{customerInfo.name || 'Walk-in Customer'}</p>
              {customerInfo.phone && <p className="text-gray-700 dark:text-gray-300">{customerInfo.phone}</p>}
              {customerInfo.email && <p className="text-gray-700 dark:text-gray-300">{customerInfo.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-700 dark:text-gray-300"><strong>Bill #:</strong> {generateBillNumber()}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Time:</strong> {new Date().toLocaleTimeString()}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Cashier:</strong> {selectedCashier?.name || 'No cashier selected'}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700">
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left text-gray-900 dark:text-white">Item</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">Qty</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">Price</th>
                  <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">Total</th>
                </tr>
              </thead>
              <tbody>
                {cart.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-900 dark:text-white">{item.name}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">{item.quantity}</td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">
                      {shopSettings.currency} {item.price.toLocaleString()}
                    </td>
                    <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right text-gray-900 dark:text-white">
                      {shopSettings.currency} {(item.price * item.quantity).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-gray-900 dark:text-white">
                <span>Subtotal:</span>
                <span>{shopSettings.currency} {subtotal.toLocaleString()}</span>
              </div>
              
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount:</span>
                  <span>-{shopSettings.currency} {discountAmount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold border-t border-gray-300 dark:border-gray-600 pt-2 text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>{shopSettings.currency} {total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Payment Method:</span>
                <span className="capitalize">{paymentInfo.method.replace('_', ' ')}</span>
              </div>

              {paymentInfo.method === 'cash' && (
                <>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Amount Paid:</span>
                    <span>{shopSettings.currency} {paymentInfo.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Change:</span>
                    <span>{shopSettings.currency} {paymentInfo.change.toLocaleString()}</span>
                  </div>
                </>
              )}

              {paymentInfo.method !== 'cash' && paymentInfo.reference && (
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                  <span>Reference:</span>
                  <span>{paymentInfo.reference}</span>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {shopSettings?.receiptFooter || 'Thank you for your business!'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Powered by Kashero POS System
            </p>
          </div>
        </div>

        {/* Action Buttons - Separate Footer (NOT included in bill) */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-end items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Action Buttons */}
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={onConfirm}
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Confirm & Process</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillPreview;