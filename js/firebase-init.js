// ============================================
// C4 SYSTEMS - Firebase Initialization
// ============================================

let db, auth;

try {
    if (typeof firebase === 'undefined') {
        throw new Error('Firebase SDK not loaded!');
    }

    // Initialize Firebase
    firebase.initializeApp(firebaseConfig);

    // Initialize Auth
    auth = firebase.auth();

    // Initialize Firestore
    db = firebase.firestore();

    // Detect restrictive proxies and fall back to long-polling when needed.
    // This must be configured before Firestore performs reads or writes.
    db.settings({ experimentalAutoDetectLongPolling: true });

    // Enable persistence
    db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log('✅ Firestore persistence enabled');
        })
        .catch((err) => {
            if (err.code === 'failed-precondition') {
                console.warn('⚠️ Persistence failed: Multiple tabs open');
            } else if (err.code === 'unimplemented') {
                console.warn('⚠️ Persistence not supported in this browser');
            } else {
                console.warn('⚠️ Persistence error:', err);
            }
        });

    // Set auth persistence
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
        .then(() => {
            console.log('✅ Auth persistence set to LOCAL');
        })
        .catch((err) => {
            console.warn('⚠️ Auth persistence error:', err);
        });

    console.log('✅ Firebase initialized successfully');

} catch (error) {
    console.error('❌ Firebase initialization error:', error);
    document.body.innerHTML = `
        <div style="text-align: center; padding: 50px; font-family: monospace;">
            <h2>⚠️ Configuration Error</h2>
            <p>Failed to initialize Firebase: ${error.message}</p>
            <button onclick="location.reload()" style="padding: 10px 20px; margin-top: 20px; cursor: pointer;">Retry</button>
        </div>
    `;
}
