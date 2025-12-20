
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Heart, Loader2, Info, ArrowRight, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const Favorites: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const favRef = db.collection('users').doc(auth.currentUser.uid).collection('favorites');
    
    const unsubscribe = favRef.onSnapshot(async (snapshot) => {
      setLoading(true);
      try {
        const favIds = snapshot.docs.map(doc => doc.id);
        
        if (favIds.length === 0) {
          setProperties([]);
          setLoading(false);
          return;
        }

        // Fetch full property objects for each ID
        const propertyPromises = favIds.map(id => 
          db.collection('properties').doc(id).get()
        );
        
        const propertyDocs = await Promise.all(propertyPromises);
        
        // Filter: 1. Must exist, 2. Must be ACTIVE (not sold/booked)
        const favProperties: Property[] = propertyDocs
          .filter(doc => doc.exists)
          .map(doc => ({ id: doc.id, ...doc.data() } as Property))
          .filter(p => p.status === 'active');

        setProperties(favProperties);
      } catch (err) {
        console.error("Error fetching favorited properties:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-3 mb-8">
            <div className="bg-red-50 text-red-500 p-2.5 rounded-2xl shadow-sm">
                <Heart size={28} className="fill-current" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-gray-900 tracking-tight">Saved Properties</h1>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[0.2em]">Personal Shortlist</p>
            </div>
        </div>

        {properties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {properties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-[40px] border-2 border-dashed border-gray-100 px-6 max-w-lg mx-auto shadow-sm">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                <Heart size={48} />
            </div>
            <h3 className="text-xl font-black text-gray-900">Your list is empty</h3>
            <p className="text-gray-500 mt-2 mb-8 text-sm leading-relaxed font-medium">
              Saving properties helps you keep track of homes you love. Sold or rented items are automatically removed to keep your list clean.
            </p>
            <Link to="/" className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl shadow-brand-100 hover:bg-brand-700 transition-all hover:scale-105 active:scale-95 text-xs uppercase tracking-widest">
                Start Browsing <ArrowRight size={18} />
            </Link>
          </div>
        )}
      </div>

      <div className="mt-12 flex items-center justify-center gap-3 opacity-30 grayscale pointer-events-none">
          <ShieldCheck size={20} className="text-brand-600" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Verified Listings Only</span>
      </div>
    </div>
  );
};

export default Favorites;
