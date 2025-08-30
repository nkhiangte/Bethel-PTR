// Fix: Use v8 compat imports
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';


// --- IMPORTANT ---
// Replace these placeholder values with your actual Firebase project configuration.
// You can find this in your Firebase project settings under "General".
// Fix: Removed FirebaseOptions type as it's not available in v8 compat import
const firebaseConfig = {
    apiKey: "AIzaSyBdPDqRalMokPNW4PZE3B-qzed3X4TInmg",
  authDomain: "bethelptr-fe005.firebaseapp.com",
  projectId: "bethelptr-fe005",
  storageBucket: "bethelptr-fe005.firebasestorage.app",
  messagingSenderId: "722150591508",
  appId: "1:722150591508:web:4aae38297b594b85002b01",
  measurementId: "G-TYN448Q2WT"
};
// --- END OF CONFIGURATION ---

if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('YOUR_')) {
    const errorMsg = "Firebase is not configured. Please add your project credentials to firebase.ts";
    // Display a prominent error on the page itself to guide the user.
    document.body.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #b91c1c; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                  <h1 style="font-size: 1.5rem; font-weight: bold;">Configuration Error</h1>
                                  <p style="margin-top: 0.5rem;">${errorMsg}</p>
                                </div>`;
    throw new Error(errorMsg);
}

// Initialize Firebase
// Fix: Use v8 compat initialization
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Export the initialized services for use throughout the app
// Fix: Use v8 compat service getters
export const auth = firebase.auth();
export const db = firebase.firestore();
