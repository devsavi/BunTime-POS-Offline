import React, { useState, useRef, useEffect } from 'react';
import { useReturns } from '../../contexts/ReturnsContext';
import { format } from 'date-fns';
import { Eye, CheckCircle, XCircle, Clock, X, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

const AdminReturns = () => {
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showApproveModal, setShowApproveModal] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { returns, approveReturn, rejectReturn, validateReturnQuantities } = useReturns();
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

  // Filter returns by status
  const filteredReturns = returns.filter(returnItem => {
    return statusFilter === 'all' || returnItem.status === statusFilter;
  });

  const handleApprove = async () => {
    setLoading(true);
    try {
      const result = await approveReturn(showApproveModal);
      if (result.success) {
        setShowApproveModal(null);
        setSelectedReturn(null);
        toast.success('Return approved and items removed from inventory!');
      } else {
        toast.error(result.error || 'Failed to approve return');
      }
    } catch (error) {
      console.error('Error approving return:', error);
      toast.error(error.message || 'Failed to approve return');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;
    
    if (!finalReason.trim()) {
      alert('Please provide a rejection reason');
      return;
    }

    setLoading(true);
    try {
      const result = await rejectReturn(showRejectModal, finalReason);
      if (result.success) {
        setShowRejectModal(null);
        setRejectionReason('');
        setCustomReason('');
        setSelectedReturn(null);
        toast.success('Return rejected successfully!');
      } else {
        toast.error(result.error || 'Failed to reject return');
      }
    } catch (error) {
      console.error('Error rejecting return:', error);
      toast.error(error.message || 'Failed to reject return');
    } finally {
      setLoading(false);
    }
  };

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

  const pendingCount = returns.filter(r => r.status === 'pending').length;

  const rejectionReasons = [
    'Insufficient stock in inventory',
    'Product not eligible for return',
    'Return period expired',
    'Product condition not acceptable',
    'Missing required documentation',
    'Duplicate return request',
    'Other'
  ];

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Pending Returns</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-800 dark:text-green-200">Approved Returns</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                {returns.filter(r => r.status === 'approved').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center space-x-3">
            <XCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-800 dark:text-red-200">Rejected Returns</p>
              <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                {returns.filter(r => r.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Status:</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="all">All Returns</option>
          </select>
        </div>
      </div>

      {/* Returns List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Return Requests {statusFilter !== 'all' && `(${statusFilter})`}
          </h3>
        </div>

        {filteredReturns.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No returns found</h3>
            <p className="text-gray-500 dark:text-gray-400">
              {statusFilter === 'pending' ? 
                'No pending returns to review' :
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
                    Cashier
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
                {filteredReturns.map((returnItem) => {
                  const validationErrors = returnItem.status === 'pending' ? validateReturnQuantities(returnItem.items) : [];
                  const hasValidationErrors = validationErrors.length > 0;
                  
                  return (
                    <tr key={returnItem.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${hasValidationErrors ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div className="flex items-center space-x-2">
                          <span>#{returnItem.returnNumber}</span>
                          {hasValidationErrors && (
                            <AlertTriangle className="w-4 h-4 text-red-500" title="Validation errors detected" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {format(new Date(returnItem.createdAt), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {returnItem.cashierEmail}
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
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => setSelectedReturn(returnItem)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {returnItem.status === 'pending' && (
                            <>
                              <button
                                onClick={() => setShowApproveModal(returnItem.id)}
                                disabled={loading || hasValidationErrors}
                                className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300 disabled:opacity-50 disabled:cursor-not-allowed"
                                title={hasValidationErrors ? "Cannot approve - validation errors" : "Approve Return"}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              
                              <button
                                onClick={() => setShowRejectModal(returnItem.id)}
                                disabled={loading}
                                className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 disabled:opacity-50"
                                title="Reject Return"
                              >
                                <XCircle className="w-4 h-4" />
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
              {/* Validation Errors */}
              {selectedReturn.status === 'pending' && (() => {
                const errors = validateReturnQuantities(selectedReturn.items);
                return errors.length > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                      <div>
                        <h4 className="text-sm font-medium text-red-800 dark:text-red-200">Cannot Approve Return</h4>
                        <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside">
                          {errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })()}

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
                      <span className="text-gray-600 dark:text-gray-400">Cashier:</span>
                      <span className="text-gray-900 dark:text-white">{selectedReturn.cashierEmail}</span>
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
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Return Qty</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Available</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Unit Price</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Total</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {selectedReturn.items.map((item, index) => {
                        const validationErrors = validateReturnQuantities([item]);
                        const hasError = validationErrors.length > 0;
                        
                        return (
                          <tr key={index} className={hasError ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              <div>
                                <div className="font-medium flex items-center space-x-2">
                                  <span>{item.productName}</span>
                                  {hasError && <AlertTriangle className="w-4 h-4 text-red-500" />}
                                </div>
                                {item.productBarcode && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    Barcode: {item.productBarcode}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.quantity}</td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {item.maxQuantity || 'N/A'}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {item.productCurrency} {item.productPrice.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                              {item.productCurrency} {(item.productPrice * item.quantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">{item.reason}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setSelectedReturn(null)}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Close
                </button>

                {selectedReturn.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowRejectModal(selectedReturn.id)}
                      disabled={loading}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                    
                    <button
                      onClick={() => setShowApproveModal(selectedReturn.id)}
                      disabled={loading || validateReturnQuantities(selectedReturn.items).length > 0}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Approve & Remove from Stock</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approve Confirmation Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Return Approval</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to approve this return? This will <strong>remove</strong> the returned items from inventory and cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowApproveModal(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                <span>Yes, Approve Return</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Custom Reason Input */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full mx-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reject Return Request</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please select a reason for rejecting this return request:
            </p>
            
            <div className="space-y-3 mb-4">
              {rejectionReasons.map(reason => (
                <label key={reason} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="rejectionReason"
                    value={reason}
                    checked={rejectionReason === reason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">{reason}</span>
                </label>
              ))}
            </div>

            {/* Custom reason input when "Other" is selected */}
            {rejectionReason === 'Other' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Please specify the reason:
                </label>
                <textarea
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Enter custom rejection reason..."
                />
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                  setCustomReason('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason || (rejectionReason === 'Other' && !customReason.trim())}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>Reject Return</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReturns;