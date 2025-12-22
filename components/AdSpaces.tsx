
import React, { useEffect, useState } from 'react';
import { Info, ExternalLink } from 'lucide-react';

// ============================================================================
//  GOOGLE ADMOB CONFIGURATION
// ============================================================================

const ENABLE_ADS = true;

// App ID: ca-app-pub-3417924375758384~9300491045
const BANNER_TOP_ID = "ca-app-pub-3417924375758384/9930868826";      
const BANNER_BOTTOM_ID = "ca-app-pub-3417924375758384/5441137089";   
const INTERSTITIAL_ID = "ca-app-pub-3417924375758384/7963358645";     
const NATIVE_ID = "ca-app-pub-3417924375758384/5141576573"; 

// ============================================================================

const triggerNativeAd = (type: 'banner' | 'interstitial' | 'native', unitId: string, position?: string) => {
    try {
        // @ts-ignore
        if (window.Android && window.Android.showAdMob) {
            // @ts-ignore
            window.Android.showAdMob(type, unitId, position || "");
            return true;
        }
    } catch (e) {
        console.error("AdMob Bridge Error", e);
    }
    return false;
};

export const BannerAd: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const [isNative, setIsNative] = useState(false);
  const unitId = position === 'top' ? BANNER_TOP_ID : BANNER_BOTTOM_ID;

  useEffect(() => {
      if (ENABLE_ADS) {
          const success = triggerNativeAd('banner', unitId, position);
          setIsNative(success);
      }
  }, [position, unitId]);

  if (!ENABLE_ADS) return null;

  if (isNative) {
      return <div style={{ width: '100%', height: '50px' }} />; 
  }

  return (
    <div className={`w-full bg-gray-50 border-y border-gray-200 flex items-center justify-center ${position === 'bottom' ? 'mb-[65px] md:mb-0' : ''}`}>
      <div className="w-full max-w-[320px] h-[50px] bg-gray-200 flex flex-col items-center justify-center relative overflow-hidden">
        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Sponsored</span>
      </div>
    </div>
  );
};

export const NativeAd: React.FC = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
      if (ENABLE_ADS) {
          const success = triggerNativeAd('native', NATIVE_ID);
          setIsNative(success);
      }
  }, []);

  if (!ENABLE_ADS) return null;
  
  if (isNative) {
      return <div className="w-full h-[250px] bg-transparent" />; 
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[200px] relative">
      <div className="bg-gray-50 flex-1 flex flex-col items-center justify-center p-4 text-center">
         <Info className="text-gray-200 h-8 w-8 mb-2" />
         <h4 className="font-bold text-gray-400 text-[10px] uppercase tracking-widest">Sponsored Ad</h4>
      </div>
      <div className="absolute top-2 left-2 bg-brand-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded shadow-sm">AD</div>
    </div>
  );
};

export const InterstitialAd: React.FC<{ isOpen: boolean, onClose: () => void, onFinish: () => void }> = ({ isOpen, onClose, onFinish }) => {
  const [countdown, setCountdown] = useState(3);
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (isOpen && ENABLE_ADS) {
        const success = triggerNativeAd('interstitial', INTERSTITIAL_ID);
        if (success) {
            setIsNative(true);
            setTimeout(() => onFinish(), 1000); 
            return;
        }
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

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-xs rounded-3xl overflow-hidden shadow-2xl relative">
         <div className="p-8 text-center">
             <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-600 font-black">Ad</div>
             <h2 className="text-xl font-black mb-2">Andaman Homes</h2>
             <p className="text-sm text-gray-500 mb-6">Experience zero brokerage property search.</p>
             <div className="text-xs font-bold text-gray-400 uppercase">Closing in {countdown}s</div>
         </div>
      </div>
    </div>
  );
};
