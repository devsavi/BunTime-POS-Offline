import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUsers, saveUsers, generateId } from '../services/localStorage';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (!currentUser || !isAdmin()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      // Load users from localStorage and sort by creation date
      const allUsers = getUsers();
      const sortedUsers = allUsers.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setUsers(sortedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users: ' + error.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAdmin]);

  const createUser = async (userData) => {
    try {
      // Validate required field
      if (!userData.name) {
        throw new Error('Name is required');
      }

      const allUsers = getUsers();

      const newUser = {
        id: generateId(),
        name: userData.name,
        isActive: true,
        createdAt: new Date().toISOString(),
        createdBy: currentUser.id
      };

      // Save to localStorage
      saveUsers([...allUsers, newUser]);
      setUsers(prev => [newUser, ...prev]);

      return { success: true, data: { user: newUser } };
    } catch (error) {
      console.error('Error creating user:', error);
      return { success: false, error: error.message };
    }
  };

  const updateUserStatus = async (userId, isActive) => {
    try {
      const allUsers = getUsers();
      const userIndex = allUsers.findIndex(user => user.id === userId);

      if (userIndex === -1) {
        throw new Error('User not found');
      }

      // User status check removed since roles are no longer used

      const updatedUsers = [...allUsers];
      updatedUsers[userIndex] = {
        ...updatedUsers[userIndex],
        isActive,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.id
      };

      saveUsers(updatedUsers);
      setUsers(updatedUsers);

      return { success: true, data: { user: updatedUsers[userIndex] } };
    } catch (error) {
      console.error('Error updating user status:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const allUsers = getUsers();
      const userToDelete = allUsers.find(user => user.id === userId);

      if (!userToDelete) {
        throw new Error('User not found');
      }

      // Admin check removed since roles are no longer used

      // Don't allow users to delete themselves
      if (userId === currentUser.id) {
        throw new Error('Cannot delete your own account');
      }

      const updatedUsers = allUsers.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
      setUsers(updatedUsers);

      return { success: true, data: { userId } };
    } catch (error) {
      console.error('Error deleting user:', error);
      return { success: false, error: error.message };
    }
  };

  const searchUsers = (searchTerm) => {
    return users.filter(
      (user) => user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Removed getUsersByRole since roles are no longer used

  const getActiveUsers = () => {
    return users.filter((user) => user.isActive);
  };

  const getInactiveUsers = () => {
    return users.filter((user) => !user.isActive);
  };

  const value = {
    users,
    loading,
    createUser,
    updateUserStatus,
    deleteUser,
    searchUsers,
    // getUsersByRole removed
    getActiveUsers,
    getInactiveUsers,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};