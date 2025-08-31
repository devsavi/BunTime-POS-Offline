import React from 'react';
import { X, Printer, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { useShop } from '../../contexts/ShopContext';

const InvoicePrint = ({ bill, onClose }) => {
  const { shopSettings } = useShop();

  const handlePrint = () => {
    // Create a hidden iframe for printing instead of opening a new window
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-1000px';
    printFrame.style.left = '-1000px';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = 'none';
    
    // Add the iframe to the document
    document.body.appendChild(printFrame);
    
    // Create the print document with receipt formatting
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt - ${bill.billNumber}</title>
          <style>
            body {
              font-family: 'Courier New', monospace;
              font-size: 12px;
              line-height: 1.3;
              color: #000;
              background: #fff;
              margin: 0;
              padding: 0;
              font-weight: bold;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              min-height: 100vh;
            }
            .receipt-container {
              width: 70mm;
              max-width: 70mm;
              margin: 0 auto;
              padding: 3mm;
              background: #fff;
            }
            .receipt-header {
              text-align: center;
              margin-bottom: 12px;
              border-bottom: 1px dashed #000;
              padding-bottom: 8px;
            }
            .shop-logo {
              max-width: 50mm;
              max-height: 18mm;
              margin: 0 auto 6px auto;
              display: block;
            }
            .shop-name {
              font-size: 16px;
              font-weight: 900;
              margin-bottom: 3px;
            }
            .shop-details {
              font-size: 11px;
              margin-bottom: 2px;
              font-weight: bold;
            }
            .bill-info {
              margin: 8px 0;
              font-size: 11px;
              font-weight: bold;
            }
            .bill-info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
            }
            .items-table {
              width: 100%;
              margin: 12px 0;
              border-collapse: collapse;
            }
            .items-table th,
            .items-table td {
              text-align: left;
              padding: 2px 0;
              font-size: 11px;
              border: none;
            }
            .items-table th {
              border-bottom: 1px dashed #000;
              font-weight: 900;
            }
            .item-name { width: 45%; padding-right: 2px; }
            .item-qty { width: 15%; text-align: center; }
            .item-price { width: 40%; text-align: right; padding-right: 0; }
            .items-table td.item-price {
              text-align: right;
              padding-right: 0;
            }
            .items-table th.item-price {
              text-align: right;
              padding-right: 0;
            }
            .totals-section {
              margin-top: 12px;
              border-top: 1px dashed #000;
              padding-top: 8px;
              font-weight: bold;
            }
            .total-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 4px;
              font-size: 16px;
            }
            .total-row.final {
              font-weight: bold;
              font-size: 18px;
              border-top: 1px solid #000;
              padding-top: 5px;
              margin-top: 5px;
            }
            .payment-info {
              margin: 12px 0;
              font-size: 14px;
            }
            .receipt-footer {
              text-align: center;
              margin-top: 18px;
              border-top: 1px dashed #000;
              padding-top: 8px;
              font-size: 14px;
            }
            @media print {
              body {
                margin: 0;
                padding: 0;
                display: block;
                background: #fff;
              }
              .receipt-container {
                width: 70mm;
                margin: 0 auto;
                padding: 2mm;
                background: #fff;
              }
              @page {
                size: 70mm auto;
                margin: 0;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="receipt-header">
              ${shopSettings.invoiceLogoBase64 ? `<img src="${shopSettings.invoiceLogoBase64}" alt="Shop Logo" class="shop-logo" />` : ''}
              <div class="shop-name">${shopSettings.name || 'My Shop'}</div>
              ${shopSettings.branch ? `<div class="shop-details">${shopSettings.branch} Branch</div>` : ''}
              ${shopSettings.address ? `<div class="shop-details">${shopSettings.address}</div>` : ''}
              ${shopSettings.phone ? `<div class="shop-details">Tel: ${shopSettings.phone}</div>` : ''}
              ${shopSettings.email ? `<div class="shop-details">Email: ${shopSettings.email}</div>` : ''}
              ${shopSettings.registrationNo ? `<div class="shop-details">Reg. No: ${shopSettings.registrationNo}</div>` : ''}
            </div>
            <div class="bill-info">
              <div class="bill-info-row"><span>Bill #:</span><span>${bill.billNumber}</span></div>
              <div class="bill-info-row"><span>Date:</span><span>${new Date(bill.createdAt).toLocaleDateString()}</span></div>
              <div class="bill-info-row"><span>Time:</span><span>${new Date(bill.createdAt).toLocaleTimeString()}</span></div>
              <div class="bill-info-row"><span>Cashier:</span><span>${bill.cashier.name || bill.cashier.email}</span></div>
              ${bill.customer.name ? `<div class="bill-info-row"><span>Customer:</span><span>${bill.customer.name}</span></div>` : ''}
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
                ${bill.items.map(item => `
                  <tr>
                    <td class="item-name">${item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name}</td>
                    <td class="item-qty">${item.quantity}</td>
                    <td class="item-price">${shopSettings.currency} ${(item.price * item.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="totals-section">
              <div class="total-row"><span>Subtotal:</span><span>${shopSettings.currency} ${bill.subtotal.toLocaleString()}</span></div>
              ${bill.discount.amount > 0 ? `<div class="total-row"><span>Discount:</span><span>-${shopSettings.currency} ${bill.discount.amount.toLocaleString()}</span></div>` : ''}
              <div class="total-row final"><span>TOTAL:</span><span>${shopSettings.currency} ${bill.total.toLocaleString()}</span></div>
            </div>
            <div class="payment-info">
              <div class="total-row"><span>Payment:</span><span>${bill.payment.method.replace('_', ' ').toUpperCase()}</span></div>
              ${bill.payment.method === 'cash' ? `<div class="total-row"><span>Amount Paid:</span><span>${shopSettings.currency} ${bill.payment.amountPaid.toLocaleString()}</span></div><div class="total-row"><span>Change:</span><span>${shopSettings.currency} ${bill.payment.change.toLocaleString()}</span></div>` : ''}
              ${bill.payment.method !== 'cash' && bill.payment.reference ? `<div class="total-row"><span>Ref:</span><span>${bill.payment.reference}</span></div>` : ''}
            </div>
            <div class="receipt-footer">
              <div>${shopSettings.receiptFooter || 'Thank You, Come Again!'}</div>
              <div style="font-size: 10px; margin-top: 4px;">Powered by WhirlTech Solutions</div>
            </div>
          </div>
        </body>
      </html>
    `;
    
    // Write the document to the iframe
    const frameDoc = printFrame.contentDocument || printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(printDocument);
    frameDoc.close();
    
    // Wait for the content to load, then print
    printFrame.onload = function() {
      setTimeout(() => {
        // Focus the iframe and trigger print
        printFrame.contentWindow.focus();
        printFrame.contentWindow.print();
        
        // Remove the iframe after printing
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 250);
    };
  };

  const handleDownload = () => {
    try {
      // Create a new jsPDF instance
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [70, 200] // 70mm width, auto height
      });
      doc.setFont('courier', 'normal');
      let yPosition = 5;
      const pageWidth = 70;
      const margin = 3;
      const contentWidth = pageWidth - (margin * 2);

      // Helper function to add centered text
      const addCenteredText = (text, fontSize = 16, isBold = true) => {
        doc.setFontSize(fontSize);
        if (isBold) {
          doc.setFont('courier', 'bold');
        } else {
          doc.setFont('courier', 'bold');
        }
        const textWidth = doc.getTextWidth(text);
        const x = (pageWidth - textWidth) / 2;
        doc.text(text, x, yPosition);
        yPosition += fontSize * 0.6;
      };

      // Helper function to add left-right aligned text
      const addLeftRightText = (leftText, rightText, fontSize = 14) => {
        doc.setFontSize(fontSize);
        doc.setFont('courier', 'bold');
        doc.text(leftText, margin, yPosition);
        const rightTextWidth = doc.getTextWidth(rightText);
        doc.text(rightText, pageWidth - margin - rightTextWidth, yPosition);
        yPosition += fontSize * 0.6;
      };

      // Helper function to add dashed line
      const addDashedLine = () => {
        const dashLength = 2;
        const gapLength = 1;
        let x = margin;
        
        while (x < pageWidth - margin) {
          doc.line(x, yPosition, Math.min(x + dashLength, pageWidth - margin), yPosition);
          x += dashLength + gapLength;
        }
        yPosition += 3;
      };

      // Add logo if available
      if (shopSettings.invoiceLogoBase64) {
        try {
          // Add the logo image
          doc.addImage(shopSettings.invoiceLogoBase64, 'PNG', margin + 10, yPosition, 44, 12);
          yPosition += 15;
        } catch (error) {
          console.warn('Could not add logo to PDF:', error);
        }
      }

      // Shop Header
      addCenteredText(shopSettings.name || 'My Shop', 12, true);
      if (shopSettings.address) {
        addCenteredText(shopSettings.address, 7);
      }
      if (shopSettings.phone) {
        addCenteredText(`Tel: ${shopSettings.phone}`, 7);
      }
      if (shopSettings.email) {
        addCenteredText(`Email: ${shopSettings.email}`, 7);
      }
      
      yPosition += 2;
      addDashedLine();

      // Bill Information
      addLeftRightText('Bill #:', bill.billNumber);
      addLeftRightText('Date:', new Date(bill.createdAt).toLocaleDateString());
      addLeftRightText('Time:', new Date(bill.createdAt).toLocaleTimeString());
      addLeftRightText('Cashier:', bill.cashier.name || bill.cashier.email);
      
      if (bill.customer.name) {
        addLeftRightText('Customer:', bill.customer.name);
      }

      yPosition += 2;
      addDashedLine();

      // Items Header
      doc.setFontSize(8);
      doc.setFont('courier', 'bold');
      doc.text('Item', margin, yPosition);
      doc.text('Qty', margin + 32, yPosition);
      doc.text('Amount', pageWidth - margin - doc.getTextWidth('Amount'), yPosition);
      yPosition += 4;
      addDashedLine();

      // Items
      doc.setFont('courier', 'bold');
      bill.items.forEach(item => {
        // Item name with proper truncation
        const maxNameWidth = 25; // Adjust based on testing
        const itemName = item.name.length > maxNameWidth ? item.name.substring(0, maxNameWidth) + '...' : item.name;
        doc.text(itemName, margin, yPosition);
        
        // Quantity in center
        const qtyText = item.quantity.toString();
        const qtyX = margin + 32;
        doc.text(qtyText, qtyX, yPosition);
        
        // Amount right-aligned
        const amount = `${shopSettings.currency} ${(item.price * item.quantity).toLocaleString()}`;
        const amountWidth = doc.getTextWidth(amount);
        doc.text(amount, pageWidth - margin - amountWidth, yPosition);
        yPosition += 4;
      });

      yPosition += 2;
      addDashedLine();

      // Totals
      addLeftRightText('Subtotal:', `${shopSettings.currency} ${bill.subtotal.toLocaleString()}`);
      
      if (bill.discount.amount > 0) {
        addLeftRightText('Discount:', `-${shopSettings.currency} ${bill.discount.amount.toLocaleString()}`);
      }

      // Final total with bold line
      yPosition += 1;
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 3;
      
      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      addLeftRightText('TOTAL:', `${shopSettings.currency} ${bill.total.toLocaleString()}`, 10);

      yPosition += 2;
      addDashedLine();

      // Payment Information
      doc.setFontSize(8);
      doc.setFont('courier', 'normal');
      addLeftRightText('Payment:', bill.payment.method.replace('_', ' ').toUpperCase());
      
      if (bill.payment.method === 'cash') {
        addLeftRightText('Amount Paid:', `${shopSettings.currency} ${bill.payment.amountPaid.toLocaleString()}`);
        addLeftRightText('Change:', `${shopSettings.currency} ${bill.payment.change.toLocaleString()}`);
      }
      
      if (bill.payment.method !== 'cash' && bill.payment.reference) {
        addLeftRightText('Reference:', bill.payment.reference);
      }

      yPosition += 5;
      addDashedLine();

      // Footer
      addCenteredText(shopSettings.receiptFooter || 'Thank You, Come Again!', 8);
      yPosition += 2;
      addCenteredText('Powered by WhirlTech Solutions', 6);

      // Save the PDF
      const fileName = `receipt-${bill.billNumber}-${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again or contact support.');
    }
  };

  // Handle backdrop click to close modal
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
        className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Invoice</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Invoice Content */}
        <div id="invoice-content" className="p-8 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          {/* Shop Header */}
          <div className="text-center mb-8">
            {/* Invoice Logo */}
            {shopSettings.invoiceLogoBase64 && (
              <img
                src={shopSettings.invoiceLogoBase64}
                alt="Shop Logo"
                className="max-h-20 mx-auto mb-4 object-contain"
              />
            )}
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{shopSettings.name || 'My Shop'}</h1>
            {shopSettings.address && (
              <p className="text-gray-600 dark:text-gray-400 mt-1">{shopSettings.address}</p>
            )}
            <div className="flex justify-center space-x-4 text-sm text-gray-600 dark:text-gray-400 mt-2">
              {shopSettings.phone && <span>Tel: {shopSettings.phone}</span>}
              {shopSettings.email && <span>Email: {shopSettings.email}</span>}
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Bill To:</h3>
              <p className="text-gray-700 dark:text-gray-300">{bill.customer.name || 'Walk-in Customer'}</p>
              {bill.customer.phone && <p className="text-gray-700 dark:text-gray-300">{bill.customer.phone}</p>}
              {bill.customer.email && <p className="text-gray-700 dark:text-gray-300">{bill.customer.email}</p>}
            </div>
            <div className="text-right">
              <p className="text-gray-700 dark:text-gray-300"><strong>Invoice #:</strong> {bill.billNumber}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Date:</strong> {new Date(bill.createdAt).toLocaleDateString()}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Time:</strong> {new Date(bill.createdAt).toLocaleTimeString()}</p>
              <p className="text-gray-700 dark:text-gray-300"><strong>Cashier:</strong> {bill.cashier.name || bill.cashier.email}</p>
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
                {bill.items.map((item, index) => (
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
                <span>{shopSettings.currency} {bill.subtotal.toLocaleString()}</span>
              </div>
              
              {bill.discount.amount > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400">
                  <span>Discount:</span>
                  <span>-{shopSettings.currency} {bill.discount.amount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="flex justify-between text-xl font-bold border-t border-gray-300 dark:border-gray-600 pt-2 text-gray-900 dark:text-white">
                <span>Total:</span>
                <span>{shopSettings.currency} {bill.total.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>Payment Method:</span>
                <span className="capitalize">{bill.payment.method.replace('_', ' ')}</span>
              </div>

              {bill.payment.method === 'cash' && (
                <>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Amount Paid:</span>
                    <span>{shopSettings.currency} {bill.payment.amountPaid.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                    <span>Change:</span>
                    <span>{shopSettings.currency} {bill.payment.change.toLocaleString()}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-300 dark:border-gray-600">
            <p className="text-sm text-gray-600 dark:text-gray-400">{shopSettings.receiptFooter || 'Thank You, Come Again!'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500">
              Powered by WhirlTech Solutions
            </p>
          </div>
        </div>

        {/* Action Buttons - Separate Footer (NOT included in invoice) */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-4 border-t border-gray-200 dark:border-gray-700 rounded-b-lg">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-3 sm:space-y-0 sm:space-x-3">
            {/* Print Button - Separate from invoice content */}
            <button
              onClick={handlePrint}
              className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
            >
              <Printer className="w-5 h-5" />
              <span>Print Receipt</span>
            </button>

            {/* Additional Actions */}
            <div className="flex space-x-3">
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrint;