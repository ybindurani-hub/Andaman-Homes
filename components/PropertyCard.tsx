
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property } from '../types';
import { MapPin, Heart, ImageOff, Trash2 } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
  onDelete?: () => void;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property, onDelete }) => {
  const navigate = useNavigate();
  const [imgSrc, setImgSrc] = useState(
    property.imageUrls && property.imageUrls.length > 0 ? property.imageUrls[0] : property.imageUrl
  );
  const [imgError, setImgError] = useState(false);

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
    navigate(`/property/${property.id}`);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onDelete) onDelete();
  };

  const sqMeters = Math.round(property.area * 0.092903);

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm active:scale-[0.98] transition-transform flex flex-col h-full cursor-pointer relative group"
    >
        <div className="relative h-40 bg-gray-100 flex items-center justify-center overflow-hidden">
            {!imgError ? (
                <img 
                    src={imgSrc} 
                    alt={property.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div className="flex flex-col items-center text-gray-400">
                    <ImageOff size={24} />
                    <span className="text-[10px] mt-1 uppercase font-bold tracking-tighter">No Image</span>
                </div>
            )}
            
            {onDelete && (
                <button 
                  className="absolute top-2 left-2 p-1.5 bg-white/90 rounded-full text-red-500 hover:bg-red-50 transition-colors shadow-sm z-10"
                  onClick={handleDeleteClick}
                >
                    <Trash2 size={16} />
                </button>
            )}

            <button className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full text-gray-800 hover:text-red-500 transition-colors shadow-sm z-10" onClick={(e) => e.stopPropagation()}>
                <Heart size={16} />
            </button>

            <div className={`absolute bottom-2 left-2 text-[8px] font-black px-2 py-0.5 rounded shadow-sm uppercase tracking-widest ${property.category === 'sale' ? 'bg-brand-600 text-white' : 'bg-yellow-400 text-black'}`}>
                {property.category === 'sale' ? 'For Sale' : 'For Rent'}
            </div>
        </div>
    
        <div className="p-3 flex flex-col flex-1 justify-between">
            <div>
                <h3 className="text-lg font-black text-gray-900 leading-none">
                    ₹ {property.price.toLocaleString('en-IN')}
                </h3>
                <p className="text-gray-600 text-xs mt-1.5 line-clamp-1 font-medium">
                    {property.title}
                </p>
                <div className="text-[10px] text-gray-400 mt-2 flex flex-wrap items-center gap-2 font-bold uppercase tracking-wider">
                     <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{property.bedrooms} BHK</span>
                     <span className="bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100">{property.area} Sq.Ft</span>
                </div>
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-50 text-[9px] text-gray-400 uppercase tracking-widest font-black">
                <div className="flex items-center gap-1 max-w-[70%]">
                    <MapPin size={10} className="text-brand-500" />
                    <span className="truncate">{property.address.split(',')[0]}</span>
                </div>
                <span>{formatDate(property.createdAt)}</span>
            </div>
        </div>
    </div>
  );
};

export default PropertyCard;
