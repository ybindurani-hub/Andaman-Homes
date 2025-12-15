
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

// Using the provided configuration directly
const firebaseConfig = {
  apiKey: "AIzaSyCrJp2FYJeJ5S4cbynYcqG7q15rWoPxcDE",
  authDomain: "anadaman-homes.firebaseapp.com",
  projectId: "anadaman-homes",
  storageBucket: "anadaman-homes.firebasestorage.app",
  messagingSenderId: "563526116422",
  appId: "1:563526116422:web:5a86518ff0b5b6a1dad647"
};

// Initialize Firebase
// Check for existing apps to prevent re-initialization errors
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

// Export services for use in the app
export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

// Explicitly set persistence to LOCAL
// We catch the error to prevent crashes in environments like 'file://' or strict WebViews
// where 'localStorage' might not be available or supported by Firebase.
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((error) => {
  if (error.code !== 'auth/operation-not-supported-in-this-environment') {
     console.error("Auth Persistence Error:", error);
  }
});

export default app;
