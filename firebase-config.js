// firebase-config.js
// SECURITY: API Key is safe to expose in client apps (Firebase keys are not secrets)
// BUT: Restrict API key permissions in Firebase Console:
// 1. Go to Firebase Console → Project Settings → API Keys
// 2. Edit your API key and set these restrictions:
//    - API restrictions: Only enable "Cloud Firestore API", "Firebase Auth", "Firebase Storage"
//    - Application restrictions: HTTP referrer + your domain only
// 3. Disable admin capabilities on this key

// ============================================
// ENVIRONMENT VARIABLE SUPPORT
// ============================================
// This config supports loading from environment in two ways:
// 1. Browser: window.FIREBASE_CONFIG (set before this script loads)
// 2. Build tools (if using Vite/etc): via .env file

let firebaseConfig;

// Try to load from window global first (browser environments)
if (typeof window !== 'undefined' && window.FIREBASE_CONFIG) {
    firebaseConfig = window.FIREBASE_CONFIG;
} else {
    // Default configuration (MUST be updated after rotating API key in Firebase Console)
    firebaseConfig = {
        apiKey: "AIzaSyAxjoyWIO6Cd4iyh73IGJ7FE01gaf58GfU",
        authDomain: "comms-monitoring.firebaseapp.com",
        databaseURL: "https://comms-monitoring-default-rtdb.firebaseio.com",
        projectId: "comms-monitoring",
        storageBucket: "comms-monitoring.firebasestorage.app",
        messagingSenderId: "178413618862",
        appId: "1:178413618862:web:291d6f4bdba871a058cf3f",
        measurementId: "G-DXEDZGT3GW"
    };
}

// Validate config - check if any required fields are missing or empty
if (!firebaseConfig.apiKey || 
    !firebaseConfig.authDomain || 
    !firebaseConfig.projectId || 
    !firebaseConfig.databaseURL) {
    console.error('Firebase configuration missing! Please set up your Firebase project.');
    console.error('Please check that all required fields are properly configured.');
} else {
    console.log('Firebase configuration loaded successfully');
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { firebaseConfig };
}