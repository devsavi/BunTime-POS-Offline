# 🚀 Deployment Guide

This guide covers deploying your POS System to various hosting platforms.

## 📦 Build Preparation

### 1. Environment Variables

Create `.env` file from `.env.example`:

```env
REACT_APP_COMPANY_NAME=Your Company Name
REACT_APP_SUPPORT_EMAIL=support@yourcompany.com
```

### 2. Build the Project

```bash
npm run build
```

This creates a `dist` folder with optimized production files.

## 🌐 Netlify Deployment

### Method 1: Drag & Drop

1. Build your project: `npm run build`
2. Go to [Netlify](https://netlify.com)
3. Drag the `dist` folder to the deployment area
4. Your site is live!

### Method 2: Git Integration

1. Push your code to GitHub/GitLab
2. Connect repository to Netlify
3. Set build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in Site Settings > Environment Variables

### Environment Variables Setup

In Netlify dashboard:
1. Go to **Site settings** > **Environment variables**
2. Add each `VITE_` prefixed variable
3. Redeploy the site

## ▲ Vercel Deployment

### Method 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Method 2: Git Integration

1. Connect your repository to Vercel
2. Import project
3. Configure:
   - **Framework**: Vite
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
4. Add environment variables

## 🔥 Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize hosting
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

## 🌊 DigitalOcean App Platform

1. Connect your repository
2. Configure app:
   - **Source**: Your repository
   - **Branch**: main
   - **Build command**: `npm run build`
   - **Output directory**: `dist`
3. Add environment variables
4. Deploy

## 📋 Post-Deployment Checklist

### 1. Test Core Functionality
- [ ] User authentication works
- [ ] Database connections are successful
- [ ] All pages load correctly
- [ ] Mobile responsiveness
- [ ] Print functionality

### 2. Performance Optimization
- [ ] Enable gzip compression
- [ ] Set up CDN (if needed)
- [ ] Configure caching headers
- [ ] Monitor loading times

### 4. Security
- [ ] HTTPS is enabled
- [ ] Environment variables are secure
- [ ] No sensitive data in client-side code
- [ ] Firestore rules are properly configured

## 🔧 Troubleshooting

### Common Deployment Issues

**Build Fails:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Environment Variables Not Working:**
- Ensure variables start with `VITE_`
- Restart build process after adding variables
- Check hosting platform's environment variable syntax

**Routing Issues (404 on refresh):**
- Ensure `_redirects` file exists in `public` folder
- For other platforms, configure SPA redirects

**Connection Issues:**
- Verify all environment variables are correct
- Check browser network connectivity
- Review system logs

### Platform-Specific Issues

**Netlify:**
- Functions timeout: Increase timeout in `netlify.toml`
- Large builds: Enable large media or split bundles

**Vercel:**
- Serverless function limits: Optimize bundle size
- Build timeouts: Reduce dependencies

**Firebase Hosting:**
- Quota limits: Monitor usage in Firebase console
- Custom domain: Configure DNS properly

## 📊 Monitoring & Analytics

### 1. Set Up Monitoring
- Error tracking (Sentry, LogRocket)
- Performance monitoring

### 2. Regular Maintenance
- Update dependencies regularly
- Review security settings
- Monitor application logs

##  Support

For deployment assistance or custom configuration:
- Email: [savinduweththasinghe03@gmail.com]