
import React, { useEffect, useState } from 'react';
import { Info } from 'lucide-react';

// ============================================================================
//  GOOGLE ADMOB CONFIGURATION (USER SPECIFIED KEYS)
// ============================================================================

const ENABLE_ADS = true;
const DEBUG_MODE = true; 

// App ID: ca-app-pub-3417924375758384~9300491045
const BANNER_TOP_ID = "ca-app-pub-3417924375758384/7963358645";      
const BANNER_BOTTOM_ID = "ca-app-pub-3417924375758384/9930868826";   
const INTERSTITIAL_ID = "ca-app-pub-3417924375758384/5441137089";     
const NATIVE_ID = "ca-app-pub-3417924375758384/5141576573"; 

// ============================================================================

const triggerNativeAd = (type: 'banner' | 'interstitial' | 'native', unitId: string, position?: string) => {
    if (DEBUG_MODE) console.log(`[AdMob Bridge] Requesting ${type} | ID: ${unitId} | Pos: ${position || 'N/A'}`);
    
    try {
        // @ts-ignore - This interface must be injected by your Android WebView code
        if (window.Android && typeof window.Android.showAdMob === 'function') {
            // @ts-ignore
            window.Android.showAdMob(type, unitId, position || "");
            return true;
        } else if (DEBUG_MODE) {
            console.warn(`[AdMob Bridge] 'window.Android.showAdMob' not found. This is expected in a browser. Only works in your Android APK.`);
        }
    } catch (e) {
        console.error("[AdMob Bridge] Error during bridge call:", e);
    }
    return false;
};

export const BannerAd: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const [isNativeHandled, setIsNativeHandled] = useState(false);
  const unitId = position === 'top' ? BANNER_TOP_ID : BANNER_BOTTOM_ID;

  useEffect(() => {
      if (ENABLE_ADS) {
          const success = triggerNativeAd('banner', unitId, position);
          setIsNativeHandled(success);
      }
  }, [position, unitId]);

  if (!ENABLE_ADS) return null;

  // In the Android App, we return an empty transparent div and the Native code overlays the ad
  if (isNativeHandled) {
      return <div className="w-full bg-transparent" style={{ height: '50px' }} />; 
  }

  // Web Preview: Show a visible placeholder so you can see where the ad will be
  return (
    <div className={`w-full bg-gray-100 border-y border-gray-200 flex items-center justify-center ${position === 'bottom' ? 'mb-[65px] md:mb-0' : ''}`}>
      <div className="w-full max-w-[320px] h-[50px] bg-brand-50 flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[10px] font-black text-brand-400 uppercase tracking-widest">Google AdMob Banner ({position})</span>
      </div>
    </div>
  );
};

export const NativeAd: React.FC = () => {
  const [isNativeHandled, setIsNativeHandled] = useState(false);

  useEffect(() => {
      if (ENABLE_ADS) {
          const success = triggerNativeAd('native', NATIVE_ID);
          setIsNativeHandled(success);
      }
  }, []);

  if (!ENABLE_ADS) return null;
  
  if (isNativeHandled) {
      return <div className="w-full h-[250px] bg-transparent" />; 
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[200px] relative">
      <div className="bg-gray-50 flex-1 flex flex-col items-center justify-center p-4 text-center">
         <Info className="text-brand-200 h-8 w-8 mb-2" />
         <h4 className="font-bold text-brand-300 text-[10px] uppercase tracking-widest">Google AdMob Native Ad</h4>
      </div>
      <div className="absolute top-2 left-2 bg-brand-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">SPONSORED</div>
    </div>
  );
};

export const InterstitialAd: React.FC<{ isOpen: boolean, onFinish: () => void }> = ({ isOpen, onFinish }) => {
  const [countdown, setCountdown] = useState(3);
  const [isNativeHandled, setIsNativeHandled] = useState(false);

  useEffect(() => {
    if (isOpen && ENABLE_ADS) {
        const success = triggerNativeAd('interstitial', INTERSTITIAL_ID);
        if (success) {
            setIsNativeHandled(true);
            setTimeout(() => onFinish(), 1000); 
            return;
        }
        
        // Simulation for Web Testing
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

  if (!isOpen || !ENABLE_ADS || isNativeHandled) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
         <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600 font-black">AD</div>
         <h2 className="text-xl font-black mb-2">Google AdMob</h2>
         <p className="text-sm text-gray-500 mb-6">Interstitial Ad Simulation</p>
         <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">Closing in {countdown}s...</div>
      </div>
    </div>
  );
};
