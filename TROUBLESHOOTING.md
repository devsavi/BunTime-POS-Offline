# Troubleshooting Guide - POS System

## Common Issues and Solutions

### 1. Data Loading Issues

**Symptoms:**
- Data not appearing in views
- Empty lists or tables

**Solutions:**

1. Check Local Storage:
   - Open browser dev tools (F12)
   - Go to Application tab
   - Check Local Storage entries
   - Clear and refresh if needed: `localStorage.clear()`

2. Verify Data Structure:
```javascript
// Local Storage Structure
{
  pos_users: [...],
  pos_products: [...],
  pos_bills: [...],
  pos_customers: [...],
  pos_inventory: [...],
  pos_returns: [...],
  pos_grn: [...],
  pos_settings: {...}
}
```

### 2. User Access Issues

**Solutions:**

1. Check User Document:
```javascript
{
  uid: "user_id",
  email: "user@example.com",
  name: "User Name",
  role: "super_admin",
  isActive: true
}
```

2. Clear Browser Data:
   - Clear cache and cookies
   - Clear localStorage: `localStorage.clear()`
   - Try incognito/private browsing mode

### 3. Inventory Management

**Error:** Products don't appear in inventory

**Solutions:**

1. Check Local Storage:
   - Verify products data exists
   - Check inventory tracking data

2. Refresh Application:
   - Clear localStorage if needed
   - Reload the page

### 4. Settings Issues

**Solutions:**

1. Reset Settings:
```javascript
// Default settings structure
{
  language: 'en',
  theme: 'light',
  currency: 'LKR',
  dateFormat: 'MM/dd/yyyy'
}
```

## Debugging Steps

### 1. Check Browser Console
1. Open Developer Tools (F12)
2. Go to Console tab
3. Look for error messages
4. Check Network tab for failed requests

### 2. Verify Data
1. Check Local Storage data
2. Verify data structure
3. Clear and reset if needed

### 3. Test with Different Browsers
1. Try a different browser
2. Use incognito/private mode
3. Clear browser cache and data

## Prevention Tips

### 1. Regular Data Backup
- Export important data regularly
- Keep backup of settings

### 2. Test Changes First
- Test in development mode
- Verify data integrity
- Check all affected features

### 3. Monitor Console
- Check browser console for errors
- Review error messages
- Keep system updated

## Getting Help

When reporting issues, include:
- Browser console errors
- Local storage data state
- Steps to reproduce the issue
- Screenshots of error messages