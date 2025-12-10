
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, Info } from 'lucide-react';

export const BannerAd: React.FC<{ position: 'top' | 'bottom' }> = ({ position }) => {
  return (
    <div className={`w-full bg-gray-50 border-y border-gray-200 flex items-center justify-center py-2 ${position === 'bottom' ? 'mb-[65px] md:mb-0' : ''}`}>
      <div className="max-w-7xl w-full px-4 flex justify-center">
        <div className="bg-gray-200 w-full md:w-[728px] h-[50px] md:h-[90px] flex items-center justify-center relative rounded overflow-hidden">
            <span className="text-[10px] text-gray-400 absolute top-1 right-1 uppercase tracking-tighter">Ad</span>
            <div className="text-center">
                <span className="text-gray-500 font-bold text-sm md:text-lg">Google Ad Banner</span>
                <p className="text-[10px] text-gray-400 hidden md:block">Best Real Estate Deals Here</p>
            </div>
        </div>
      </div>
    </div>
  );
};

export const NativeAd: React.FC = () => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm flex flex-col h-full min-h-[220px]">
      <div className="bg-gray-100 aspect-video flex items-center justify-center relative">
         <div className="absolute top-2 left-2 bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm uppercase">Ad</div>
         <Info className="text-gray-300 h-8 w-8" />
      </div>
      <div className="p-3 flex-1 flex flex-col justify-between">
         <div>
             <h4 className="font-bold text-gray-800 text-sm line-clamp-2">Home Loans @ 8.5% Interest</h4>
             <p className="text-xs text-gray-500 mt-1 line-clamp-2">Get instant approval from top banks. minimal documentation required.</p>
         </div>
         <button className="mt-3 text-xs bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md w-full font-medium flex items-center justify-center gap-1 transition-colors">
            Apply Now <ExternalLink size={10} />
         </button>
      </div>
    </div>
  );
};

export const InterstitialAd: React.FC<{ isOpen: boolean, onClose: () => void, onFinish: () => void }> = ({ isOpen, onClose, onFinish }) => {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (isOpen) {
      setCountdown(3); // Reset
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-xl overflow-hidden shadow-2xl relative animate-in zoom-in duration-200">
         <div className="absolute top-2 right-2 z-10">
             <div className="bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                 Ads closing in {countdown}s
             </div>
         </div>
         
         <div className="h-64 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative">
             <h2 className="text-white text-4xl font-extrabold tracking-tight">SALE</h2>
             <p className="absolute bottom-4 text-white/80 text-sm font-medium">Sponsored Content</p>
         </div>
         
         <div className="p-6 text-center">
             <h3 className="font-bold text-xl text-gray-900">Premium Furniture</h3>
             <p className="text-gray-600 text-sm mt-2">Rent beds, sofas, and dining tables at 50% OFF. Free delivery & setup.</p>
             <div className="mt-6 flex gap-2">
                 <button className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-sm font-medium" disabled>Skip</button>
                 <button className="flex-1 bg-brand-600 text-white py-2 rounded-lg text-sm font-medium">View Offer</button>
             </div>
         </div>
      </div>
      <p className="text-white/50 text-xs mt-4">Advertisement</p>
    </div>
  );
};
