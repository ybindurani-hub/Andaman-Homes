
import firebase from "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";
import "firebase/compat/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCrJp2FYJeJ5S4cbynYcqG7q15rWoPxcDE",
  authDomain: "anadaman-homes.firebaseapp.com",
  projectId: "anadaman-homes",
  storageBucket: "anadaman-homes.firebasestorage.app",
  messagingSenderId: "563526116422",
  appId: "1:563526116422:web:5a86518ff0b5b6a1dad647"
};

// Initialize Firebase
const app = !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();

export const auth = app.auth();
export const db = app.firestore();
export const storage = app.storage();
export const googleProvider = new firebase.auth.GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Enforce Persistent Auth with Session Fallback
// This fixes "operation-not-supported" in environments where IndexedDB is blocked
const initAuth = async () => {
    try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    } catch (error: any) {
        console.warn("Auth: LOCAL persistence failed, trying SESSION...", error.message);
        try {
            await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
        } catch (e) {
            console.error("Auth: No persistence available.");
        }
    }
};

initAuth();

export default app;
