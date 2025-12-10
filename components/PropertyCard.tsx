
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { MapPin, Heart } from 'lucide-react';
import { InterstitialAd } from './AdSpaces';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  const navigate = useNavigate();
  const [showAd, setShowAd] = useState(false);

  const displayImage = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls[0] 
    : property.imageUrl;

  // Helper to format date relative
  const formatDate = (timestamp: any) => {
      if (!timestamp) return '';
      const date = typeof timestamp.toDate === 'function' ? timestamp.toDate() : new Date(timestamp);
      const now = new Date();
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // 50% chance to show an interstitial ad
    if (Math.random() > 0.5) {
        setShowAd(true);
    } else {
        navigate(`/property/${property.id}`);
    }
  };

  const handleAdFinish = () => {
      setShowAd(false);
      navigate(`/property/${property.id}`);
  };

  return (
    <>
      <InterstitialAd isOpen={showAd} onClose={() => setShowAd(false)} onFinish={handleAdFinish} />
      
      <div 
        onClick={handleClick}
        className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm active:scale-[0.98] transition-transform flex flex-col h-full cursor-pointer relative"
      >
          {/* Image Section - Compact Height */}
          <div className="relative h-32 bg-gray-100">
              <img 
                  src={displayImage} 
                  alt={property.title} 
                  className="w-full h-full object-cover"
                  loading="lazy"
              />
              
              {/* Heart Icon - Smaller */}
              <button className="absolute top-1.5 right-1.5 p-1 bg-white/90 rounded-full text-gray-800 hover:text-red-500 transition-colors shadow-sm z-10" onClick={(e) => e.stopPropagation()}>
                  <Heart size={14} />
              </button>

              {/* Type Badge - Smaller */}
              {property.type === 'rent' && (
                  <div className="absolute bottom-1 left-1 bg-yellow-400 text-black text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm uppercase tracking-wide">
                      Rent
                  </div>
              )}
          </div>
      
          {/* Content Section - Compact Padding & Text */}
          <div className="p-2 flex flex-col flex-1 justify-between">
              <div>
                  <h3 className="text-base font-bold text-gray-900 leading-none">
                      ₹ {property.price.toLocaleString('en-IN')}
                  </h3>
                  <p className="text-gray-700 text-xs mt-1 line-clamp-1 leading-snug">
                      {property.title}
                  </p>
                  <div className="text-[10px] text-gray-500 mt-0.5 flex items-center gap-1">
                       <span>{property.bedrooms} BHK • {property.area} ft²</span>
                  </div>
              </div>

              <div className="flex justify-between items-end mt-2 text-[9px] text-gray-400 uppercase tracking-wide font-medium">
                  <div className="flex items-center gap-0.5 max-w-[70%]">
                      <MapPin size={9} />
                      <span className="truncate">{property.address.split(',')[0]}</span>
                  </div>
                  <span>{formatDate(property.createdAt)}</span>
              </div>
          </div>
      </div>
    </>
  );
};

export default PropertyCard;
