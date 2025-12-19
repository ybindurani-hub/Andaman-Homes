
import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { Loader2, AlertCircle, Phone, ArrowRight, ShieldCheck, HelpCircle, Building2, CheckCircle2 } from 'lucide-react';

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
  
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Storage Support Check
    if (!window.indexedDB) {
        setEnvWarning("Storage is disabled. You might need to log in every time.");
    }

    // 2. Protocol Check
    if (window.location.protocol === 'file:') {
        setError("Error: App must run on a web server (http/https) to use authentication.");
    }

    // 3. Robust Recaptcha Initialization
    const initRecaptcha = () => {
        if (window.recaptchaVerifier) return;
        
        try {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
                'size': 'invisible',
                'callback': () => { console.debug("Captcha Solved"); },
                'expired-callback': () => {
                    setError("Security check expired. Please try again.");
                }
            });
        } catch (e: any) {
            console.error("Recaptcha Error:", e);
        }
    };

    const timer = setTimeout(initRecaptcha, 800);
    return () => {
        clearTimeout(timer);
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); window.recaptchaVerifier = null; } catch(e) {}
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

        if (isMobile || isApp || isNonHttps) {
            await auth.signInWithRedirect(googleProvider);
        } else {
            await auth.signInWithPopup(googleProvider);
        }
    } catch (err: any) {
        console.error("Google Auth Error:", err);
        if (err.code === 'auth/popup-closed-by-user') {
            setLoading(false);
            return;
        }
        setError(err.message.includes("operation-not-supported") 
            ? "Your environment doesn't support Google Login. Please use Phone OTP." 
            : "Google Sign-In failed. Try Phone Number.");
        setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        return;
    }

    setLoading(true);
    try {
      const appVerifier = window.recaptchaVerifier;
      const result = await auth.signInWithPhoneNumber(`+91${phoneNumber}`, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.code === 'auth/internal-error') {
          setError("Security check failed. Please refresh the page and try again.");
      } else {
          setError(err.message || "Could not send OTP. Verify your number.");
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
      setError("Invalid OTP code. Please check and try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-white">
      {/* Left Panel: Hero Info (Hidden on mobile) */}
      <div className="hidden lg:flex flex-col justify-center p-16 bg-brand-600 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 -mr-20 -mt-20 opacity-10">
            <Building2 size={500} />
         </div>
         
         <div className="relative z-10">
            <div className="bg-white/20 p-3 rounded-2xl w-fit mb-8">
                <Building2 size={40} />
            </div>
            <h1 className="text-5xl font-black tracking-tight mb-6">Find your dream home in the islands.</h1>
            <p className="text-xl text-brand-50 mb-12 max-w-md">The most trusted zero-brokerage real estate platform in Andaman & Nicobar.</p>
            
            <ul className="space-y-4">
                {["100% Genuine Listings", "No Brokerage Fees", "Direct Owner Contact"].map(text => (
                    <li key={text} className="flex items-center gap-3 font-bold">
                        <CheckCircle2 className="text-brand-300" size={24} /> {text}
                    </li>
                ))}
            </ul>
         </div>
      </div>

      {/* Right Panel: Login Form */}
      <div className="flex items-center justify-center p-6 md:p-12">
        <div className="max-w-md w-full">
            <div className="text-center lg:text-left mb-10">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Login to Account</h2>
                <p className="text-gray-500">Welcome back! Please enter your details.</p>
            </div>

            {envWarning && (
                <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm mb-6 flex items-start gap-3 border border-amber-100">
                    <HelpCircle size={20} className="flex-shrink-0" /> {envWarning}
                </div>
            )}

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm mb-6 flex items-center gap-3 border border-red-100">
                    <AlertCircle size={20} className="flex-shrink-0" /> {error}
                </div>
            )}
            
            <div id="recaptcha-container"></div>

            {!showOtpInput ? (
                <div className="space-y-6">
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                            <div className="flex">
                                <span className="inline-flex items-center px-4 rounded-l-2xl border border-r-0 border-gray-200 bg-gray-50 text-gray-500 font-bold">+91</span>
                                <input
                                    type="tel"
                                    required
                                    className="w-full px-5 py-4 bg-white border border-gray-200 rounded-r-2xl focus:ring-2 focus:ring-brand-500 outline-none text-gray-900 font-bold transition-all"
                                    placeholder="Mobile Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                />
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={loading || phoneNumber.length < 10} 
                            className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-lg shadow-brand-100 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" /> : 'Continue'}
                        </button>
                    </form>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <div className="relative flex justify-center text-xs"><span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">or</span></div>
                    </div>

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        className="w-full py-4 border-2 border-gray-100 rounded-2xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all font-bold text-gray-700 active:scale-95"
                    >
                        {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                            <>
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-6 w-6" />
                                Login with Google
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div>
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enter Verification Code</label>
                            <button type="button" onClick={() => setShowOtpInput(false)} className="text-xs text-brand-600 font-bold hover:underline">Change Number</button>
                        </div>
                        <input
                            type="text"
                            required
                            className="w-full px-5 py-5 bg-gray-50 border border-gray-200 rounded-2xl text-center text-3xl tracking-[1em] font-black focus:ring-4 focus:ring-brand-100 focus:bg-white focus:border-brand-500 outline-none text-gray-900 transition-all"
                            placeholder="000000"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            autoFocus
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading || otp.length < 6} 
                        className="w-full py-4 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold flex justify-center items-center shadow-xl shadow-brand-100 transition-all active:scale-95 disabled:opacity-50 gap-2"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>Verify & Continue <ArrowRight size={20} /></>}
                    </button>
                    <p className="text-center text-xs text-gray-400">Didn't get the code? <button type="button" className="text-brand-600 font-bold">Resend</button></p>
                </form>
            )}

            <div className="mt-12 text-center">
                <p className="text-sm text-gray-500">
                    Don't have an account? <Link to="/signup" className="text-brand-600 font-extrabold hover:underline ml-1">Join Andaman Homes</Link>
                </p>
            </div>

            <div className="mt-12 flex items-center justify-center gap-3 text-[10px] text-gray-400 uppercase font-black tracking-[0.2em]">
                <ShieldCheck size={16} className="text-brand-500" />
                <span>Verified Secure Access</span>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
