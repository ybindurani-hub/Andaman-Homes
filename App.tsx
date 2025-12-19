
import React, { useEffect, useState, useRef } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import { Loader2, Bell, X, MessageCircle } from 'lucide-react';

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
    }
  } catch (error) {
    console.error("User record creation error:", error);
  }
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
};

const NotificationToast = ({ notification, onClose, onClick }: any) => (
    <div className="fixed top-4 left-4 right-4 z-[100] md:left-auto md:w-80 animate-in slide-in-from-top duration-300">
        <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-transform" onClick={onClick}>
            <div className="w-12 h-12 rounded-full bg-brand-500 flex items-center justify-center text-white flex-shrink-0">
                <MessageCircle size={24} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-brand-600 uppercase tracking-wider">New Message</p>
                <h4 className="text-sm font-bold text-gray-900 truncate">{notification.propertyTitle}</h4>
                <p className="text-xs text-gray-500 truncate">{notification.lastMessage}</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1 hover:bg-gray-100 rounded-full text-gray-400">
                <X size={18} />
            </button>
        </div>
    </div>
);

const AuthHandler = ({ setUser, setLoading }: any) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [notification, setNotification] = useState<any>(null);
    const isFirstLoad = useRef(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                await ensureUserRecord(currentUser);
                setUser(currentUser);

                // Global listener for new messages in all chats
                const chatUnsubscribe = db.collection('chats')
                    .where('participants', 'array-contains', currentUser.uid)
                    .onSnapshot(snapshot => {
                        snapshot.docChanges().forEach(change => {
                            if (change.type === 'modified') {
                                const data = change.doc.data();
                                const isFromOthers = data.lastSenderId !== currentUser.uid;
                                const isNotCurrentChat = !location.pathname.includes(change.doc.id);

                                if (isFromOthers && isNotCurrentChat && !isFirstLoad.current) {
                                    setNotification({ ...data, id: change.doc.id });
                                    setTimeout(() => setNotification(null), 6000);
                                }
                            }
                        });
                        isFirstLoad.current = false;
                    });
                return () => chatUnsubscribe();
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, [location.pathname]);

    return notification ? (
        <NotificationToast 
            notification={notification} 
            onClose={() => setNotification(null)} 
            onClick={() => { setNotification(null); navigate(`/chat/${notification.id}`); }} 
        />
    ) : null;
};

const ProtectedRoute = ({ children, user, loading }: any) => {
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children, user, loading }: any) => {
    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-600" /></div>;
    return user ? <Navigate to="/" replace /> : <>{children}</>;
};

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(true);

  return (
    <Router>
      <ScrollToTop />
      <AuthHandler setUser={setUser} setLoading={setLoading} />
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900 pb-20 md:pb-0">
        <Navbar />
        <BannerAd position="top" />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<PublicRoute user={user} loading={loading}><Login /></PublicRoute>} />
          <Route path="/add-property" element={<ProtectedRoute user={user} loading={loading}><AddProperty /></ProtectedRoute>} />
          <Route path="/my-ads" element={<ProtectedRoute user={user} loading={loading}><MyAds /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute user={user} loading={loading}><PaymentPage /></ProtectedRoute>} />
          <Route path="/chats" element={<ProtectedRoute user={user} loading={loading}><ChatList /></ProtectedRoute>} />
          <Route path="/chat/:chatId" element={<ProtectedRoute user={user} loading={loading}><ChatScreen /></ProtectedRoute>} />
          <Route path="/property/:id" element={<PropertyDetails />} />
        </Routes>
        <BannerAd position="bottom" />
      </div>
    </Router>
  );
};

export default App;
