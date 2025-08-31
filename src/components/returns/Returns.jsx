import React, { useState } from 'react';
import { useReturns } from '../../contexts/ReturnsContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import ReturnForm from './ReturnForm';
import ReturnsList from './ReturnsList';
import AdminReturns from './AdminReturns';
import { RotateCcw, Plus, Eye, Settings } from 'lucide-react';

const Returns = () => {
  const [activeTab, setActiveTab] = useState('create');
  const [showForm, setShowForm] = useState(false);
  const { returns, getPendingReturns } = useReturns();
  const { isAdmin, canManageReturns } = useAuth();
  const { t } = useTranslation();

  const pendingCount = getPendingReturns().length;

  const tabs = [
    { 
      id: 'create', 
      name: 'Create Return', 
      icon: Plus,
      show: true
    },
    { 
      id: 'my-returns', 
      name: 'My Returns', 
      icon: Eye,
      show: true
    },
    { 
      id: 'admin', 
      name: `Admin Review ${pendingCount > 0 ? `(${pendingCount})` : ''}`, 
      icon: Settings,
      show: canManageReturns()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
            <RotateCcw className="w-6 h-6" />
            <span>Returns Management</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {canManageReturns() ?
              'Manage product returns and approve return requests' : 
              'Submit and track product return requests'
            }
          </p>
        </div>

        {pendingCount > 0 && canManageReturns() && (
          <div className="bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 px-4 py-2 rounded-lg border border-orange-200 dark:border-orange-800">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">{pendingCount} pending returns</span>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.filter(tab => tab.show).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'create' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create New Return</h3>
                <button
                  onClick={() => setShowForm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Return Request</span>
                </button>
              </div>
              
              <div className="text-center py-8">
                <RotateCcw className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Submit Return Request</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Create a return request for products that need to be returned to inventory
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  <span>Create Return Request</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my-returns' && (
          <ReturnsList />
        )}

        {activeTab === 'admin' && canManageReturns() && (
          <AdminReturns />
        )}
      </div>

      {/* Return Form Modal */}
      {showForm && (
        <ReturnForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
};

export default Returns;