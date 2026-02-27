// ===== FIREBASE CONFIG — TEMPLATE =====
// Copy this file to firebase-config.js and fill in your Firebase project values.
// firebase-config.js is git-ignored to keep your config private.
const firebaseConfig = {
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.firebasestorage.app",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};

// Admin panel password — store as SHA-256 hash, NOT plain text!
// Generate with: echo -n "yourpassword" | shasum -a 256
const ADMIN_PASSWORD_HASH = "YOUR_SHA256_HASH_HERE";
