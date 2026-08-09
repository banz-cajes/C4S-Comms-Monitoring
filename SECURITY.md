# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x     | ✅                 |
| 1.x     | ❌                 |

## Reporting a Vulnerability

Please report security vulnerabilities to:
- Email: security@c4systems.ph
- GitHub: Create a security advisory

## Security Features

- ✅ Role-Based Access Control (RBAC)
- ✅ Firebase Authentication
- ✅ Firestore Security Rules
- ✅ XSS Protection
- ✅ Input Sanitization
- ✅ Session Management (30-minute timeout)
- ✅ HTTPS Only

## Recommended Security Practices

1. Keep Firebase config secure
2. Use environment variables
3. Regularly update dependencies
4. Monitor Firebase Console for suspicious activity
5. Enable 2FA for admin accounts

---

## 🔴 CRITICAL: API Key Rotation Required

**Your Firebase API key was exposed in the repository. You must rotate it immediately.**

### Why This Matters
- Firebase API keys are visible in client-side code (this is normal)
- However, they are still secrets that should not be in version control
- Anyone with the key can attempt unauthorized access to your Firestore database
- Firestore Security Rules prevent unauthorized operations, but they're a second layer of defense

### Immediate Action Required

#### Step 1: Rotate API Key in Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Project: **comms-monitoring** → **Settings** (gear) → **API Keys**
3. Find and **Delete** the exposed key: `AIzaSyAxjoyWIO6Cd4iyh73IGJ7FE01gaf58GfU`
4. Click **Create new key** → copy the new one

#### Step 2: Apply Strict API Restrictions
For the **new** API key, edit and set:
- **API Restrictions**: Enable ONLY:
  - ✅ Cloud Firestore API
  - ✅ Firebase Authentication API
  - ✅ Cloud Storage API
  - ❌ Disable all others
- **Application Restrictions**: Set to **HTTP referrer** with your domain

#### Step 3: Update .env Configuration
1. Create/update `.env` (not `.env.example`):
   ```bash
   VITE_FIREBASE_API_KEY=YOUR_NEW_API_KEY_HERE
   VITE_FIREBASE_AUTH_DOMAIN=comms-monitoring.firebaseapp.com
   VITE_FIREBASE_DATABASE_URL=https://comms-monitoring-default-rtdb.firebaseio.com
   VITE_FIREBASE_PROJECT_ID=comms-monitoring
   VITE_FIREBASE_STORAGE_BUCKET=comms-monitoring.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=178413618862
   VITE_FIREBASE_APP_ID=1:178413618862:web:291d6f4bdba871a058cf3f
   VITE_FIREBASE_MEASUREMENT_ID=G-DXEDZGT3GW
   ```
2. **Verify `.env` is in .gitignore** ✓ (already configured)

#### Step 4: Deploy Updated Firestore Rules
```bash
firebase deploy --only firestore:rules
```

New rules enforce:
- ✅ Authentication required (API key alone insufficient)
- ✅ Users can only read own communications
- ✅ Admins only can delete/modify unauthorized data
- ✅ Metadata collection restricted to admins

---

## Environment Variable Support

The app now supports reading Firebase config from environment variables in **browser environments**:

### Option 1: External config.json (Recommended for Browser)

1. **Create config.json** (copy from `config.json.example`):
   ```json
   {
     "apiKey": "YOUR_NEW_API_KEY_HERE",
     "authDomain": "comms-monitoring.firebaseapp.com",
     "databaseURL": "https://comms-monitoring-default-rtdb.firebaseio.com",
     "projectId": "comms-monitoring",
     "storageBucket": "comms-monitoring.firebasestorage.app",
     "messagingSenderId": "178413618862",
     "appId": "1:178213618862:web:291d6f4bdba871a058cf3f",
     "measurementId": "G-DXEDZGT3GW"
   }
   ```

2. **Enable in index.html** (currently commented out):
   ```html
   <script src="config-loader.js"></script>
   <script>loadConfigFromJSON('config.json');</script>
   <script src="firebase-config.js"></script>
   ```

3. **config.json is in .gitignore** ✓ (won't be committed)

### Option 2: .env File (For Build Tools like Vite)

If you're using a build tool (Vite, webpack, etc.):

1. Create `.env` file:
   ```bash
   VITE_FIREBASE_API_KEY=YOUR_NEW_API_KEY_HERE
   VITE_FIREBASE_AUTH_DOMAIN=comms-monitoring.firebaseapp.com
   ...
   ```

2. Update `firebase-config.js` to use `import.meta.env` (requires build tool)

### Option 3: JavaScript Global (For Testing)

Quickly test with a new API key:

```javascript
// In browser console before app loads:
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_NEW_API_KEY_HERE",
  authDomain: "comms-monitoring.firebaseapp.com",
  // ... rest of config
};
```

**Before** (hardcoded - INSECURE):
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyAxjoyWIO6Cd4iyh73IGJ7FE01gaf58GfU",  // ❌ Exposed
    ...
};
```

**After** (from config.json or window global - SECURE):
```javascript
let firebaseConfig;
if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
    firebaseConfig = window.FIREBASE_CONFIG;  // ✅ Loaded from safe source
} else {
    firebaseConfig = { /* defaults */ };
}
```

---

## 📋 Security Checklist

- [ ] Rotated Firebase API key
- [ ] Applied API restrictions (Firestore + Auth only)
- [ ] Applied HTTP referrer restrictions
- [ ] Created `.env` file with new key
- [ ] Deployed Firestore rules: `firebase deploy --only firestore:rules`
- [ ] Tested login and data access
- [ ] Verified old key is deleted
- [ ] Updated team with new `.env.example`
- [ ] Enabled Firebase audit logging in Console
- [ ] Reviewed recent Firestore access logs for suspicious activity

---

## If Compromised

1. Delete the API key immediately in Firebase Console
2. Create and deploy a new key
3. Check Firestore audit logs for unauthorized access
4. Verify no data was modified
5. Notify your team

---

## Additional Security Hardening (Optional)

### Enable Firebase App Check
Adds app authenticity verification:
```bash
npm install @firebase/app-check
# Then configure in firebase-init.js with reCAPTCHA v3
```

### Enable Firestore Audit Logging
- Console → Firestore → Backups → Enable Data Protection
- Set up Cloud Logging for request tracking

### Rotate Keys Regularly
- Every 3-6 months (or after incidents)
- After team member departures
- When suspecting compromise