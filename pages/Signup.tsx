
import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import firebase from 'firebase/compat/app';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus, Loader2, Phone, Mail, KeyRound, User, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

const Signup: React.FC = () => {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // --- Guest Login ---
  const handleGuestLogin = async () => {
      setLoading(true);
      setError('');
      try {
          try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e) {}
          await auth.signInAnonymously();
          navigate('/');
      } catch (err: any) {
          console.error("Guest Login Error:", err);
          if (err.code === 'auth/operation-not-supported-in-this-environment') {
             setError("Guest login not supported in this environment. Use Email/Password.");
          } else {
             setError("Failed to sign in as guest.");
          }
      } finally {
          setLoading(false);
      }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e) {}
      await auth.createUserWithEmailAndPassword(email, password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setError("This email is already registered. Please login.");
      } else if (err.code === 'auth/operation-not-supported-in-this-environment') {
         setError("Signup not supported in this environment. Try Guest Login.");
      } else {
         setError(err.message || "Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    try {
      try { await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); } catch(e) {}
      await auth.signInWithPopup(googleProvider);
      navigate('/');
    } catch (err: any) {
      console.error("Google Signup Error:", err);
      if (err.code === 'auth/operation-not-supported-in-this-environment' || err.message?.includes('location.protocol')) {
        setError("Google Sign-In is restricted in this preview environment. Please use Email/Password or Guest Login.");
      } else if (err.code === 'auth/internal-error') {
        setError("Internal connection error. Please try Guest Login.");
      } else {
        setError("Google sign-up failed. Try Guest mode.");
      }
    } finally {
        setLoading(false);
    }
  };

  // --- Phone Signup Helpers ---
  const setupRecaptcha = () => {
    try {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container-signup', {
                'size': 'invisible',
                'callback': () => {
                // reCAPTCHA solved
                }
            });
        }
    } catch (err: any) {
        console.error("Recaptcha Setup Error:", err);
        throw err;
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const regex = /^[6-9]\d{9}$/;
    if (!regex.test(phoneNumber)) {
        setError("Please enter a valid 10-digit Indian mobile number.");
        setLoading(false);
        return;
    }

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const formattedNumber = `+91${phoneNumber}`;
      
      const result = await auth.signInWithPhoneNumber(formattedNumber, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/operation-not-supported-in-this-environment') {
         setError("Phone Auth not supported in this environment. Use Guest login.");
      } else if (err.code === 'auth/internal-error') {
         setError("Auth Error: Domain not whitelisted. Use Guest login.");
      } else {
         setError(err.message || "Failed to send OTP.");
      }

      if(window.recaptchaVerifier) {
          try {
            window.recaptchaVerifier.clear();
          } catch(e) { /* ignore clear error */ }
          window.recaptchaVerifier = undefined;
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
      navigate('/');
    } catch (err: any) {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="text-center mb-6">
             <div className="mx-auto bg-brand-100 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                <UserPlus className="text-brand-600 h-6 w-6" />
            </div>
            <h2 className="text-3xl font-extrabold text-gray-900">Create Account</h2>
            <p className="mt-2 text-sm text-gray-600">
                Join thousands of owners and tenants today
            </p>
        </div>

        {/* Method Toggle */}
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
            <button
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${method === 'email' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setMethod('email')}
            >
                <Mail size={16} className="mr-2" /> Email
            </button>
            <button
                className={`flex-1 flex items-center justify-center py-2 text-sm font-medium rounded-md transition-all ${method === 'phone' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                onClick={() => setMethod('phone')}
            >
                <Phone size={16} className="mr-2" /> Mobile
            </button>
        </div>

        {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm mb-6 flex items-start gap-2">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
            </div>
        )}

        {method === 'email' ? (
            <form className="space-y-6" onSubmit={handleSignup}>
            <div className="space-y-4">
                <div>
                <input
                    type="email"
                    required
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                </div>
                <div>
                <input
                    type="password"
                    required
                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                </div>
            </div>

            <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-colors disabled:opacity-70"
            >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Sign Up with Email'}
            </button>
            </form>
        ) : (
             <div className="space-y-6">
                <div id="recaptcha-container-signup"></div>
                {!showOtpInput ? (
                    <form onSubmit={handleSendOtp} className="space-y-4">
                        <div className="relative rounded-md shadow-sm">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-gray-500 sm:text-sm border-r pr-2">+91</span>
                            </div>
                            <input
                                type="tel"
                                required
                                className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-14 sm:text-sm border-gray-300 rounded-lg py-3 border"
                                placeholder="Mobile Number"
                                value={phoneNumber}
                                onChange={(e) => setPhoneNumber(e.target.value)}
                                maxLength={10}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-colors disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Send OTP'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerifyOtp} className="space-y-4">
                         <div className="text-sm text-center text-gray-600 mb-2">
                            Enter OTP sent to +91 {phoneNumber} <br/>
                            <button type="button" onClick={() => setShowOtpInput(false)} className="text-brand-600 hover:underline text-xs">Change Number</button>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <KeyRound className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                required
                                className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border tracking-widest text-center text-lg font-bold"
                                placeholder="XXXXXX"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                                maxLength={6}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none transition-colors disabled:opacity-70"
                        >
                            {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 'Verify OTP'}
                        </button>
                    </form>
                )}
            </div>
        )}

        <div className="mt-8">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or sign up with</span>
                </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                    onClick={handleGoogleSignup}
                    disabled={loading}
                    className="flex justify-center items-center gap-2 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="h-5 w-5" />
                    Google
                </button>
                <button
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="flex justify-center items-center gap-2 px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 transition-all"
                >
                    <User className="h-5 w-5 text-gray-500" />
                    Guest
                </button>
            </div>
        </div>

         <div className="text-center text-sm mt-6">
            <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-brand-600 hover:text-brand-500">
                    Sign in
                </Link>
            </p>
        </div>
      </div>
    </div>
  );
};

export default Signup;
