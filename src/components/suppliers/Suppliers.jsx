import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

import { generateId } from '../../services/localStorage';
import { Truck, UserPlus, Edit2, Trash2, User, Phone, Mail, Building, CreditCard, Package, Eye, X, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Suppliers = () => {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplier, setViewingSupplier] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { currentUser, isAdmin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    try {
      // Get suppliers from localStorage for current shop
      const allSuppliers = JSON.parse(localStorage.getItem('pos_suppliers') || '[]');
      setSuppliers(allSuppliers);
      setSuppliers(shopSuppliers);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    }
    
    setLoading(false);
  }, [currentUser]);

  const handleAddSupplier = async (supplierData) => {
    try {
      const allSuppliers = JSON.parse(localStorage.getItem('pos_suppliers') || '[]');
      const newSupplier = {
        ...supplierData,
        id: generateId(),

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: currentUser.uid
      };
      allSuppliers.push(newSupplier);
      localStorage.setItem('pos_suppliers', JSON.stringify(allSuppliers));
      
      setSuppliers(prevSuppliers => [...prevSuppliers, newSupplier]);
      toast.success('Supplier added successfully!');
      setEditingSupplier(null);
    } catch (error) {
      toast.error('Error adding supplier: ' + error.message);
    }
  };

  const handleUpdateSupplier = async (supplierId, updates) => {
    try {
      const allSuppliers = JSON.parse(localStorage.getItem('pos_suppliers') || '[]');
      const updatedSuppliers = allSuppliers.map(supplier => 
        supplier.id === supplierId
          ? { ...supplier, ...updates, updatedAt: new Date().toISOString() }
          : supplier
      );
      localStorage.setItem('pos_suppliers', JSON.stringify(updatedSuppliers));
      
      setSuppliers(prevSuppliers => 
        prevSuppliers.map(supplier =>
          supplier.id === supplierId
            ? { ...supplier, ...updates, updatedAt: new Date().toISOString() }
            : supplier
        )
      );
      toast.success('Supplier updated successfully!');
      setEditingSupplier(null);
    } catch (error) {
      toast.error('Error updating supplier: ' + error.message);
    }
  };

  const handleDeleteSupplier = async (supplierId) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        const allSuppliers = JSON.parse(localStorage.getItem('pos_suppliers') || '[]');
        const updatedSuppliers = allSuppliers.filter(supplier => supplier.id !== supplierId);
        localStorage.setItem('pos_suppliers', JSON.stringify(updatedSuppliers));
        
        setSuppliers(prevSuppliers => prevSuppliers.filter(supplier => supplier.id !== supplierId));
        toast.success('Supplier deleted successfully!');
      } catch (error) {
        toast.error('Error deleting supplier: ' + error.message);
      }
    }
  };

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.agentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.phone?.includes(searchTerm) ||
                         supplier.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && supplier.status === 'active') ||
                         (statusFilter === 'inactive' && supplier.status === 'inactive');
    
    return matchesSearch && matchesStatus;
  });

  const exportToExcel = () => {
    try {
      if (!suppliers || suppliers.length === 0) {
        toast.error('No suppliers to export');
        return;
      }

      const exportData = suppliers.map(supplier => ({
        'Supplier ID': supplier.id,
        'Supplier Name': supplier.supplierName || '',
        'Agent Name': supplier.agentName || '',
        'Company': supplier.company || '',
        'Phone': supplier.phone || '',
        'Email': supplier.email || '',
        'Address': supplier.address || '',
        'Bank Details': supplier.bankDetails || '',
        'Products Supplied': supplier.products || '',
        'Status': supplier.status || 'active',
        'Created Date': supplier.createdAt ? new Date(supplier.createdAt).toLocaleDateString() : '',
        'Last Updated': supplier.updatedAt ? new Date(supplier.updatedAt).toLocaleDateString() : '',
        'Notes': supplier.notes || ''
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      const colWidths = [
        { wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, 
        { wch: 15 }, { wch: 25 }, { wch: 30 }, { wch: 25 },
        { wch: 30 }, { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 30 }
      ];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Suppliers');
      
      const fileName = `suppliers-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast.success('Suppliers exported successfully!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting suppliers: ' + error.message);
    }
  };
  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('suppliers')}</h1>
          <p className="text-gray-600 dark:text-gray-400">{t('manageSuppliers')}</p>
        </div>
        
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
          <button
            onClick={exportToExcel}
            className="flex items-center justify-center space-x-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
          
          {isAdmin() && (
            <button
              onClick={() => setEditingSupplier({ isNew: true })}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>{t('addSupplier')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder={t('searchSuppliers')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="all">{t('allStatuses')}</option>
          <option value="active">{t('active')}</option>
          <option value="inactive">{t('inactive')}</option>
        </select>
      </div>

      {/* Suppliers List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('supplier')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('agent')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('company')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSuppliers.map((supplier) => (
                <tr key={supplier.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <Truck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">{supplier.supplierName}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">ID: {supplier.id.slice(-8)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {supplier.agentName || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">
                      {supplier.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="w-3 h-3" />
                          <span>{supplier.phone}</span>
                        </div>
                      )}
                      {supplier.email && (
                        <div className="flex items-center space-x-1 mt-1">
                          <Mail className="w-3 h-3" />
                          <span>{supplier.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {supplier.company || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      supplier.status === 'active'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {supplier.status === 'active' ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewingSupplier(supplier)}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => setEditingSupplier(supplier)}
                            className="text-green-600 dark:text-green-400 hover:text-green-900 dark:hover:text-green-300"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSupplier(supplier.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-8">
              <Truck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('noSuppliersFound')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Supplier Form Modal */}
      {editingSupplier && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={editingSupplier.isNew ? handleAddSupplier : (updates) => handleUpdateSupplier(editingSupplier.id, updates)}
          onClose={() => setEditingSupplier(null)}
        />
      )}

      {/* Supplier View Modal */}
      {viewingSupplier && (
        <SupplierView
          supplier={viewingSupplier}
          onClose={() => setViewingSupplier(null)}
        />
      )}
    </div>
  );
};

const SupplierForm = ({ supplier, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    supplierName: supplier.supplierName || '',
    agentName: supplier.agentName || '',
    phone: supplier.phone || '',
    email: supplier.email || '',
    address: supplier.address || '',
    company: supplier.company || '',
    bankDetails: supplier.bankDetails || '',
    products: supplier.products || '',
    status: supplier.status || 'active',
    notes: supplier.notes || ''
  });
  const { t } = useTranslation();

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {supplier.isNew ? t('addSupplier') : t('editSupplier')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('supplierName')} *</label>
              <input
                type="text"
                name="supplierName"
                required
                value={formData.supplierName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('agentName')}</label>
              <input
                type="text"
                name="agentName"
                value={formData.agentName}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('email')}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('company')}</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('status')}</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="active">{t('active')}</option>
                <option value="inactive">{t('inactive')}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('address')}</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('bankDetails')}</label>
            <textarea
              name="bankDetails"
              value={formData.bankDetails}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Bank name, account number, etc."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('products')}</label>
            <textarea
              name="products"
              value={formData.products}
              onChange={handleChange}
              rows={2}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Products supplied by this supplier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('notes')}</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {supplier.isNew ? t('addSupplier') : t('updateSupplier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const SupplierView = ({ supplier, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('supplierDetails')}</h2>
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
                <div><span className="text-gray-600 dark:text-gray-400">{t('supplierName')}:</span> <span className="text-gray-900 dark:text-white">{supplier.supplierName}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('agentName')}:</span> <span className="text-gray-900 dark:text-white">{supplier.agentName || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('company')}:</span> <span className="text-gray-900 dark:text-white">{supplier.company || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('status')}:</span> 
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    supplier.status === 'active'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {supplier.status === 'active' ? t('active') : t('inactive')}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('contactInformation')}</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-600 dark:text-gray-400">{t('phone')}:</span> <span className="text-gray-900 dark:text-white">{supplier.phone || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('email')}:</span> <span className="text-gray-900 dark:text-white">{supplier.email || 'N/A'}</span></div>
                <div><span className="text-gray-600 dark:text-gray-400">{t('address')}:</span> <span className="text-gray-900 dark:text-white">{supplier.address || 'N/A'}</span></div>
              </div>
            </div>
          </div>

          {supplier.bankDetails && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('bankDetails')}</h3>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{supplier.bankDetails}</p>
            </div>
          )}

          {supplier.products && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('products')}</h3>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{supplier.products}</p>
            </div>
          )}

          {supplier.notes && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">{t('notes')}</h3>
              <p className="text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">{supplier.notes}</p>
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

export default Suppliers;