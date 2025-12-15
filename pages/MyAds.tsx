
import React, { useEffect, useState, useCallback } from 'react';
import { db, auth } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { PlusCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyAds: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMyProperties = useCallback(async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setError('');

    try {
      // Fetch ads posted by current user
      const querySnapshot = await db.collection("properties")
          .where("ownerId", "==", auth.currentUser.uid)
          .get();
      
      const props: Property[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        props.push({ id: doc.id, ...data } as Property);
      });

      // Sort results client-side (Newest First)
      props.sort((a, b) => {
          const getMillis = (item: Property) => {
              if (!item.createdAt) return 0;
              if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
              if (item.createdAt instanceof Date) return item.createdAt.getTime();
              return 0;
          };
          return getMillis(b) - getMillis(a);
      });

      setProperties(props);
    } catch (err) {
      console.error("Error fetching my properties:", err);
      setError("Failed to load your ads. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyProperties();
  }, [fetchMyProperties]);

  const handleDeleteProperty = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this ad permanently?")) {
          try {
              await db.collection("properties").doc(id).delete();
              setProperties(prev => prev.filter(p => p.id !== id));
          } catch (error) {
              console.error("Error deleting property:", error);
              alert("Failed to delete property. Please try again.");
          }
      }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
                <button 
                    onClick={fetchMyProperties} 
                    className="p-2 bg-white rounded-full border border-gray-200 text-gray-500 hover:text-brand-600 hover:border-brand-300 transition-all shadow-sm"
                    title="Refresh List"
                >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>
            <Link to="/add-property" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1 bg-white px-3 py-2 rounded-lg border border-brand-100 shadow-sm">
                <PlusCircle size={16} /> <span className="hidden sm:inline">Post New Ad</span><span className="sm:hidden">Post</span>
            </Link>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {loading ? (
             <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                 {[1,2,3,4].map(n => (
                     <div key={n} className="bg-white h-48 rounded-lg animate-pulse border border-gray-200"></div>
                 ))}
             </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {properties.map((property) => (
              <PropertyCard 
                key={property.id} 
                property={property} 
                onDelete={() => handleDeleteProperty(property.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mb-4">
                <PlusCircle className="text-brand-500" size={32} />
            </div>
            <h3 className="text-lg font-medium text-gray-900">You haven't posted any ads yet</h3>
            <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">List your property for free and reach thousands of genuine tenants/buyers.</p>
            <Link 
                to="/add-property" 
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 shadow-lg shadow-brand-500/30"
            >
                Post Your First Ad
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAds;
