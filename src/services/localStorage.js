// Local Storage Service for data persistence

const LOCAL_STORAGE_KEYS = {
  USERS: 'pos_users',
  PRODUCTS: 'pos_products',
  BILLS: 'pos_bills',
  CUSTOMERS: 'pos_customers',
  INVENTORY: 'pos_inventory',
  RETURNS: 'pos_returns',
  GRN: 'pos_grn',
  SETTINGS: 'pos_settings'
};

// Helper function to get data with default value
const getStorageItem = (key, defaultValue = []) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage: ${key}`, error);
    return defaultValue;
  }
};

// Helper function to set data
const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Error writing to localStorage: ${key}`, error);
    return false;
  }
};

// Users
export const getUsers = () => getStorageItem(LOCAL_STORAGE_KEYS.USERS);
export const saveUsers = (users) => setStorageItem(LOCAL_STORAGE_KEYS.USERS, users);

// Products
export const getProducts = () => getStorageItem(LOCAL_STORAGE_KEYS.PRODUCTS);
export const saveProducts = (products) => setStorageItem(LOCAL_STORAGE_KEYS.PRODUCTS, products);

// Bills
export const getBills = () => getStorageItem(LOCAL_STORAGE_KEYS.BILLS);
export const saveBills = (bills) => setStorageItem(LOCAL_STORAGE_KEYS.BILLS, bills);

// Customers
export const getCustomers = () => getStorageItem(LOCAL_STORAGE_KEYS.CUSTOMERS);
export const saveCustomers = (customers) => setStorageItem(LOCAL_STORAGE_KEYS.CUSTOMERS, customers);



// Inventory
export const getInventory = () => getStorageItem(LOCAL_STORAGE_KEYS.INVENTORY);
export const saveInventory = (inventory) => setStorageItem(LOCAL_STORAGE_KEYS.INVENTORY, inventory);

// Returns
export const getReturns = () => getStorageItem(LOCAL_STORAGE_KEYS.RETURNS);
export const saveReturns = (returns) => setStorageItem(LOCAL_STORAGE_KEYS.RETURNS, returns);

// GRN (Goods Received Notes)
export const getGRN = () => getStorageItem(LOCAL_STORAGE_KEYS.GRN);
export const saveGRN = (grn) => setStorageItem(LOCAL_STORAGE_KEYS.GRN, grn);

// Settings
export const getSettings = () => getStorageItem(LOCAL_STORAGE_KEYS.SETTINGS, {
  language: 'en',
  theme: 'light',
  currency: 'LKR',
  dateFormat: 'MM/dd/yyyy'
});
export const saveSettings = (settings) => setStorageItem(LOCAL_STORAGE_KEYS.SETTINGS, settings);

// Search functionality
export const searchItems = (collection, searchTerm, fields = ['name', 'description']) => {
  const items = getStorageItem(LOCAL_STORAGE_KEYS[collection.toUpperCase()], []);
  if (!searchTerm) return items;
  
  const lowerSearchTerm = searchTerm.toLowerCase();
  return items.filter(item => 
    fields.some(field => 
      item[field] && item[field].toString().toLowerCase().includes(lowerSearchTerm)
    )
  );
};

// Generate unique IDs
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};
