import React from 'react';
import { Link } from 'react-router-dom';
import { Property } from '../types';
import { MapPin, BedDouble, Bath, Square, ArrowRight } from 'lucide-react';

interface PropertyCardProps {
  property: Property;
}

const PropertyCard: React.FC<PropertyCardProps> = ({ property }) => {
  // Use first image from array if available, otherwise fallback to legacy imageUrl
  const displayImage = property.imageUrls && property.imageUrls.length > 0 
    ? property.imageUrls[0] 
    : property.imageUrl;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-300 group">
      <div className="relative h-48 overflow-hidden bg-gray-200">
        <img 
          src={displayImage} 
          alt={property.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className={`absolute top-3 left-3 text-white text-xs font-bold px-2 py-1 rounded shadow-sm ${property.type === 'sale' ? 'bg-blue-600' : 'bg-brand-500'}`}>
          FOR {property.type ? property.type.toUpperCase() : 'RENT'}
        </div>
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
          <h3 className="text-white font-semibold text-lg truncate shadow-black drop-shadow-md">{property.title}</h3>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin size={16} className="mr-1 text-gray-400" />
            <span className="truncate max-w-[180px]">{property.address}</span>
          </div>
          <span className="text-brand-600 font-bold text-lg">
            ₹{property.price.toLocaleString('en-IN')}<span className="text-xs text-gray-500 font-normal">{property.type === 'rent' ? '/mo' : ''}</span>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 text-sm text-gray-600">
            <div className="flex flex-col items-center">
                <div className="flex items-center gap-1 font-semibold text-gray-900">
                    <BedDouble size={16} /> {property.bedrooms}
                </div>
                <span className="text-xs">Beds</span>
            </div>
            <div className="flex flex-col items-center border-l border-gray-100">
                <div className="flex items-center gap-1 font-semibold text-gray-900">
                    <Bath size={16} /> {property.bathrooms}
                </div>
                <span className="text-xs">Baths</span>
            </div>
            <div className="flex flex-col items-center border-l border-gray-100">
                <div className="flex items-center gap-1 font-semibold text-gray-900">
                    <Square size={16} /> {property.area}
                </div>
                <span className="text-xs">Sqft</span>
            </div>
        </div>

        <div className="mt-4">
           <Link 
            to={`/property/${property.id}`}
            className="w-full inline-flex items-center justify-center px-4 py-2 border border-brand-500 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50 transition-colors"
          >
            View Details <ArrowRight size={16} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;