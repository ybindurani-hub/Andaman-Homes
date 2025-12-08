
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AddProperty from './pages/AddProperty';
import PropertyDetails from './pages/PropertyDetails';
import PaymentPage from './pages/PaymentPage';
import ChatList from './pages/ChatList';
import ChatScreen from './pages/ChatScreen';
import { auth } from './firebase';

// Helper hook for auth state
function useAuthHook() {
    const [user, setUser] = React.useState(auth.currentUser);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
            setLoading(false);
        });
        return unsub;
    }, []);
    return { user, loading };
}

// Defined outside App to prevent remounting on every render
const ProtectedRouteManual = ({ children }: { children: React.ReactElement }) => {
    const { user, loading } = useAuthHook();
    if (loading) return <div className="h-screen flex items-center justify-center text-brand-600">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return children;
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-slate-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route 
            path="/add-property" 
            element={
              <ProtectedRouteManual>
                <AddProperty />
              </ProtectedRouteManual>
            } 
          />
          <Route 
            path="/payment" 
            element={
              <ProtectedRouteManual>
                <PaymentPage />
              </ProtectedRouteManual>
            } 
          />
          <Route path="/property/:id" element={<PropertyDetails />} />
          
          {/* Chat Routes */}
          <Route 
            path="/chats" 
            element={
              <ProtectedRouteManual>
                <ChatList />
              </ProtectedRouteManual>
            } 
          />
          <Route 
            path="/chat/:chatId" 
            element={
              <ProtectedRouteManual>
                <ChatScreen />
              </ProtectedRouteManual>
            } 
          />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
