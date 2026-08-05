// firebase-config.js
const firebaseConfig = {
    apiKey: "AIzaSyAxjoyWIO6Cd4iyh73IGJ7FE01gaf58GfU",
    authDomain: "comms-monitoring.firebaseapp.com",
    databaseURL: "https://comms-monitoring-default-rtdb.firebaseio.com",
    projectId: "comms-monitoring",
    storageBucket: "comms-monitoring.firebasestorage.app",
    messagingSenderId: "178413618862",
    appId: "1:178413618862:web:291d6f4bdba871a058cf3f",
    measurementId: "G-DXEDZGT3GW"
};

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