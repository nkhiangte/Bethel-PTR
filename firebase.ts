import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { getAuth as firebaseGetAuth, Auth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore as firebaseGetFirestore, Firestore } from 'firebase/firestore';

// --- IMPORTANT ---
// Replace these placeholder values with your actual Firebase project configuration.
// You can find this in your Firebase project settings under "General".
const firebaseConfig: FirebaseOptions = {
    apiKey: "AIzaSyBdPDqRalMokPNW4PZE3B-qzed3X4TInmg",
  authDomain: "bethelptr-fe005.firebaseapp.com",
  projectId: "bethelptr-fe005",
  storageBucket: "bethelptr-fe005.firebasestorage.app",
  messagingSenderId: "722150591508",
  appId: "1:722150591508:web:4aae38297b594b85002b01",
  measurementId: "G-TYN448Q2WT"
};
// --- END OF CONFIGURATION ---

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let googleProvider: GoogleAuthProvider;

// Initialize Firebase as soon as this module is imported
if (!getApps().length) {
    if (firebaseConfig.apiKey && firebaseConfig.apiKey.startsWith('YOUR_')) {
        const errorMsg = "Firebase is not configured. Please add your project credentials to firebase.ts";
        // Display a prominent error on the page itself to guide the user.
        document.body.innerHTML = `<div style="font-family: sans-serif; padding: 2rem; text-align: center; background-color: #fef2f2; color: #b91c1c; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                                      <h1 style="font-size: 1.5rem; font-weight: bold;">Configuration Error</h1>
                                      <p style="margin-top: 0.5rem;">${errorMsg}</p>
                                    </div>`;
        throw new Error(errorMsg);
    }
    app = initializeApp(firebaseConfig);
} else {
    app = getApp();
}

auth = firebaseGetAuth(app);
db = firebaseGetFirestore(app);
googleProvider = new GoogleAuthProvider();

export const getFirebaseAuth = (): Auth => {
    if (!auth) throw new Error("Firebase Auth has not been initialized.");
    return auth;
}

export const getFirebaseDb = (): Firestore => {
    if (!db) throw new Error("Firestore has not been initialized.");
    return db;
}

export const getGoogleProvider = (): GoogleAuthProvider => {
    if (!googleProvider) throw new Error("Google Auth Provider has not been initialized.");
    return googleProvider;
}
