
import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { Loader2, AlertCircle, Phone, ArrowRight, ShieldCheck, HelpCircle } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
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
  const [envWarning, setEnvWarning] = useState<string | null>(null);
  
  const isVerifierInitializing = useRef(false);

  // --- Environment & Compatibility Checks ---
  useEffect(() => {
    // 1. Check Protocol
    if (window.location.protocol === 'file:') {
        setEnvWarning("Running from a local file. Authentication may fail. Use a web server (http/https).");
    }

    // 2. Check for IndexedDB (Required by Firebase Auth for LOCAL persistence)
    if (!window.indexedDB) {
        setEnvWarning("Your browser doesn't support storage. Persistence may not work.");
    }

    // 3. Initialize Recaptcha with safe DOM checks
    const initRecaptcha = async () => {
        const container = document.getElementById('recaptcha-container');
        if (!container) return;
        
        if (!window.recaptchaVerifier && !isVerifierInitializing.current) {
            isVerifierInitializing.current = true;
            try {
                // Clear any existing instances to avoid "internal-error"
                container.innerHTML = ''; 
                
                window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => { console.log("reCAPTCHA solved"); },
                    'expired-callback': () => {
                        setError("Verification expired. Please try again.");
                    }
                });
                await window.recaptchaVerifier.render();
            } catch (e: any) {
                console.error("Auth: Recaptcha Init Error:", e);
                setError(`Security check failed to load: ${e.message}`);
            } finally {
                isVerifierInitializing.current = false;
            }
        }
    };

    const timer = setTimeout(initRecaptcha, 500); // Small delay for DOM readiness

    return () => {
        clearTimeout(timer);
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            } catch (e) {}
        }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
        const isMobile = /iphone|ipad|ipod|android|blackberry|iemobile|opera mini/i.test(navigator.userAgent.toLowerCase());
        const isApp = !!window.median || !!window.gonative;
        const isNonHttps = window.location.protocol !== 'https:';

        // Use Redirect for App, Mobile, or Non-HTTPS environments to avoid "operation-not-supported"
        if (isMobile || isApp || isNonHttps) {
            console.log("Auth: Using Redirect (Restricted Environment)");
            await auth.signInWithRedirect(googleProvider);
        } else {
            console.log("Auth: Using Popup (Desktop Secure)");
            await auth.signInWithPopup(googleProvider);
        }
    } catch (err: any) {
        console.error("Auth: Google Error:", err);
        if (err.code === 'auth/popup-closed-by-user') {
            setLoading(false);
            return;
        }
        setError(err.message.includes("operation-not-supported") 
            ? "Environment Error: Try standard browser or HTTPS." 
            : "Sign-In failed. Try Phone OTP.");
        setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(phoneNumber)) {
        setError("Enter a valid 10-digit Indian mobile number.");
        return;
    }

    setLoading(true);
    try {
      // Re-initialize if lost
      if (!window.recaptchaVerifier) {
           const container = document.getElementById('recaptcha-container');
           if (container) container.innerHTML = '';
           window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', { 'size': 'invisible' });
      }

      const appVerifier = window.recaptchaVerifier;
      const formattedNumber = `+91${phoneNumber}`;
      
      const result = await auth.signInWithPhoneNumber(formattedNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
      
    } catch (err: any) {
      console.error("Auth: OTP Send Error:", err);
      if (err.code === 'auth/internal-error') {
          setError("Security error. Please refresh the page and try again.");
      } else {
          setError(err.message || "Failed to send OTP. Check your connection.");
      }
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
    } catch (err: any) {
      setError(err.code === 'auth/invalid-verification-code' ? "Invalid OTP. Please try again." : "Verification failed.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-900">Sign In</h2>
            <p className="mt-2 text-sm text-gray-500">Access your Andaman Homes account</p>
        </div>

        {envWarning && (
            <div className="bg-yellow-50 text-yellow-700 p-3 rounded-lg text-xs mb-4 flex items-start gap-2 border border-yellow-100">
                <HelpCircle size={14} className="mt-0.5 flex-shrink-0" /> {envWarning}
            </div>
        )}

        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 flex items-center gap-2 border border-red-100">
                <AlertCircle size={16} /> {error}
            </div>
        )}
        
        <div id="recaptcha-container" className="mb-2"></div>

        {!showOtpInput ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mobile Number</label>
                    <div className="flex">
                        <span className="inline-flex items-center px-4 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-bold">+91</span>
                        <input
                            type="tel"
                            required
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-r-xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 font-bold"
                            placeholder="99999 99999"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        />
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    disabled={loading || phoneNumber.length < 10} 
                    className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-lg transition-all active:scale-95 disabled:opacity-50"
                >
                     {loading ? <Loader2 className="animate-spin" /> : 'Get Verification Code'}
                </button>
            </form>
        ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Verify OTP</label>
                        <button type="button" onClick={() => setShowOtpInput(false)} className="text-xs text-brand-600 font-bold">Edit Number</button>
                    </div>
                    <input
                        type="text"
                        required
                        className="w-full px-4 py-4 bg-gray-50 border border-gray-200 rounded-xl text-center text-3xl tracking-widest font-bold focus:ring-2 focus:ring-brand-500 outline-none text-gray-900"
                        placeholder="000000"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        autoFocus
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={loading || otp.length < 6} 
                    className="w-full py-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-lg transition-all active:scale-95 disabled:opacity-50 gap-2"
                >
                     {loading ? <Loader2 className="animate-spin" /> : <>Login Now <ArrowRight size={18} /></>}
                </button>
            </form>
        )}

        <div className="relative my-8">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-xs"><span className="px-3 bg-white text-gray-400 font-medium">Alternative login</span></div>
        </div>

        <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-3.5 border border-gray-200 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors font-bold text-gray-700 active:bg-gray-100"
        >
            {loading && !showOtpInput ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                    Login with Google
                </>
            )}
        </button>

        <div className="mt-8 flex items-center justify-center gap-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest">
            <ShieldCheck size={14} className="text-brand-500" />
            <span>Secure 256-bit Encryption</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
