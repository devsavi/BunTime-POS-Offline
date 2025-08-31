import React, { useState } from 'react';
import { useShop } from '../../contexts/ShopContext';
import { useTranslation } from 'react-i18next';
import { Store, Settings as SettingsIcon, Save, CheckCircle, Upload, X, Image } from 'lucide-react';

const Settings = () => {
  const { shopSettings, updateShopSettings } = useShop();
  const { t } = useTranslation();
  
  // Initialize formData with default values to prevent uncontrolled-to-controlled warning
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    registrationNo: '',
    currency: 'LKR',
    receiptFooter: 'Thank you for shopping with us!',
    navLogoBase64: null,
    invoiceLogoBase64: null,
    ...shopSettings // Override with actual values if available
  });
  const [activeTab, setActiveTab] = useState('business');
  const [saving, setSaving] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  
  // Image handling states
  const [navLogoFile, setNavLogoFile] = useState(null);
  const [invoiceLogoFile, setInvoiceLogoFile] = useState(null);
  const [navLogoPreview, setNavLogoPreview] = useState(null);
  const [invoiceLogoPreview, setInvoiceLogoPreview] = useState(null);
  const [tempNavLogoBase64, setTempNavLogoBase64] = useState(null);
  const [tempInvoiceLogoBase64, setTempInvoiceLogoBase64] = useState(null);

  // Update formData when shopSettings changes
  React.useEffect(() => {
    setFormData(prevFormData => ({
      ...prevFormData,
      ...shopSettings
    }));
  }, [shopSettings]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Include Base64 images in the form data
      const updatedFormData = {
        ...formData,
        navLogoBase64: tempNavLogoBase64 !== null ? tempNavLogoBase64 : formData.navLogoBase64,
        invoiceLogoBase64: tempInvoiceLogoBase64 !== null ? tempInvoiceLogoBase64 : formData.invoiceLogoBase64
      };
      
      await updateShopSettings(updatedFormData);
      
      // Reset temporary states after successful save
      setTempNavLogoBase64(null);
      setTempInvoiceLogoBase64(null);
      setNavLogoFile(null);
      setInvoiceLogoFile(null);
      setNavLogoPreview(null);
      setInvoiceLogoPreview(null);
      
      setShowConfirmation(true);
      // Hide confirmation after 3 seconds
      setTimeout(() => setShowConfirmation(false), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };



  // Image handling functions
  const handleImageUpload = (file, type) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64String = e.target.result;
      
      if (type === 'nav') {
        setNavLogoFile(file);
        setNavLogoPreview(base64String);
        setTempNavLogoBase64(base64String);
      } else if (type === 'invoice') {
        setInvoiceLogoFile(file);
        setInvoiceLogoPreview(base64String);
        setTempInvoiceLogoBase64(base64String);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (type) => {
    if (type === 'nav') {
      setNavLogoFile(null);
      setNavLogoPreview(null);
      setTempNavLogoBase64(null);
      setFormData({ ...formData, navLogoBase64: null });
    } else if (type === 'invoice') {
      setInvoiceLogoFile(null);
      setInvoiceLogoPreview(null);
      setTempInvoiceLogoBase64(null);
      setFormData({ ...formData, invoiceLogoBase64: null });
    }
  };

  const tabs = [
    { id: 'business', name: 'Business Settings', icon: Store },
    { id: 'system', name: 'System Settings', icon: SettingsIcon }
  ];



  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('settings')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Configure your business and system preferences</p>
      </div>

      {/* Success Confirmation */}
      {showConfirmation && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex items-center space-x-3">
          <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Settings Saved Successfully!</h3>
            <p className="text-sm text-green-700 dark:text-green-300">Your business settings have been updated and saved.</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
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

      {/* Business Settings Tab */}
      {activeTab === 'business' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">


            {/* Logo Upload Section */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Logo Settings</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Navigation Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Navigation Bar Logo
                  </label>
                  <div className="space-y-3">
                    {/* Current/Preview Image */}
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                      {navLogoPreview || formData.navLogoBase64 ? (
                        <img
                          src={navLogoPreview || formData.navLogoBase64}
                          alt="Navigation Logo"
                          className="max-h-28 max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No logo uploaded</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'nav')}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Upload className="w-4 h-4" />
                          <span>Upload Logo</span>
                        </div>
                      </label>
                      
                      {(navLogoPreview || formData.navLogoBase64) && (
                        <button
                          type="button"
                          onClick={() => removeImage('nav')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 200x50px, max 2MB. Supports PNG, JPG, GIF.
                    </p>
                  </div>
                </div>

                {/* Invoice Logo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Invoice/Receipt Logo
                  </label>
                  <div className="space-y-3">
                    {/* Current/Preview Image */}
                    <div className="w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-700">
                      {invoiceLogoPreview || formData.invoiceLogoBase64 ? (
                        <img
                          src={invoiceLogoPreview || formData.invoiceLogoBase64}
                          alt="Invoice Logo"
                          className="max-h-28 max-w-full object-contain"
                        />
                      ) : (
                        <div className="text-center">
                          <Image className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">No logo uploaded</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Button */}
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e.target.files[0], 'invoice')}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                          <Upload className="w-4 h-4" />
                          <span>Upload Logo</span>
                        </div>
                      </label>
                      
                      {(invoiceLogoPreview || formData.invoiceLogoBase64) && (
                        <button
                          type="button"
                          onClick={() => removeImage('invoice')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Recommended: 300x100px, max 2MB. Supports PNG, JPG, GIF.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shop Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter your business name"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Branch Name
                </label>
                <input
                  type="text"
                  name="branch"
                  value={formData.branch || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter branch name (if applicable)"
                />
              </div>


              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Shop Description
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter a brief description of your shop"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Address
                </label>
                <textarea
                  name="address"
                  value={formData.address || ''}
                  onChange={handleChange}
                  rows="2"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter shop address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Phone Number
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter phone number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Registration Number
                </label>
                <input
                  type="text"
                  name="registrationNo"
                  value={formData.registrationNo || ''}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter business registration number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Currency
                </label>
                <select
                  name="currency"
                  value={formData.currency || 'LKR'}
                  onChange={handleChange}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                >
                  <option value="LKR">Sri Lankan Rupee (LKR)</option>
                  <option value="USD">US Dollar (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                  <option value="GBP">British Pound (GBP)</option>
                  <option value="INR">Indian Rupee (INR)</option>
                  <option value="AUD">Australian Dollar (AUD)</option>
                  <option value="CAD">Canadian Dollar (CAD)</option>
                  <option value="JPY">Japanese Yen (JPY)</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Receipt Footer Message
                </label>
                <textarea
                  name="receiptFooter"
                  value={formData.receiptFooter || ''}
                  onChange={handleChange}
                  rows="2"
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  placeholder="Enter a message to display at the bottom of receipts (e.g., Thank you for shopping with us!)"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-md text-sm"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{saving ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'system' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">System Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Version:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">1.0.0</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Last Updated:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Storage:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Local Storage</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Authentication:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">Local Auth</span>
                </div>
              </div>
            </div>



            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Global Business Settings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Business Name:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">{shopSettings.name}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Email:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">{shopSettings.email || 'Not set'}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Currency:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">{shopSettings.currency}</span>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <span className="font-medium text-gray-900 dark:text-white">Registration No:</span> 
                  <span className="text-gray-700 dark:text-gray-300 ml-2">{shopSettings.registrationNo || 'Not set'}</span>
                </div>
              </div>

            </div>

            {/* Logo Status */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Logo Status</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Navigation Logo:</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      shopSettings.navLogoBase64 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}>
                      {shopSettings.navLogoBase64 ? 'Uploaded' : 'Not Set'}
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Invoice Logo:</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${
                      shopSettings.invoiceLogoBase64 
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                        : 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
                    }`}>
                      {shopSettings.invoiceLogoBase64 ? 'Uploaded' : 'Not Set'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;