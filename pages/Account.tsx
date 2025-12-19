
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import firebase from 'firebase/compat/app';
import { 
  User, 
  Settings, 
  LogOut, 
  ShieldAlert, 
  Key, 
  HelpCircle, 
  ChevronRight, 
  Phone, 
  Mail, 
  MessageCircle, 
  Trash2,
  AlertCircle,
  Loader2
} from 'lucide-react';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<firebase.User | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((curr) => {
      setUser(curr);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/login');
    } catch (err) {
      setError("Failed to logout.");
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    setLoading(true);
    try {
      await auth.sendPasswordResetEmail(user.email);
      setMessage("A password reset link has been sent to your email.");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // First delete profile in DB
      await db.collection('users').doc(user.uid).delete();
      // Delete Auth account
      await user.delete();
      navigate('/login');
    } catch (err: any) {
      console.error(err);
      setError("To delete your account, you must have logged in recently. Please logout and login again, then try deleting.");
      setShowDeleteModal(false);
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center mb-10 text-center">
            <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600 mb-4 border-4 border-white shadow-sm">
                <User size={48} />
            </div>
            <h1 className="text-2xl font-black text-gray-900">{user.displayName || 'User'}</h1>
            <p className="text-gray-500 text-sm font-medium">{user.email || user.phoneNumber || 'Andaman Homes Member'}</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 flex items-center gap-3 border border-red-100 text-sm animate-in slide-in-from-top-2">
                <AlertCircle size={18} /> {error}
            </div>
        )}

        {message && (
            <div className="bg-green-50 text-green-600 p-4 rounded-2xl mb-6 flex items-center gap-3 border border-green-100 text-sm animate-in slide-in-from-top-2">
                <ShieldAlert size={18} /> {message}
            </div>
        )}

        {/* Settings Section */}
        <section className="mb-8">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Settings</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                
                <button 
                  onClick={handleChangePassword}
                  disabled={loading}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-2 rounded-xl text-blue-600"><Key size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Change Password</p>
                            <p className="text-[10px] text-gray-400 font-medium">Send reset link to email</p>
                        </div>
                    </div>
                    {loading ? <Loader2 size={16} className="animate-spin text-gray-300" /> : <ChevronRight size={18} className="text-gray-300" />}
                </button>

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-gray-100 p-2 rounded-xl text-gray-600"><LogOut size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Logout</p>
                            <p className="text-[10px] text-gray-400 font-medium">Sign out of this device</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </button>

                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="w-full flex items-center justify-between p-5 hover:bg-red-50 transition-colors text-left group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-red-50 p-2 rounded-xl text-red-600"><Trash2 size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-red-600">Delete Account</p>
                            <p className="text-[10px] text-red-400 font-medium">Permanently remove your data</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-red-200 group-hover:text-red-300" />
                </button>
            </div>
        </section>

        {/* Help & Support Section */}
        <section>
            <h2 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-2">Help & Support</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                
                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-50 p-2 rounded-xl text-brand-600"><Phone size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Call Us</p>
                            <p className="text-[10px] text-gray-400 font-medium">+91 (ANDAMAN) HOMES</p>
                        </div>
                    </div>
                    <a href="tel:+910000000000" className="text-brand-600 text-xs font-bold uppercase">Call</a>
                </div>

                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-50 p-2 rounded-xl text-brand-600"><Mail size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">Email Support</p>
                            <p className="text-[10px] text-gray-400 font-medium">support@andamanhomes.com</p>
                        </div>
                    </div>
                    <a href="mailto:support@andamanhomes.com" className="text-brand-600 text-xs font-bold uppercase">Email</a>
                </div>

                <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                        <div className="bg-brand-50 p-2 rounded-xl text-brand-600"><HelpCircle size={20} /></div>
                        <div>
                            <p className="text-sm font-bold text-gray-900">FAQs</p>
                            <p className="text-[10px] text-gray-400 font-medium">Common questions and answers</p>
                        </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300" />
                </div>
            </div>
        </section>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
            <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-sm text-center animate-in zoom-in duration-200">
                    <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6 text-red-600">
                        <ShieldAlert size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">Are you sure?</h3>
                    <p className="text-sm text-gray-500 mb-8 leading-relaxed">
                        This action is permanent. All your listings, messages, and profile data will be erased forever.
                    </p>
                    <div className="flex flex-col gap-3">
                        <button 
                          onClick={handleDeleteAccount}
                          disabled={loading}
                          className="bg-red-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-red-100 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Yes, Delete Permanently'}
                        </button>
                        <button 
                          onClick={() => setShowDeleteModal(false)}
                          className="text-gray-400 font-bold py-2 text-sm uppercase tracking-widest"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    </div>
  );
};

export default Account;
