import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration, which you have correctly provided.
// It is now exported so other parts of the app can reference it if needed.
export const firebaseConfig = {
  apiKey: "AIzaSyBdPDqRalMokPNW4PZE3B-qzed3X4TInmg",
  authDomain: "bethelptr-fe005.firebaseapp.com",
  projectId: "bethelptr-fe005",
  storageBucket: "bethelptr-fe005.appspot.com",
  messagingSenderId: "722150591508",
  appId: "1:722150591508:web:4aae38297b594b85002b01",
  measurementId: "G-TYN448Q2WT"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize and export the Firebase services the app will use
export const db = getFirestore(app);
export const auth = getAuth(app);
