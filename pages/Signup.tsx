
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Phone, Mail, AlertCircle } from 'lucide-react';

const Signup: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      await auth.createUserWithEmailAndPassword(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setError("Email already registered. Please Login.");
      } else {
         setError("Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
      // Re-use logic for simplicity
      try {
        setLoading(true);
        await auth.signInWithPopup(googleProvider);
        navigate('/', { replace: true });
      } catch (e: any) {
         setError("Google Signup failed."); 
         setLoading(false);
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-500">Join Andaman Homes today</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <form onSubmit={handleSignup} className="space-y-4">
            <input
                type="email"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />
            <input
                type="password"
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all"
                placeholder="Password (Min 6 chars)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all disabled:opacity-70 flex justify-center items-center"
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
