import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Exporting firebaseConfig so it can be used in api.ts for the placeholder check
export const firebaseConfig = {
 apiKey: "AIzaSyBdPDqRalMokPNW4PZE3B-qzed3X4TInmg",
  authDomain: "bethelptr-fe005.firebaseapp.com",
  projectId: "bethelptr-fe005",
  storageBucket: "bethelptr-fe005.firebasestorage.app",
  messagingSenderId: "722150591508",
  appId: "1:722150591508:web:4aae38297b594b85002b01",
  measurementId: "G-TYN448Q2WT"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
