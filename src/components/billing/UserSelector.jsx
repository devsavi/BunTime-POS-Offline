import React, { useState } from 'react';
import { useUser } from '../../contexts/UserContext';
import { useTranslation } from 'react-i18next';
import { Search, Plus, X, Check, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const UserSelector = ({ 
  isOpen, 
  onClose, 
  onSelectUser,
  title = "Select User",
  addNewLabel = "Add New User",
  searchPlaceholder = "Search users..."
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  
  const { users, searchUsers, createUser } = useUser();
  const { t } = useTranslation();

  // Filter users based on search term
  const filteredUsers = searchUsers(searchTerm);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    try {
      const result = await createUser({ name: newUserName.trim() });
      if (result.success) {
        toast.success(result.data.message || 'User created successfully!');
        onSelectUser(result.data.user);
        setNewUserName('');
        setShowCreateForm(false);
        onClose();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error.message || 'Failed to create user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {!showCreateForm ? (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {/* Users List */}
              <div className="max-h-64 overflow-y-auto">
                <div className="space-y-2">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        onClose();
                      }}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400 text-lg font-medium">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-gray-900 dark:text-white">{user.name}</div>
                      </div>
                      <Check className="w-5 h-5 text-blue-600 dark:text-blue-400 opacity-0 group-hover:opacity-100" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Add New User Button */}
              <button
                onClick={() => setShowCreateForm(true)}
                className="w-full mt-4 flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>{addNewLabel}</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{addNewLabel}</h3>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  User Name *
                </label>
                <input
                  type="text"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Enter user name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                  autoFocus
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create User
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default UserSelector;
