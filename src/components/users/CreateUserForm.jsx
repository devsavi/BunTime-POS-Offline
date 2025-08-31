import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';

import { useAuth } from '../../contexts/AuthContext';
import { UserPlus, X } from 'lucide-react';

const CreateUserForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { createUser } = useUser();

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await createUser(formData);
      if (result.success) {
        onClose();
        // Reset form
        setFormData({
          name: ''
        });
        setErrors({});
      }
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'assignedShops') {
      const shopId = value;
      let newAssignedShops;
      
      if (checked) {
        newAssignedShops = [...formData.assignedShops, shopId];
      } else {
        newAssignedShops = formData.assignedShops.filter(id => id !== shopId);
        // If removing primary shop, clear it
        if (formData.primaryShop === shopId) {
          setFormData(prev => ({ ...prev, primaryShop: '' }));
        }
      }
      
      setFormData({ ...formData, assignedShops: newAssignedShops });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Removed role change handler as it's no longer needed



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>



          {formData.role === 'super_admin' && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Super Admin:</strong> This user will have access to all shops and administrative functions.
              </p>
            </div>
          )}

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
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>Create User</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserForm;