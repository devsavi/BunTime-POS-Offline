# 🔒 Security Guidelines

## Firebase Security Rules

### Basic Rules (Recommended for Start)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Require authentication for all operations
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Advanced Rules (Production Recommended)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is admin
    function isAdmin() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Users collection - users can read their own data, admins can read/write all
    match /users/{userId} {
      allow read: if isAuthenticated() && (request.auth.uid == userId || isAdmin());
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Products - all authenticated users can read, only admins can write
    match /products/{productId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }
    
    // Bills - users can read/write their own bills, admins can access all
    match /bills/{billId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
    
    // Customers - all authenticated users can read/write
    match /customers/{customerId} {
      allow read, write: if isAuthenticated();
    }
    
    // Suppliers - all authenticated users can read/write
    match /suppliers/{supplierId} {
      allow read, write: if isAuthenticated();
    }
    
    // Returns - all authenticated users can read/write
    match /returns/{returnId} {
      allow read, write: if isAuthenticated();
    }
    
    // GRNs - all authenticated users can read/write
    match /grns/{grnId} {
      allow read, write: if isAuthenticated();
    }
    
    // Notifications - all authenticated users can read/write
    match /notifications/{notificationId} {
      allow read, write: if isAuthenticated();
    }
    
    // Shop settings - all can read, only admins can write
    match /shopSettings/{document} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated() && isAdmin();
    }
  }
}
```

## Environment Variables Security

### Required Variables
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Security Notes
- Never commit `.env` files to version control
- Use different Firebase projects for development/production
- Regularly rotate API keys
- Monitor Firebase usage for unusual activity

## User Management Security

### Admin User Creation
1. Create user in Firebase Authentication
2. Add user document in Firestore with admin role:
```json
{
  "email": "admin@yourstore.com",
  "name": "Admin User",
  "role": "admin",
  "isActive": true,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Password Requirements
- Minimum 8 characters
- Include uppercase, lowercase, numbers
- Avoid common passwords
- Regular password updates

## Data Protection

### Sensitive Data Handling
- Never store payment card details
- Encrypt sensitive customer information
- Regular data backups
- Implement data retention policies

### Access Control
- Role-based permissions (Admin/Cashier)
- Regular access reviews
- Immediate access revocation for terminated users
- Audit logs for sensitive operations

## Network Security

### HTTPS Requirements
- Always use HTTPS in production
- Configure secure headers
- Implement Content Security Policy (CSP)

### Firebase Security
- Enable App Check for production
- Configure authorized domains
- Monitor authentication logs
- Set up billing alerts

## Backup & Recovery

### Data Backup
- Regular Firestore exports
- Store backups in secure location
- Test restore procedures
- Document recovery processes

### Disaster Recovery
- Multiple environment setup
- Backup authentication configuration
- Document all API keys and settings
- Regular disaster recovery testing

## Monitoring & Alerts

### Security Monitoring
- Firebase Authentication logs
- Unusual access patterns
- Failed login attempts
- Data export activities

### Alerts Setup
- Failed authentication attempts
- Unusual data access patterns
- High API usage
- Security rule violations

## Compliance Considerations

### Data Privacy
- GDPR compliance (if applicable)
- Customer data consent
- Right to data deletion
- Data processing transparency

### Business Compliance
- PCI DSS (if handling payments)
- Local business regulations
- Tax compliance requirements
- Audit trail maintenance

## Security Checklist

### Pre-Deployment
- [ ] Firebase security rules configured
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] Admin users created properly
- [ ] Test authentication flows
- [ ] Backup procedures tested

### Post-Deployment
- [ ] Monitor authentication logs
- [ ] Regular security reviews
- [ ] Update dependencies
- [ ] Monitor Firebase usage
- [ ] Regular data backups
- [ ] User access audits

### Ongoing Maintenance
- [ ] Monthly security reviews
- [ ] Quarterly access audits
- [ ] Annual penetration testing
- [ ] Regular backup testing
- [ ] Security training for users
- [ ] Incident response procedures

## Incident Response

### Security Incident Steps
1. **Identify**: Detect and assess the incident
2. **Contain**: Limit the scope and impact
3. **Investigate**: Determine cause and extent
4. **Recover**: Restore normal operations
5. **Learn**: Update procedures and training

### Contact Information
- **Security Team**: [security-email]
- **Firebase Support**: Firebase Console
- **Emergency Contact**: [savinduweththasinghe03@gmail.com]

---

**Remember**: Security is an ongoing process, not a one-time setup. Regular reviews and updates are essential for maintaining a secure system.