import React from 'react';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { useShop } from '../../contexts/ShopContext';

const GRNView = ({ grn, onClose }) => {
  const { shopSettings } = useShop();

  if (!grn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            GRN Details - {grn.grnNumber}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* GRN Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">GRN Information</h3>
              <div className="space-y-1 text-sm">
                <p><span className="text-gray-600 dark:text-gray-400">Date:</span> {format(new Date(grn.createdAt), 'MMM dd, yyyy HH:mm')}</p>
                <p><span className="text-gray-600 dark:text-gray-400">Created By:</span> {grn.cashierName || grn.createdBy || 'Unknown'}</p>
                <p><span className="text-gray-600 dark:text-gray-400">Created Email:</span> {grn.creatorEmail || grn.createdBy}</p>
                <p><span className="text-gray-600 dark:text-gray-400">Status:</span> <span className="capitalize">{grn.status}</span></p>
              </div>
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Items</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Item</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Cost</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {grn.items.map((item, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.name}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {shopSettings.currency} {item.price?.toLocaleString() || '0'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {shopSettings.currency} {((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">Total Value:</span>
                  <span className="text-gray-900 dark:text-white">{shopSettings.currency} {grn.totalValue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GRNView;
