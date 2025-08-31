import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useShop } from '../../contexts/ShopContext';
import { useCustomer } from '../../contexts/CustomerContext';
import { Users as UsersIcon, UserPlus, Edit2, Trash2, User, Phone, Mail, Download, Eye, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Customers = () => {
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [viewingCustomer, setViewingCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { currentUser } = useAuth();
  const { shopSettings } = useShop();
  const { customers, loading, addCustomer, updateCustomer, deleteCustomer } = useCustomer();
  const { t } = useTranslation();

  const handleAddCustomer = async (customerData) => {
    try {
      const result = await addCustomer(customerData);
      if (result.success) {
        toast.success('Customer added successfully!');
        setEditingCustomer(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Error adding customer: ' + error.message);
    }
  };

  const handleUpdateCustomer = async (customerId, updates) => {
    try {
      const result = await updateCustomer(customerId, updates);
      if (result.success) {
        toast.success('Customer updated successfully!');
        setEditingCustomer(null);
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast.error('Error updating customer: ' + error.message);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        const result = await deleteCustomer(customerId);
        if (result.success) {
          toast.success('Customer deleted successfully!');
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        toast.error('Error deleting customer: ' + error.message);
      }
    }
  };

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.phone?.includes(searchTerm) ||
    customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading customers...</p>
      </div>
    );
  }

  const exportToExcel = () => {
    try {
      if (!customers || customers.length === 0) {
        toast.error('No customers to export');
        return;
      }

      const exportData = customers.map(customer => ({
        'Customer ID': customer.id,
        'Name': customer.name || '',
        'Phone': customer.phone || '',
        'Email': customer.email || '',
        'Address': customer.address || '',
        'Total Purchases': customer.totalPurchases || 0,
        'Last Visit': customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never',
        'Created Date': customer.createdAt ? new Date(customer.createdAt).toLocaleDateString() : '',
        'Notes': customer.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, 
        { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Customers');
      
      const fileName = `customers-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Customers exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting customers: ' + error.message);
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customer Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage customer information and purchase history</p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          
          <button
            onClick={() => setEditingCustomer({ isNew: true })}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        />
        <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
      </div>

      {/* Customers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Total Purchases
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Last Visit
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{customer.name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {customer.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {customer.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{customer.phone}</span>
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="w-3 h-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.address || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {shopSettings?.currency || 'LKR'} {(customer.totalPurchases || 0).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingCustomer(customer)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingCustomer(customer)}
                        className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteCustomer(customer.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCustomers.length === 0 && (
            <div className="text-center py-8">
              <User className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No customers found</p>
            </div>
          )}
        </div>
      </div>

      {/* Customer Form Modal */}
      {editingCustomer && (
        <CustomerForm
          customer={editingCustomer}
          onSave={editingCustomer.isNew ? handleAddCustomer : (updates) => handleUpdateCustomer(editingCustomer.id, updates)}
          onClose={() => setEditingCustomer(null)}
        />
      )}

      {/* Customer View Modal */}
      {viewingCustomer && (
        <CustomerView
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
        />
      )}
    </div>
  );
};

const CustomerForm = ({ customer, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: customer.name || '',
    phone: customer.phone || '',
    email: customer.email || '',
    address: customer.address || '',
    notes: customer.notes || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {customer.isNew ? 'Add Customer' : 'Edit Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <UsersIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {customer.isNew ? 'Add Customer' : 'Update Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CustomerView = ({ customer, onClose }) => {
  const { t } = useTranslation();
  const { shopSettings } = useShop();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('customerDetails')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('basicInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600 dark:text-gray-400">{t('customerName')}:</span> <span className="text-gray-900 dark:text-white">{customer.name}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('customerId')}:</span> <span className="text-gray-900 dark:text-white">{customer.id}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('totalPurchases')}:</span> <span className="text-gray-900 dark:text-white">{shopSettings?.currency || 'LKR'} {(customer.totalPurchases || 0).toLocaleString()}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('lastVisit')}:</span> <span className="text-gray-900 dark:text-white">{customer.lastVisit ? new Date(customer.lastVisit).toLocaleDateString() : 'Never'}</span></div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('contactInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600 dark:text-gray-400">{t('phone')}:</span> <span className="text-gray-900 dark:text-white">{customer.phone || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('email')}:</span> <span className="text-gray-900 dark:text-white">{customer.email || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('address')}:</span> <span className="text-gray-900 dark:text-white">{customer.address || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          {customer.notes && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('notes')}</h3>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{customer.notes}</p>
            </div>
          )}

          {customer.createdAt && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('accountInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600 dark:text-gray-400">{t('memberSince')}:</span> <span className="text-gray-900 dark:text-white">{new Date(customer.createdAt).toLocaleDateString()}</span></div>
                {customer.updatedAt && customer.updatedAt !== customer.createdAt && (
                  <div><span className="text-gray-600 dark:text-gray-400">{t('lastUpdated')}:</span> <span className="text-gray-900 dark:text-white">{new Date(customer.updatedAt).toLocaleDateString()}</span></div>
                )}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;