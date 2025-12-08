
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Home, PlusCircle, LogOut, Menu, X, User as UserIcon, MessageSquare } from 'lucide-react';

const Navbar: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
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
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <Link to="/" className="text-gray-600 hover:text-brand-600 px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Browse Properties
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
                  <PlusCircle size={18} />
                  Post Free Ad
                </Link>
                <div className="flex items-center gap-2 ml-4 pl-4 border-l border-gray-200">
                  <div className="flex items-center gap-1 text-sm text-gray-700 font-medium">
                     <UserIcon size={16} className="text-gray-400" />
                     {user.email?.split('@')[0]}
                  </div>
                  <button 
                    onClick={handleLogout}
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
                <Link to="/signup" className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                  Sign up
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

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-brand-500"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link 
              to="/" 
              onClick={() => setIsOpen(false)}
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
            >
              Browse Properties
            </Link>
            
            {user ? (
              <>
                 <Link 
                  to="/chats" 
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                >
                  Messages
                </Link>
                <Link 
                  to="/add-property" 
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-brand-600 hover:bg-brand-50"
                >
                  Post Free Ad
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-brand-600 hover:bg-gray-50"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
