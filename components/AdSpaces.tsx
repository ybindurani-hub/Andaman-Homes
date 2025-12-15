
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Megaphone } from 'lucide-react';

// ============================================================================
//  GOOGLE ADMOB CONFIGURATION
// ============================================================================

const ENABLE_ADS = true;

// Ad Unit IDs (Test IDs)
const BANNER_TOP_ID =  "ca-app-pub-3940256099942544/6300978111";      
const BANNER_BOTTOM_ID =  "ca-app-pub-3940256099942544/6300978111";   
const INTERSTITIAL_ID =  "ca-app-pub-3940256099942544/8691691433";  
const NATIVE_ID = "ca-app-pub-3940256099942544/2247696110";

// --- HELPER: Trigger Android AdMob Bridge ---
const triggerAndroidAd = (type: 'banner' | 'interstitial' | 'native', unitId: string, position?: string) => {
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

// --- COMPONENT: Banner Ad ---
export const BannerAd: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (!ENABLE_ADS) return;
    // Attempt to call Android Bridge
    const success = triggerAndroidAd('banner', position === 'top' ? BANNER_TOP_ID : BANNER_BOTTOM_ID, position);
    if (success) setIsNative(true);
  }, [position]);

  if (!ENABLE_ADS) return null;

  // 1. Native App View (Invisible placeholder, ad overlays this area)
  if (isNative) {
      return <div className="h-0.5 bg-transparent w-full"></div>; 
  }

  // 2. Web/Browser View (Visual Placeholder)
  return (
    <div className={`w-full bg-gray-100 border-y border-gray-300 flex flex-col items-center justify-center py-3 ${position === 'bottom' ? 'fixed bottom-0 z-50 md:relative' : ''}`}>
         <span className="text-[10px] font-bold text-gray-400 border border-gray-300 px-1 rounded uppercase mb-1">AdMob Banner ({position})</span>
         <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
            <Megaphone size={12} /> Advertisement Space
         </span>
    </div>
  );
};

// --- COMPONENT: Native Ad (In-Feed) ---
export const NativeAd: React.FC = () => {
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    if (!ENABLE_ADS) return;
    const success = triggerAndroidAd('native', NATIVE_ID);
    if (success) setIsNative(true);
  }, []);

  if (!ENABLE_ADS) return null;

  if (isNative) {
      return <div id="native-ad-container" className="min-h-[1px]"></div>;
  }

  // Web Placeholder for Native Ad
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 my-2 shadow-sm">
        <div className="flex items-start gap-3">
             <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400">
                <span className="text-[10px]">Ad Image</span>
             </div>
             <div className="flex-1">
                 <div className="flex items-center gap-2 mb-1">
                     <span className="bg-yellow-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">Ad</span>
                     <span className="text-xs text-gray-500">Sponsored</span>
                 </div>
                 <h4 className="font-bold text-gray-800 text-sm">Relevant Property Service</h4>
                 <p className="text-xs text-gray-500 mt-1 line-clamp-2">Looking for movers and packers? Get the best deals today.</p>
                 <button className="mt-2 text-brand-600 text-xs font-bold uppercase">Learn More</button>
             </div>
        </div>
    </div>
  );
};

// --- COMPONENT: Interstitial Ad (Popup) ---
export const InterstitialAd: React.FC<{ isOpen: boolean, onClose: () => void, onFinish: () => void }> = ({ isOpen, onClose, onFinish }) => {
  const [isNative, setIsNative] = useState(false);
  const [showWebModal, setShowWebModal] = useState(false);

  useEffect(() => {
    if (isOpen && ENABLE_ADS) {
        const success = triggerAndroidAd('interstitial', INTERSTITIAL_ID);
        if (success) {
            setIsNative(true);
            // Simulate waiting for user to close ad in native app
            setTimeout(() => {
                onFinish();
            }, 2000);
        } else {
            setShowWebModal(true);
        }
    } else if (isOpen && !ENABLE_ADS) {
        onFinish();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Web Modal Fallback
  if (showWebModal) {
      return (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-xl w-full max-w-sm overflow-hidden relative shadow-2xl">
                <button 
                    onClick={() => { setShowWebModal(false); onFinish(); }} 
                    className="absolute top-2 right-2 text-gray-500 hover:text-black bg-white/80 rounded-full p-1 z-10"
                >
                    <X size={20} />
                </button>
                
                <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-40 flex items-center justify-center flex-col text-gray-400">
                    <ExternalLink size={32} className="mb-2 text-gray-500" />
                    <span className="font-bold text-sm text-gray-500">AdMob Interstitial</span>
                </div>
                
                <div className="p-6 text-center">
                    <h3 className="font-bold text-lg text-gray-900">Advertisement</h3>
                    <p className="text-gray-500 text-sm mt-2 mb-6">This is a full-screen ad placeholder. In the real app, a Google Ad would appear here.</p>
                    <button 
                        onClick={() => { setShowWebModal(false); onFinish(); }}
                        className="w-full bg-brand-600 text-white font-bold py-3 rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        Close Ad
                    </button>
                </div>
            </div>
        </div>
      );
  }

  return null;
};
