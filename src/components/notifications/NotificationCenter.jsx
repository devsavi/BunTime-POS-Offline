import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { generateId } from '../../services/localStorage';
import { Bell, Plus, X, Send, Trash2, Eye, Users, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const NotificationCenter = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState('received');
  const [loading, setLoading] = useState(true);
  const { currentUser, isAdmin } = useAuth();
  const { t } = useTranslation();

  useEffect(() => {
    if (!currentUser || !isOpen) return;

    try {
      const storedNotifications = JSON.parse(localStorage.getItem('pos_notifications') || '[]');
      // Filter notifications for current user
      const relevantNotifications = storedNotifications.filter(data => 
        data.recipientType === 'all' || 
        (data.recipientType === 'specific' && data.recipientId === currentUser.uid) ||
        (data.recipientType === 'role' && data.recipientRole === (isAdmin() ? 'admin' : 'cashier')) ||
        data.senderId === currentUser.uid
      );
      setNotifications(relevantNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
    }
    setLoading(false);
  }, [currentUser, isOpen, isAdmin]);

  const receivedNotifications = notifications.filter(n => 
    n.senderId !== currentUser.uid && 
    (n.recipientType === 'all' || 
     (n.recipientType === 'specific' && n.recipientId === currentUser.uid) ||
     (n.recipientType === 'role' && n.recipientRole === (isAdmin() ? 'admin' : 'cashier')))
  );

  const sentNotifications = notifications.filter(n => n.senderId === currentUser.uid);
  const unreadCount = receivedNotifications.filter(n => !n.readBy?.includes(currentUser.uid)).length;

  const markAsRead = async (notificationId) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('pos_notifications') || '[]');
      const notificationIndex = allNotifications.findIndex(n => n.id === notificationId);
      
      if (notificationIndex !== -1 && !allNotifications[notificationIndex].readBy?.includes(currentUser.uid)) {
        const updatedReadBy = [...(allNotifications[notificationIndex].readBy || []), currentUser.uid];
        allNotifications[notificationIndex] = {
          ...allNotifications[notificationIndex],
          readBy: updatedReadBy
        };
        localStorage.setItem('pos_notifications', JSON.stringify(allNotifications));
        
        // Update state
        setNotifications(notifications.map(n => 
          n.id === notificationId ? { ...n, readBy: updatedReadBy } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('pos_notifications') || '[]');
      const updatedNotifications = allNotifications.filter(n => n.id !== notificationId);
      localStorage.setItem('pos_notifications', JSON.stringify(updatedNotifications));
      
      // Update state
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast.success('Notification deleted successfully!');
    } catch (error) {
      toast.error('Error deleting notification: ' + error.message);
    }
  };

  if (!isOpen) return null;

  return (
        <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t('notifications')}
              {unreadCount > 0 && (
                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                  {unreadCount}
                </span>
              )}
            </h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{t('create')}</span>
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('received')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'received'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('received')} ({receivedNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab('sent')}
              className={`flex-1 py-3 px-4 text-sm font-medium ${
                activeTab === 'sent'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {t('sent')} ({sentNotifications.length})
            </button>
          </nav>
        </div>

        {/* Notifications List */}
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-500 dark:text-gray-400">Loading notifications...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {(activeTab === 'received' ? receivedNotifications : sentNotifications).map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  currentUserId={currentUser.uid}
                  onMarkAsRead={markAsRead}
                  onDelete={deleteNotification}
                  isReceived={activeTab === 'received'}
                />
              ))}
              {(activeTab === 'received' ? receivedNotifications : sentNotifications).length === 0 && (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    {activeTab === 'received' ? 'No notifications received' : 'No notifications sent'}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Notification Form */}
        {showCreateForm && (
          <CreateNotificationForm
            onClose={() => setShowCreateForm(false)}
            currentUser={currentUser}
            isAdmin={isAdmin()}
          />
        )}
      </div>
    </div>
  );
};

const NotificationItem = ({ notification, currentUserId, onMarkAsRead, onDelete, isReceived }) => {
  const isRead = notification.readBy?.includes(currentUserId);
  const { t } = useTranslation();

  const handleClick = () => {
    if (isReceived && !isRead) {
      onMarkAsRead(notification.id);
    }
  };

  const getRecipientText = () => {
    switch (notification.recipientType) {
      case 'all':
        return 'All Users';
      case 'role':
        return `All ${notification.recipientRole}s`;
      case 'specific':
        return notification.recipientEmail || 'Specific User';
      default:
        return 'Unknown';
    }
  };

  return (
    <div
      className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer ${
        isReceived && !isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''
      }`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            {isReceived && !isRead && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {notification.title}
            </p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {format(new Date(notification.createdAt), 'MMM dd, HH:mm')}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {notification.message}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
            <span>
              {isReceived ? `From: ${notification.senderEmail}` : `To: ${getRecipientText()}`}
            </span>
            {notification.priority && (
              <span className={`px-2 py-1 rounded-full ${
                notification.priority === 'high' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
              }`}>
                {notification.priority}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2 ml-4">
          {!isReceived && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification.id);
              }}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateNotificationForm = ({ onClose, currentUser, isAdmin }) => {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    recipientType: 'all',
    recipientRole: 'cashier',
    recipientEmail: '',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const notificationData = {
        ...formData,
        senderId: currentUser.uid,
        senderEmail: currentUser.email,
        createdAt: new Date().toISOString(),
        readBy: []
      };

      // Add recipientId for specific user notifications
      if (formData.recipientType === 'specific') {
        // In a real app, you'd look up the user by email
        // For now, we'll just store the email
        notificationData.recipientEmail = formData.recipientEmail;
      }

      const allNotifications = JSON.parse(localStorage.getItem('pos_notifications') || '[]');
      const newNotification = { ...notificationData, id: generateId() };
      allNotifications.push(newNotification);
      localStorage.setItem('pos_notifications', JSON.stringify(allNotifications));
      toast.success('Notification sent successfully!');
      onClose();
    } catch (error) {
      toast.error('Error sending notification: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('createNotification')}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('title')} *</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Notification title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('message')} *</label>
            <textarea
              name="message"
              required
              value={formData.message}
              onChange={handleChange}
              rows={3}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Notification message"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('recipient')}</label>
            <select
              name="recipientType"
              value={formData.recipientType}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">{t('allUsers')}</option>
              {isAdmin && <option value="role">{t('byRole')}</option>}
              <option value="specific">{t('specificUser')}</option>
            </select>
          </div>

          {formData.recipientType === 'role' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('role')}</label>
              <select
                name="recipientRole"
                value={formData.recipientRole}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="admin">{t('admin')}</option>
                <option value="cashier">{t('cashier')}</option>
              </select>
            </div>
          )}

          {formData.recipientType === 'specific' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('userEmail')}</label>
              <input
                type="email"
                name="recipientEmail"
                value={formData.recipientEmail}
                onChange={handleChange}
                className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="user@example.com"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{t('priority')}</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="low">{t('low')}</option>
              <option value="medium">{t('medium')}</option>
              <option value="high">{t('high')}</option>
            </select>
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
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>{t('send')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NotificationCenter;