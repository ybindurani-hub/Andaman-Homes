
import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { Link } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const Login: React.FC = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Clean up Recaptcha
  useEffect(() => {
    return () => {
      if (window.recaptchaVerifier) window.recaptchaVerifier.clear();
    };
  }, []);

  // --- HANDLER: Google Login ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // Try Popup first (Better for Desktop)
      await auth.signInWithPopup(googleProvider);
      // NOTE: NO navigate() here. App.tsx detects change and redirects.
    } catch (err: any) {
      console.error("Google Login Error:", err);
      // Fallback to Redirect (Essential for Mobile/WebView)
      const isPopupIssue = 
          err.code === 'auth/popup-blocked' || 
          err.code === 'auth/popup-closed-by-user' || 
          err.code === 'auth/operation-not-supported-in-this-environment';

      if (isPopupIssue) {
          try {
             await auth.signInWithRedirect(googleProvider);
             // Return here, page will reload/redirect
             return; 
          } catch (redirErr: any) {
             setError("Google Sign-In not supported in this environment.");
             setLoading(false);
          }
      } else {
        setError("Google Sign-In failed.");
        setLoading(false);
      }
    }
  };

  // --- HANDLER: Email Login ---
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await auth.signInWithEmailAndPassword(email, password);
    } catch (err: any) {
      console.error("Login Error:", err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
         setError("Incorrect email or password.");
      } else if (err.code === 'auth/too-many-requests') {
         setError("Too many failed attempts. Try later.");
      } else {
         setError("Failed to sign in.");
      }
      setLoading(false);
    }
  };

  // --- HANDLER: Phone Auth ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
        'size': 'invisible',
        'callback': () => {}
      });
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(phoneNumber)) {
        setError("Enter a valid 10-digit Indian number.");
        return;
    }

    setLoading(true);
    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedNumber = `+91${phoneNumber}`;
      const result = await auth.signInWithPhoneNumber(formattedNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      console.error("OTP Error:", err);
      setError("Failed to send OTP. Try again later.");
      if(window.recaptchaVerifier) window.recaptchaVerifier.clear();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await confirmationResult.confirm(otp);
      // Success: App.tsx will handle routing
    } catch (err: any) {
      setError("Invalid OTP.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-900">Welcome Back</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to Andaman Homes</p>
        </div>
        
        {/* Toggle */}
        <div className="bg-gray-100 p-1 rounded-xl flex mb-6">
            <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${method === 'email' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setMethod('email')}
            >
                Email
            </button>
            <button
                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${method === 'phone' ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                onClick={() => setMethod('phone')}
            >
                Phone
            </button>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {error}
            </div>
        )}
        
        {method === 'email' ? (
            <form onSubmit={handleEmailLogin} className="space-y-4">
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
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold transition-all disabled:opacity-70 flex justify-center items-center shadow-lg shadow-brand-500/30"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Login'}
                </button>
            </form>
        ) : (
            <div>
                <div id="recaptcha-container"></div>
                {!showOtpInput ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="flex">
                            <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-medium">+91</span>
                            <input
                                type="tel"
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                                placeholder="Mobile Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                maxLength={10}
                            />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center">
                             {loading ? <Loader2 className="animate-spin" /> : 'Get OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-2xl tracking-widest font-bold focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none"
                            placeholder="XXXXXX"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            maxLength={6}
                        />
                        <button type="submit" disabled={loading} className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center">
                             {loading ? <Loader2 className="animate-spin" /> : 'Verify & Login'}
                        </button>
                        <button type="button" onClick={() => setShowOtpInput(false)} className="w-full text-center text-sm text-gray-500 hover:text-brand-600 mt-2">Change Number</button>
                    </form>
                )}
            </div>
        )}

        <div className="mt-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-400">Or continue with</span></div>
            </div>
            <button
                onClick={handleGoogleLogin}
                className="mt-6 w-full py-3 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-medium text-gray-700"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                Google
            </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-8">
            New here? <Link to="/signup" className="font-bold text-brand-600 hover:underline">Create Account</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
