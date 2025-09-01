// Firebase configuration and initialization
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getApp } from "firebase/app"

const firebaseConfig = {
  apiKey: "AIzaSyBEC8Hi7R6xnz-4ukwiaJaFX80mL1sT9gY",
  authDomain: "myproject-91883.firebaseapp.com",
  projectId: "myproject-91883",
  storageBucket: "myproject-91883.firebasestorage.app",
  messagingSenderId: "985129922396",
  appId: "1:985129922396:web:4a4515a4d9ebe7d3b5db99",
  measurementId: "G-R35CDWP897"
};


// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app)

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app)

// Helper function to get app instance
export const getFirebaseApp = () => getApp()

export default app
