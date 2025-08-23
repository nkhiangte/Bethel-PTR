import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// --- IMPORTANT ---
// 1. Go to the Firebase Console (https://console.firebase.google.com/)
// 2. Create a new project.
// 3. In your project, go to Project Settings and add a new Web App.
// 4. Firebase will give you a `firebaseConfig` object.
// 5. PASTE that object here to replace the placeholder below.

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBdPDqRalMokPNW4PZE3B-qzed3X4TInmg",
  authDomain: "bethelptr-fe005.firebaseapp.com",
  projectId: "bethelptr-fe005",
  storageBucket: "bethelptr-fe005.firebasestorage.app",
  messagingSenderId: "722150591508",
  appId: "1:722150591508:web:4aae38297b594b85002b01",
  measurementId: "G-TYN448Q2WT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);