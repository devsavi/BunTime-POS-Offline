import React, { useState, useRef, useEffect } from 'react';
import { useReturns } from '../../contexts/ReturnsContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { Eye, Clock, CheckCircle, XCircle, RotateCcw, X } from 'lucide-react';

const ReturnsList = () => {
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const { returns } = useReturns();
  const { currentUser } = useAuth();
  const modalRef = useRef(null);

  // Close modal on outside click
  useEffect(() => {
    if (!selectedReturn) return;
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setSelectedReturn(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [selectedReturn]);

  // Filter returns by current user and status
  // Debug log to see what we're working with
  console.log('Current User:', currentUser);
  console.log('All Returns:', returns);

  const filteredReturns = returns.filter(returnItem => {
    const matchesUser = returnItem.createdBy === currentUser.id;
    console.log('Return Item:', returnItem, 'Matches User?', matchesUser);
    const matchesStatus = statusFilter === 'all' || returnItem.status === statusFilter;
    return matchesUser && matchesStatus;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200';
      case 'approved':
        return 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Returns</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">My Return Requests</h3>
        </div>

        {filteredReturns.length === 0 ? (
          <div className="text-center py-12">
            <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No returns found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === 'all' ? 
                'You haven\'t submitted any return requests yet' :
                `No ${statusFilter} returns found`
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Return #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Total Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredReturns.map((returnItem) => (
                  <tr key={returnItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      #{returnItem.returnNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {format(new Date(returnItem.createdAt), 'MMM dd, yyyy HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {returnItem.customerName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {returnItem.totalItems} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      LKR {returnItem.totalValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.status)}`}>
                        {getStatusIcon(returnItem.status)}
                        <span className="capitalize">{returnItem.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedReturn(returnItem)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Return Details Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Return Details - #{selectedReturn.returnNumber}
              </h2>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Return Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Return Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Return Number:</span>
                      <span className="text-gray-900 dark:text-white">#{selectedReturn.returnNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Date Created:</span>
                      <span className="text-gray-900 dark:text-white">
                        {format(new Date(selectedReturn.createdAt), 'MMM dd, yyyy HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedReturn.status)}`}>
                        {getStatusIcon(selectedReturn.status)}
                        <span className="capitalize">{selectedReturn.status}</span>
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Items:</span>
                      <span className="text-gray-900 dark:text-white">{selectedReturn.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Total Value:</span>
                      <span className="text-gray-900 dark:text-white">LKR {selectedReturn.totalValue.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-3">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Name:</span>
                      <span className="text-gray-900 dark:text-white">{selectedReturn.customerName || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Phone:</span>
                      <span className="text-gray-900 dark:text-white">{selectedReturn.customerPhone || 'N/A'}</span>
                    </div>
                    {selectedReturn.notes && (
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Notes:</span>
                        <p className="text-gray-900 dark:text-white mt-1">{selectedReturn.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Return Items */}
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Return Items</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Product</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Quantity</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedReturn.items.map((item, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            <div>
                              <div className="font-medium">{item.productName}</div>
                              {item.productBarcode && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  Barcode: {item.productBarcode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {item.productCurrency} {item.productPrice.toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                            {item.productCurrency} {(item.productPrice * item.quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status Information */}
              {selectedReturn.status !== 'pending' && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-2">Status Information</h3>
                  <div className="space-y-2 text-sm">
                    {selectedReturn.status === 'approved' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Approved By:</span>
                          <span className="text-gray-900 dark:text-white">{selectedReturn.adminEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Approved At:</span>
                          <span className="text-gray-900 dark:text-white">
                            {format(new Date(selectedReturn.approvedAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                      </>
                    )}
                    {selectedReturn.status === 'rejected' && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Rejected By:</span>
                          <span className="text-gray-900 dark:text-white">{selectedReturn.adminEmail}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Rejected At:</span>
                          <span className="text-gray-900 dark:text-white">
                            {format(new Date(selectedReturn.rejectedAt), 'MMM dd, yyyy HH:mm')}
                          </span>
                        </div>
                        {selectedReturn.rejectionReason && (
                          <div>
                            <span className="text-gray-600 dark:text-gray-400">Rejection Reason:</span>
                            <p className="text-gray-900 dark:text-white mt-1">{selectedReturn.rejectionReason}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReturnsList;