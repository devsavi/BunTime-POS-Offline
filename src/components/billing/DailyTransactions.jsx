import React, { useState, useMemo } from 'react';
import { useBilling } from '../../contexts/BillingContext';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { format, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { Receipt, Eye, Trash2, Calendar, DollarSign, TrendingUp, X, Printer } from 'lucide-react';
import InvoicePrint from './InvoicePrint';
import toast from 'react-hot-toast';

const DailyTransactions = () => {
  const [selectedBill, setSelectedBill] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const { bills, deleteBill } = useBilling();
  const { isAdmin } = useAuth();
  const { shopSettings } = useShop();
  const { t } = useTranslation();

  // Filter today's transactions
  const todaysBills = useMemo(() => {
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    return bills.filter(bill => {
      const billDate = new Date(bill.createdAt);
      return isWithinInterval(billDate, { start, end });
    }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [bills]);

  const todaysStats = useMemo(() => {
    const totalRevenue = todaysBills.reduce((sum, bill) => sum + bill.total, 0);
    const totalTransactions = todaysBills.length;
    const avgTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
    
    return { totalRevenue, totalTransactions, avgTransaction };
  }, [todaysBills]);

  const handleDeleteBill = async (billId) => {
    if (!isAdmin()) {
      toast.error('Only administrators can delete bills');
      return;
    }

    try {
      const result = await deleteBill(billId);
      if (result.success) {
        setDeleteConfirm(null);
        toast.success('Bill deleted successfully!');
      } else {
        toast.error(result.error || 'Failed to delete bill');
      }
    } catch (error) {
      toast.error('Error deleting bill: ' + error.message);
    }
  };

  const handleViewBill = (bill) => {
    setSelectedBill(bill);
  };

  const handlePrintBill = (bill) => {
    setSelectedBill(bill);
    setShowInvoice(true);
  };

  const formatItemsSold = (items) => {
    if (items.length === 0) return t('noItems');
    if (items.length === 1) return `${items[0].name} (${items[0].quantity})`;
    if (items.length === 2) return `${items[0].name} (${items[0].quantity}), ${items[1].name} (${items[1].quantity})`;
    
    const firstTwo = items.slice(0, 2);
    const remaining = items.length - 2;
    return `${firstTwo[0].name} (${firstTwo[0].quantity}), ${firstTwo[1].name} (${firstTwo[1].quantity}) +${remaining} ${t('more')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('todaysTransactions')}</h3>
          </div>
          
          {/* Today's Stats */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-blue-600 dark:text-blue-400 mb-1">
                <Receipt className="w-4 h-4" />
                <span className="text-xs font-medium">{t('transactions').toUpperCase()}</span>
              </div>
              <div className="text-lg font-bold text-blue-900 dark:text-blue-100">
                {todaysStats.totalTransactions}
              </div>
            </div>
            
            <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-green-600 dark:text-green-400 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">{t('revenue').toUpperCase()}</span>
              </div>
              <div className="text-lg font-bold text-green-900 dark:text-green-100">
                {shopSettings.currency} {todaysStats.totalRevenue.toLocaleString()}
              </div>
            </div>
            
            <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
              <div className="flex items-center justify-center space-x-1 text-purple-600 dark:text-purple-400 mb-1">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-medium">{t('average').toUpperCase()}</span>
              </div>
              <div className="text-lg font-bold text-purple-900 dark:text-purple-100">
                {shopSettings.currency} {Math.round(todaysStats.avgTransaction).toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {todaysBills.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No transactions today yet</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {todaysBills.map((bill) => (
              <div key={bill.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">#{bill.billNumber}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {format(new Date(bill.createdAt), 'HH:mm:ss')}
                      </span>
                      <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                        {bill.payment.method.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      <div className="mb-1">
                        <span className="font-medium">Items:</span> {formatItemsSold(bill.items)}
                      </div>
                      {bill.customer.name && (
                        <div>
                          <span className="font-medium">Customer:</span> {bill.customer.name}
                          {bill.customer.phone && <span className="ml-2">({bill.customer.phone})</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end space-x-4">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-gray-900 dark:text-white">
                        {shopSettings.currency} {bill.total.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {bill.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0).toFixed(2)} units
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewBill(bill)}
                        className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => handlePrintBill(bill)}
                        className="p-2 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                        title="Print Invoice"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      
                      {isAdmin() && (
                        <button
                          onClick={() => setDeleteConfirm(bill.id)}
                          className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete Transaction"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bill Details Modal */}
      {selectedBill && !showInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedBill(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('transactionDetails')} - #{selectedBill.billNumber}
              </h2>
              <button
                onClick={() => setSelectedBill(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Transaction Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Transaction Info</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600 dark:text-gray-400">Date:</span> {format(new Date(selectedBill.createdAt), 'MMM dd, yyyy')}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">Time:</span> {format(new Date(selectedBill.createdAt), 'HH:mm:ss')}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">Cashier:</span> {selectedBill.cashier.email}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Customer Info</h3>
                  <div className="space-y-1 text-sm">
                    <p><span className="text-gray-600 dark:text-gray-400">Name:</span> {selectedBill.customer.name || 'Walk-in Customer'}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">Phone:</span> {selectedBill.customer.phone || 'N/A'}</p>
                    <p><span className="text-gray-600 dark:text-gray-400">Email:</span> {selectedBill.customer.email || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Items Purchased</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedBill.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{shopSettings.currency} {item.price.toLocaleString()}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{shopSettings.currency} {(item.price * item.quantity).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-end">
                  <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span className="text-gray-900 dark:text-white">{shopSettings.currency} {selectedBill.subtotal.toLocaleString()}</span>
                    </div>
                    {selectedBill.discount.amount > 0 && (
                      <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount:</span>
                        <span>-{shopSettings.currency} {selectedBill.discount.amount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-gray-900 dark:text-white">{shopSettings.currency} {selectedBill.total.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Payment Method:</span>
                      <span>{selectedBill.payment.method}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>Items:</span>
                      <span>{selectedBill.items.reduce((sum, item) => sum + parseFloat(item.quantity), 0).toFixed(2)} items</span>
                    </div>
                    {selectedBill.payment.method === 'cash' && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Amount Paid:</span>
                          <span>{shopSettings.currency} {selectedBill.payment.amountPaid.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Change:</span>
                          <span>{shopSettings.currency} {selectedBill.payment.change.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedBill(null)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {t('close')}
                </button>
                <button
                  onClick={() => handlePrintBill(selectedBill)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  <span>{t('printBill')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Invoice Modal */}
      {showInvoice && selectedBill && (
        <InvoicePrint
          bill={selectedBill}
          onClose={() => {
            setShowInvoice(false);
            setSelectedBill(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('confirmDelete')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('deleteTransactionConfirmation')}
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => handleDeleteBill(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                {t('deleteTransaction')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTransactions;