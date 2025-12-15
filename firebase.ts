
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Configuration
// Double check that 'andaman-homes' matches your exact Firebase Project ID.
const firebaseConfig = {
  apiKey: "AIzaSyCrJp2FYJeJ5S4cbynYcqG7q15rWoPxcDE",
  authDomain: "andaman-homes.firebaseapp.com",
  projectId: "andaman-homes",
  storageBucket: "andaman-homes.firebasestorage.app",
  messagingSenderId: "563526116422",
  appId: "1:563526116422:web:5a86518ff0b5b6a1dad647"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export services
export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Default persistence is usually LOCAL, we remove the explicit async call 
// to avoid unhandled promise rejections during app startup.

export default app;
