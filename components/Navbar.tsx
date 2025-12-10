
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Home, Plus, LogOut, User as UserIcon, MessageSquare, Menu, X, Search, Heart } from 'lucide-react';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = async () => {
    try {
      await auth.signOut();
      setShowLogoutConfirm(false);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* --- DESKTOP TOP NAVIGATION --- */}
      <nav className="hidden md:block sticky top-0 z-[60] bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 flex items-center gap-2">
                <div className="bg-brand-500 text-white p-1.5 rounded-lg">
                  <Home size={24} />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900">
                  <span className="text-brand-600">Andaman</span> Homes
                </span>
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Browse
              </Link>
              
              {user ? (
                <>
                  <Link to="/chats" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-1">
                    <MessageSquare size={18} />
                    Messages
                  </Link>
                  <Link 
                    to="/add-property" 
                    className="bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm uppercase tracking-wide"
                  >
                    <Plus size={18} />
                    Sell
                  </Link>
                  <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                    <div className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                       <UserIcon size={16} className="text-gray-400" />
                       {user.email?.split('@')[0]}
                    </div>
                    <button 
                      onClick={handleLogoutClick}
                      className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                      title="Logout"
                    >
                      <LogOut size={20} />
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link to="/login" className="text-gray-700 hover:text-brand-600 px-3 py-2 text-sm font-medium">
                    Log in
                  </Link>
                  <Link 
                    to="/login"
                    className="ml-2 bg-brand-50 text-brand-600 border border-brand-200 hover:bg-brand-100 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Post Free Ad
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* --- MOBILE TOP HEADER --- */}
      <nav className="md:hidden sticky top-0 z-[60] bg-white px-4 py-3 shadow-sm flex justify-between items-center">
         <Link to="/" className="flex items-center gap-1.5">
             <span className="font-extrabold text-xl text-brand-600">Andaman<span className="text-gray-900">Homes</span></span>
         </Link>
         <div className="flex items-center gap-3">
             <span className="text-xs font-medium text-gray-500 truncate max-w-[120px]">
                 <span className="text-gray-900 font-bold">Port Blair</span>
             </span>
         </div>
      </nav>

      {/* --- MOBILE BOTTOM NAVIGATION --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[60] pb-safe">
        <div className="flex justify-between items-end px-2 py-2">
            {/* Home */}
            <Link to="/" className={`flex flex-col items-center flex-1 py-1 ${isActive('/') ? 'text-brand-600' : 'text-gray-500'}`}>
                <Home size={24} strokeWidth={isActive('/') ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">Home</span>
            </Link>

            {/* Chats */}
            <Link to="/chats" className={`flex flex-col items-center flex-1 py-1 ${isActive('/chats') ? 'text-brand-600' : 'text-gray-500'}`}>
                <MessageSquare size={24} strokeWidth={isActive('/chats') ? 2.5 : 2} />
                <span className="text-[10px] font-medium mt-1">Chats</span>
            </Link>

            {/* SELL BUTTON (Floating) */}
            <div className="flex flex-col items-center flex-1 relative -top-5">
                <Link to="/add-property" className="bg-white p-1 rounded-full shadow-[0_-2px_10px_rgba(0,0,0,0.1)]">
                    <div className="bg-gradient-to-tr from-brand-400 to-blue-500 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white">
                        <Plus size={32} strokeWidth={3} />
                    </div>
                </Link>
                <span className="text-[10px] font-bold text-gray-700 mt-1 uppercase">Sell</span>
            </div>

            {/* My Ads (Placeholder or Favorites) */}
            <button className={`flex flex-col items-center flex-1 py-1 text-gray-500`}>
                <Heart size={24} />
                <span className="text-[10px] font-medium mt-1">My Ads</span>
            </button>

            {/* Account */}
            {user ? (
                <button onClick={handleLogoutClick} className={`flex flex-col items-center flex-1 py-1 text-gray-500`}>
                    <UserIcon size={24} />
                    <span className="text-[10px] font-medium mt-1">Logout</span>
                </button>
            ) : (
                <Link to="/login" className={`flex flex-col items-center flex-1 py-1 ${isActive('/login') ? 'text-brand-600' : 'text-gray-500'}`}>
                    <UserIcon size={24} strokeWidth={isActive('/login') ? 2.5 : 2} />
                    <span className="text-[10px] font-medium mt-1">Account</span>
                </Link>
            )}
        </div>
      </div>

      {/* --- LOGOUT CONFIRMATION MODAL --- */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm animate-in zoom-in duration-200">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Logout</h3>
            <p className="text-sm text-gray-600 mb-6">Are you sure you want to log out of Andaman Homes?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2.5 rounded-lg transition-colors shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
