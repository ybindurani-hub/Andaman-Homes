
import React, { useEffect, useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';

// ============================================================================
//  GOOGLE ADMOB CONFIGURATION (FOR ANDROID APP)
//  Paste your AdMob Unit Keys here.
// ============================================================================

// 1. Enable Ads
const ENABLE_ADS = true;

// 2. AdMob App ID (For reference, put this in your AndroidManifest.xml)
// TEST APP ID: ca-app-pub-3940256099942544~3347511713

// 3. Ad Unit IDs (Google AdMob Test IDs provided)
const BANNER_TOP_ID =  "ca-app-pub-3940256099942544/6300978111";      
const BANNER_BOTTOM_ID =  "ca-app-pub-3940256099942544/6300978111";   
const INTERSTITIAL_ID =  "ca-app-pub-3940256099942544/8691691433"; // Interstitial Video Test ID     
const NATIVE_ID = "ca-app-pub-3940256099942544/2247696110"; // Native Advanced Video / MREC

// ============================================================================

/**
 * Helper to communicate with Android Native Code
 * This assumes your Android WebView has:
 * webView.addJavascriptInterface(new WebAppInterface(this), "Android");
 */
const triggerNativeAd = (type: 'banner' | 'interstitial' | 'native', unitId: string, position?: string) => {
    try {
        // @ts-ignore
        if (window.Android && window.Android.showAdMob) {
            // @ts-ignore
            window.Android.showAdMob(type, unitId, position || "");
            console.log(`Called Native Android: ${type} - ${unitId}`);
            return true;
        }
    } catch (e) {
        console.error("AdMob Bridge Error", e);
    }
    return false;
};


// --- Banner Ad Component ---
export const BannerAd: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const [isNative, setIsNative] = useState(false);
  const unitId = position === 'top' ? BANNER_TOP_ID : BANNER_BOTTOM_ID;

  useEffect(() => {
      if (ENABLE_ADS) {
          // Attempt to load real ad via Native Bridge
          const success = triggerNativeAd('banner', unitId, position);
          setIsNative(success);
      }
  }, [position, unitId]);

  if (!ENABLE_ADS) return null;

  // If we are running in the actual Android App with the Bridge, 
  // we render a transparent spacer so the Native Ad Overlay doesn't hide content.
  if (isNative) {
      return <div style={{ width: '100%', height: '50px' }} />; 
  }

  // --- BROWSER PLACEHOLDER (TEST MODE) ---
  return (
    <div className={`w-full bg-gray-100 border-y border-gray-300 flex items-center justify-center ${position === 'bottom' ? 'mb-[65px] md:mb-0' : ''}`}>
      <div className="w-full max-w-[320px] h-[50px] bg-gray-300 flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">AdMob Banner</span>
        <span className="text-[8px] text-gray-400">{unitId}</span>
        <div className="absolute top-0 right-0 bg-yellow-400 text-[8px] px-1 font-bold text-black">TEST MODE</div>
      </div>
    </div>
  );
};


// --- Native / MREC Ad Component ---
// AdMob Native ads are complex in WebView. We usually use a "Medium Rectangle" (300x250) banner here.
export const NativeAd: React.FC = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
      if (ENABLE_ADS) {
          const success = triggerNativeAd('native', NATIVE_ID);
          setIsNative(success);
      }
  }, []);

  // Placeholder UI matching your app design
  const PlaceholderUI = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[250px] relative">
      <div className="bg-gray-100 flex-1 flex flex-col items-center justify-center p-4 text-center">
         <Info className="text-gray-300 h-10 w-10 mb-2" />
         <h4 className="font-bold text-gray-800 text-sm">AdMob Native / MREC</h4>
         <p className="text-xs text-gray-500 mt-1 break-all px-4">{NATIVE_ID}</p>
         <button className="mt-3 text-xs bg-blue-600 text-white py-2 px-4 rounded-md font-medium">
            Install App
         </button>
      </div>
      <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">AD</div>
    </div>
  );

  if (!ENABLE_ADS) return null;
  
  // If Native Bridge is active, we just reserve space. 
  // The Android app should inject a View here or overlay it.
  if (isNative) {
      return <div className="w-full h-[250px] bg-transparent" />; 
  }

  return <PlaceholderUI />;
};


// --- Interstitial Ad Component ---
export const InterstitialAd: React.FC<{ isOpen: boolean, onClose: () => void, onFinish: () => void }> = ({ isOpen, onClose, onFinish }) => {
  const [countdown, setCountdown] = useState(3);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (isOpen && ENABLE_ADS) {
        // Attempt to show Native Interstitial
        const success = triggerNativeAd('interstitial', INTERSTITIAL_ID);
        
        if (success) {
            setIsNative(true);
            // In a real app, you'd wait for a callback from Android like `onAdClosed()`
            // For now, we simulate a close after a few seconds or expect the user to close the native ad
            setTimeout(() => {
                onFinish();
            }, 1000); 
            return;
        }

        // Fallback to Web Simulation
        setCountdown(3);
        const interval = setInterval(() => {
            setCountdown((prev) => {
            if (prev <= 1) {
                clearInterval(interval);
                onFinish();
                return 0;
            }
            return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }
  }, [isOpen, onFinish]);

  if (!isOpen || !ENABLE_ADS || isNative) return null;

  // --- BROWSER SIMULATION (TEST MODE) ---
  return (
    <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
         <div className="absolute top-2 right-2 z-10">
             <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                 Closing in {countdown}s
             </div>
         </div>
         
         <div className="h-64 bg-gradient-to-tr from-blue-600 to-purple-600 flex flex-col items-center justify-center relative text-white p-6 text-center">
             <h2 className="text-3xl font-extrabold tracking-tight mb-2">AdMob</h2>
             <p className="text-sm font-medium opacity-90">Interstitial Ad Simulation</p>
             <p className="text-[10px] mt-4 opacity-75 font-mono bg-black/20 px-2 py-1 rounded break-all">
                {INTERSTITIAL_ID}
             </p>
         </div>
         
         <div className="p-4 text-center bg-gray-50">
             <button className="w-full bg-gray-200 text-gray-600 py-3 rounded-lg text-sm font-bold" disabled>
                 Close Ad
             </button>
         </div>
      </div>
      <p className="text-white/50 text-xs mt-4">Test Advertisement</p>
    </div>
  );
};
