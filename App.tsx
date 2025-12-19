
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddProperty from './pages/AddProperty';
import PropertyDetails from './pages/PropertyDetails';
import PaymentPage from './pages/PaymentPage';
import ChatList from './pages/ChatList';
import ChatScreen from './pages/ChatScreen';
import MyAds from './pages/MyAds';
import { auth, db } from './firebase';
import firebase from 'firebase/compat/app';
import { BannerAd } from './components/AdSpaces';
import { Loader2, MessageCircle, Home as HomeIcon, X } from 'lucide-react';

export const ensureUserRecord = async (user: firebase.User) => {
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
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        freeAdsUsed: 0,
        adsPosted: 0,
      });
    }
  } catch (error) {
    console.error("User record sync error:", error);
  }
};

const SplashScreen = () => (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center">
            <div className="bg-brand-500 text-white p-4 rounded-3xl mb-4 shadow-lg"><HomeIcon size={48} /></div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ANDAMAN <span className="text-brand-600">HOMES</span></h1>
            <div className="mt-8 flex items-center gap-2 text-gray-400">
                <Loader2 className="animate-spin" size={20} />
                <span className="text-xs font-bold uppercase tracking-widest">Loading Listings...</span>
            </div>
        </div>
    </div>
);

const ProtectedRoute = ({ children, user, loading }: any) => {
    if (loading) return <SplashScreen />;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AuthHandler = ({ setUser, setLoading }: any) => {
    const location = useLocation();
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                await ensureUserRecord(currentUser);
                setUser(currentUser);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);
    return null;
};

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <AuthHandler setUser={setUser} setLoading={setLoading} />
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20 md:pb-0">
        <Navbar />
        <BannerAd position="top" />
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/property/:id" element={<PropertyDetails />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/signup" element={user ? <Navigate to="/" /> : <Signup />} />

          {/* PROTECTED ROUTES */}
          <Route path="/add-property" element={<ProtectedRoute user={user} loading={loading}><AddProperty /></ProtectedRoute>} />
          <Route path="/my-ads" element={<ProtectedRoute user={user} loading={loading}><MyAds /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute user={user} loading={loading}><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute user={user} loading={loading}><ChatScreen /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute user={user} loading={loading}><PaymentPage /></ProtectedRoute>} />
        </Routes>
        <BannerAd position="bottom" />
      </div>
    </Router>
  );
};

export default App;
