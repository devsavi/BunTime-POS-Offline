# 🏪 Single Branch POS System - Setup Guide

A comprehensive Point of Sale system with multi-language support, inventory management, billing, returns, and reporting features.

## 📋 Prerequisites

- **Node.js** 18.0 or higher
- **npm** or **yarn** package manager
- Modern web browser
- Basic knowledge of React

## 🚀 Quick Start

### 1. Installation

```bash
# Clone the repository
git clone [your-repository-url]
cd single-branch-pos-system

# Install dependencies
npm install
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp .env.example .env
```

Edit `.env` file with your business configuration:

```env
REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_SUPPORT_EMAIL=support@yourcompany.com
```

### 3. Run the Application

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:5173`

## 🏗️ Deployment

### Netlify Deployment

1. Build the project:
```bash
npm run build
```

2. Create `public/_redirects` file (already included):
```
/*    /index.html   200
```

3. Deploy to Netlify:
   - Drag and drop the `dist` folder to Netlify
   - Or connect your Git repository for automatic deployments

4. Add environment variables in Netlify:
   - Go to Site settings > Environment variables
   - Add all your `VITE_` prefixed variables

### Vercel Deployment

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Add environment variables in Vercel dashboard

## 🎯 Features

### Core Features
- ✅ Multi-language support (English, Sinhala, Tamil)
- ✅ User authentication and role management
- ✅ Inventory management with barcode support
- ✅ Point of sale billing system
- ✅ Customer management
- ✅ Supplier management
- ✅ Returns management with approval workflow
- ✅ Comprehensive reporting and analytics
- ✅ Dark/Light theme support
- ✅ Responsive design for all devices

### Business Types Supported
- 🛒 Grocery Store
- 💊 Pharmacy
- 🔧 Hardware Store
- 🍽️ Restaurant
- 🏪 Retail Store

### Advanced Features
- 📊 Sales analytics
- 📱 Mobile-responsive design
- 🖨️ Receipt printing
- 📈 Business reports
- 🔔 Notification system
- 💾 Data export (Excel, CSV, PDF)
- � Business type configurations

## 🛠️ Configuration

### Business Settings
1. Login as admin
2. Go to Settings > Business Settings
3. Configure:
   - Business name and contact information
   - Currency settings
   - Business type (affects available features)
   - Upload logos for navigation and invoices

### User Management
- Admins can manage all aspects of the system
- Cashiers have limited access (no settings, limited reports)
- Create users through the admin interface

## 📱 Usage

### For Cashiers
1. **Login** with provided credentials
2. **Billing**: Add products to cart, process payments
3. **Inventory**: View products (read-only)
4. **Returns**: Submit return requests
5. **Reports**: View basic sales data

### For Admins
1. **All cashier features** plus:
2. **Inventory Management**: Add/edit/delete products
3. **User Management**: Create and manage staff accounts
4. **Returns Approval**: Review and approve/reject returns
5. **Advanced Reports**: Access all analytics and reports
6. **Settings**: Configure shop settings and preferences

## 🔧 Troubleshooting

### Common Issues

**Build fails:**
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npm run build`

**Deployment issues:**
- Ensure `_redirects` file exists in `public` folder
- Add environment variables to hosting platform
- Check build output in `dist` folder

### Getting Help

1. Check browser console for error messages
2. Ensure all dependencies are installed
3. Check network connectivity
4. Review the troubleshooting guide

## 📄 License

This software is licensed for commercial use. See LICENSE file for details.

## 🤝 Support

For technical support and customization requests, contact: [savinduweththasinghe03@gmail.com]

---

**Note**: This system is designed for small to medium businesses needing a reliable, feature-rich POS solution.