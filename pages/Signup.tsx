
import React, { useState } from 'react';
import { auth, googleProvider, db } from '../firebase';
import firebase from 'firebase/compat/app';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, User, Mail, Lock } from 'lucide-react';

const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // --- HANDLER: Google Signup ---
  const handleGoogleSignup = async () => {
      setLoading(true);
      setError('');
      try {
        await auth.signInWithPopup(googleProvider);
        // NO navigate() here. App.tsx handles it.
      } catch (err: any) {
         console.error("Google Signup Error:", err);
         const isPopupIssue = 
          err.code === 'auth/popup-blocked' || 
          err.code === 'auth/popup-closed-by-user' || 
          err.code === 'auth/operation-not-supported-in-this-environment';
         
         if (isPopupIssue) {
              try {
                  await auth.signInWithRedirect(googleProvider);
                  return;
              } catch (redirErr: any) {
                  setError("Google Sign-In is not supported in this environment.");
                  setLoading(false);
              }
         } else {
             setError("Google Signup failed. Please try again."); 
             setLoading(false);
         }
      }
  };

  // --- HANDLER: Email Signup ---
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (password.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
    }

    try {
      // 1. Create User
      const userCredential = await auth.createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      if (user) {
        // 2. Update Auth Profile
        await user.updateProfile({ displayName: name });
        
        // 3. Create Firestore Document Immediately (Specific to Signup Form Data)
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            email: email,
            displayName: name,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            freeAdsUsed: 0,
            adsPosted: 0
        });
        
        // NO navigate(). App.tsx detects user -> PublicRoute -> Redirects to Home.
      }
    } catch (err: any) {
      console.error("Signup Error:", err);
      if (err.code === 'auth/email-already-in-use') {
         setError("Email already registered. Please Login.");
      } else if (err.code === 'auth/invalid-email') {
         setError("Please enter a valid email address.");
      } else {
         setError("Signup failed. Please try again.");
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-500">Join Andaman Homes to buy & sell property</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
            <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="text"
                    required
                    className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>

            <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="email"
                    required
                    className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                    placeholder="Email Address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
            </div>

            <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <input
                    type="password"
                    required
                    className="w-full pl-10 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                    placeholder="Password (Min 6 chars)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all disabled:opacity-70 flex justify-center items-center shadow-lg shadow-brand-500/30"
            >
                {loading ? <Loader2 className="animate-spin" /> : 'Sign Up'}
            </button>
        </form>

        <div className="mt-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">Or sign up with</span></div>
            </div>
            <button
                onClick={handleGoogleSignup}
                className="mt-6 w-full py-3 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                Google
            </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
            Already have an account? <Link to="/login" className="font-bold text-brand-600 hover:underline">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
