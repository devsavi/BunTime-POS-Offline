import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useAuth } from '../../contexts/AuthContext';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Users as UsersIcon, UserPlus, Trash2, User, Shield, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const { users, loading, updateUserStatus, deleteUser, searchUsers } = useUser();
  const { canManageUsers, currentUser } = useAuth();
  const { t } = useTranslation();

  // Helper function to format dates
  const formatDate = (dateString) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      if (isNaN(date)) return 'N/A';
      return format(date, 'MMM dd, yyyy');
    } catch (error) {
      console.warn('Error formatting date:', error);
      return 'N/A';
    }
  };

  // Filter users based on search term
  const filteredUsers = searchUsers(searchTerm);

  const handleStatusToggle = async (userId, currentStatus) => {
    if (userId === currentUser.uid) {
      toast.error('You cannot deactivate your own account');
      return;
    }

    try {
      const result = await updateUserStatus(userId, !currentStatus);
      if (result.success) {
        toast.success(result.data.message || 'User status updated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast.error(error.message || 'Failed to toggle user status');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (userId === currentUser.uid) {
      toast.error('You cannot delete your own account');
      return;
    }

    try {
      const result = await deleteUser(userId);
      if (result.success) {
        setDeleteConfirm(null);
        toast.success(result.data.message || 'User deleted successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const exportToExcel = () => {
    try {
      if (!users || users.length === 0) {
        toast.error('No users to export');
        return;
      }

      const exportData = users.map((user) => ({
        'User ID': user.id,
        Name: user.name || 'N/A',
        'Created Date': formatDate(user.createdAt)
      }));

      const ws = XLSX.utils.json_to_sheet(exportData);
      ws['!cols'] = [
        { wch: 15 },
        { wch: 25 },
        { wch: 15 }
      ];

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Users');
      const fileName = `users-export-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast.success('Users exported successfully!');
    } catch (error) {
      console.error('Detailed export error:', {
        message: error.message,
        stack: error.stack,
      });
      toast.error('Failed to export users: ' + error.message);
    }
  };

  if (!canManageUsers()) {
    return (
      <div className="text-center py-12">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Access Denied</h3>
        <p className="text-gray-500 dark:text-gray-400">Only super administrators can access user management.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage system users and their permissions</p>
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
            onClick={() => setShowCreateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="relative flex-1 max-w-sm">
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 ml-4">
            Showing {filteredUsers.length} of {users.length} users
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  User Name
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={user.id === currentUser.uid ? 'bg-blue-50 dark:bg-blue-900/20' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center space-x-2">
                          <span>{user.name || 'N/A'}</span>
                          {user.id === currentUser.uid && (
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {user.id !== currentUser.uid && (
                        <button
                          onClick={() => setDeleteConfirm(user.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                      {user.id === currentUser.uid && (
                        <span className="text-gray-400 dark:text-gray-500 text-xs">Current User</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="text-center py-8">
              <UsersIcon className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* Create User Form Modal */}
      {showCreateForm && <CreateUserForm onClose={() => setShowCreateForm(false)} />}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this user? This action cannot be undone and will permanently remove the user account and all associated data.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(deleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CreateUserForm = ({ onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { createUser } = useUser();

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please enter a name');
      return;
    }

    setLoading(true);

    try {
      const result = await createUser({ name: formData.name });
      if (result.success) {
        setFormData({ name: '' });
        onClose();
        toast.success(result.data.message || 'User created successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error in CreateUserForm:', error);
      toast.error(error.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Clear error on change
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full border border-gray-200 dark:border-gray-700" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <UsersIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`mt-1 w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter full name"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
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

export default Users;