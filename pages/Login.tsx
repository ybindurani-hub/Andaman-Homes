
import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { Loader2, AlertCircle, Phone, ArrowRight } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
    // Median/GoNative injected objects
    median?: any;
    gonative?: any; 
  }
}

const Login: React.FC = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const isVerifierInitializing = useRef(false);

  // --- 1. Initialize Recaptcha ---
  useEffect(() => {
    const initRecaptcha = async () => {
        if (!document.getElementById('recaptcha-container')) return;
        
        if (!window.recaptchaVerifier && !isVerifierInitializing.current) {
            isVerifierInitializing.current = true;
            try {
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => { /* solved */ },
                    'expired-callback': () => {
                        setError("Verification expired. Please try again.");
                    }
                });
            } catch (e) {
                console.error("Recaptcha Init Error:", e);
            } finally {
                isVerifierInitializing.current = false;
            }
        }
    };

    initRecaptcha();

    return () => {
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            } catch (e) {}
        }
    };
  }, []);

  // --- 2. Google Login Handler (Environment Aware) ---
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
        const ua = navigator.userAgent.toLowerCase();
        
        // Detect Mobile, WebView, or Median App environment
        const isMedian = ua.includes('median') || ua.includes('gonative') || !!window.median || !!window.gonative;
        const isMobile = /iphone|ipad|ipod|android|blackberry|iemobile|opera mini/i.test(ua);
        const isWebView = /(wv|version\/[\d.]+)/.test(ua);

        // STRATEGY: 
        // Mobile/WebView/Median -> Use Redirect (Popup gets blocked or opens external browser)
        // Desktop Browser -> Use Popup (Better UX)
        if (isMobile || isMedian || isWebView) {
            console.log("Environment: Mobile/WebView - Using Redirect");
            await auth.signInWithRedirect(googleProvider);
            // Execution stops here as page redirects
        } else {
            console.log("Environment: Desktop - Using Popup");
            await auth.signInWithPopup(googleProvider);
            // App.tsx auth listener handles navigation
        }
    } catch (err: any) {
        console.error("Google Login Error:", err);
        if (err.code === 'auth/popup-closed-by-user') {
            setLoading(false);
            return;
        }
        if (err.code === 'auth/operation-not-supported-in-this-environment') {
            setError("Login method not supported in this browser. Try standard mobile browser.");
        } else {
            setError("Google Sign-In failed. Please try again.");
        }
        setLoading(false);
    }
  };

  // --- 3. Phone OTP Handlers ---
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
      if (!window.recaptchaVerifier) {
           window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
                'callback': () => {}
           });
      }

      const appVerifier = window.recaptchaVerifier;
      const formattedNumber = `+91${phoneNumber}`;
      
      const result = await auth.signInWithPhoneNumber(formattedNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.code === 'auth/invalid-phone-number') setError("Invalid phone number format.");
      else if (err.code === 'auth/too-many-requests') setError("Too many attempts. Please try again later.");
      else if (err.code === 'auth/internal-error') {
          setError("Network Error. Reloading...");
          setTimeout(() => window.location.reload(), 2000);
      }
      else setError("Failed to send OTP.");
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
      // Success handled by App.tsx
    } catch (err: any) {
      if (err.code === 'auth/invalid-verification-code') setError("Incorrect OTP.");
      else setError("Verification failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100 relative">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-extrabold text-gray-900">Welcome</h2>
            <p className="mt-2 text-sm text-gray-500">Sign in to list or browse properties</p>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 animate-pulse">
                <AlertCircle size={16} /> {error}
            </div>
        )}
        
        <div id="recaptcha-container"></div>

        {/* --- Phone Auth Section --- */}
        {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                    <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-medium select-none">+91</span>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-r-lg focus:ring-2 focus:ring-brand-500 focus:bg-white outline-none transition-all font-medium text-gray-900"
                            placeholder="Enter 10-digit number"
                            value={phoneNumber}
                            onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                if (val.length <= 10) setPhoneNumber(val);
                            }}
                        />
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading || phoneNumber.length < 10} 
                    className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 disabled:shadow-none"
                >
                     {loading ? <Loader2 className="animate-spin" /> : 'Get OTP'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-medium text-gray-700">Enter OTP</label>
                        <button 
                            type="button" 
                            onClick={() => { setShowOtpInput(false); setOtp(''); setError(''); }} 
                            className="text-xs text-brand-600 hover:underline font-medium"
                        >
                            Change Number
                        </button>
                    </div>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-center text-2xl tracking-[0.5em] font-bold focus:ring-2 focus:ring-brand-500 outline-none transition-all text-gray-900"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length <= 6) setOtp(val);
                        }}
                        maxLength={6}
                        autoFocus
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading || otp.length < 6} 
                    className="w-full py-3.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-lg shadow-brand-500/30 transition-all disabled:opacity-70 disabled:shadow-none gap-2"
                >
                     {loading ? <Loader2 className="animate-spin" /> : <>Verify & Login <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        {/* --- Divider --- */}
        <div className="relative mt-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-sm"><span className="px-3 bg-white text-gray-500">Or continue with</span></div>
        </div>

        {/* --- Google Auth Button --- */}
        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="mt-6 w-full py-3 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-medium text-gray-700 active:bg-gray-100"
        >
            {loading && !showOtpInput ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                    Google
                </>
            )}
        </button>

      </div>
    </div>
  );
};

export default Login;
