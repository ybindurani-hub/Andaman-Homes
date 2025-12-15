
import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import AddProperty from './pages/AddProperty';
import PropertyDetails from './pages/PropertyDetails';
import PaymentPage from './pages/PaymentPage';
import ChatList from './pages/ChatList';
import ChatScreen from './pages/ChatScreen';
import MyAds from './pages/MyAds';
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';
import { BannerAd } from './components/AdSpaces';
import { Loader2 } from 'lucide-react';

// --- HELPER: Ensure Firestore User Exists ---
// Handles both Phone users (no email/photo usually) and Google users (email/photo available)
export const ensureUserRecord = async (user: firebase.User, additionalData = {}) => {
  if (!user) return;
  const userRef = db.collection('users').doc(user.uid);
  try {
    const doc = await userRef.get();
    if (!doc.exists) {
      await userRef.set({
        uid: user.uid,
        email: user.email || null,
        phoneNumber: user.phoneNumber || null,
        displayName: user.displayName || 'User',
        photoURL: user.photoURL || null,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        freeAdsUsed: 0,
        adsPosted: 0,
        ...additionalData
      });
      console.log("User record created.");
    }
  } catch (error) {
    console.error("Error creating user record:", error);
  }
};

// --- COMPONENT: Scroll To Top ---
const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

// --- COMPONENT: Protected Route (Redirects to Login if NOT authenticated) ---
const ProtectedRoute = ({ children, user, loading }: React.PropsWithChildren<{ user: firebase.User | null, loading: boolean }>) => {
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

// --- COMPONENT: Public Route (Redirects to Home if authenticated) ---
const PublicRoute = ({ children, user, loading }: React.PropsWithChildren<{ user: firebase.User | null, loading: boolean }>) => {
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    if (user) return <Navigate to="/" replace />;
    return <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Handle Redirect Result (Critical for Mobile WebView Google Login)
    auth.getRedirectResult().then(async (result) => {
        if (result.user) {
            console.log("Redirect login successful");
            await ensureUserRecord(result.user);
            // No need to manually navigate; onAuthStateChanged will trigger and update state
        }
    }).catch((error) => {
        // Suppress common environment errors in non-supported browsers
        const isEnvError = 
            error.code === 'auth/operation-not-supported-in-this-environment' || 
            error.message?.includes('operation-not-supported') ||
            error.message?.includes('web storage');

        if (!isEnvError) {
            console.error("Redirect Auth Error:", error);
        }
    });

    // 2. Global Auth Listener
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
         await ensureUserRecord(currentUser); 
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20 md:pb-0">
        <Navbar />
        <BannerAd position="top" />

        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* Public Routes (Only accessible if logged out) */}
          <Route 
            path="/login" 
            element={
              <PublicRoute user={user} loading={loading}>
                <Login />
              </PublicRoute>
            } 
          />

          {/* Protected Routes (Only accessible if logged in) */}
          <Route 
            path="/add-property" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <AddProperty />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/my-ads" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <MyAds />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <PaymentPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chats" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <ChatList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/chat/:chatId" 
            element={
              <ProtectedRoute user={user} loading={loading}>
                <ChatScreen />
              </ProtectedRoute>
            } 
          />

          <Route path="/property/:id" element={<PropertyDetails />} />
        </Routes>

        <BannerAd position="bottom" />
      </div>
    </Router>
  );
};

export default App;
