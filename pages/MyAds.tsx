
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { PlusCircle, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const MyAds: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMyProperties = async () => {
      if (!auth.currentUser) return;

      try {
        // Changed collection name to 'properties'
        const querySnapshot = await db.collection("properties")
            .where("ownerId", "==", auth.currentUser.uid)
            .get();
        
        const props: Property[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          props.push({ id: doc.id, ...data } as Property);
        });

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
        setError("Failed to load your ads.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyProperties();
  }, []);

  const handleDeleteProperty = async (id: string) => {
      if (window.confirm("Are you sure you want to delete this ad permanently?")) {
          try {
              // Changed collection name to 'properties'
              await db.collection("properties").doc(id).delete();
              setProperties(prev => prev.filter(p => p.id !== id));
          } catch (error) {
              console.error("Error deleting property:", error);
              alert("Failed to delete property. Please try again.");
          }
      }
  };

  if (loading) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <Loader2 className="animate-spin h-8 w-8 text-brand-600" />
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
            <Link to="/add-property" className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1">
                <PlusCircle size={16} /> Post New Ad
            </Link>
        </div>

        {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-center gap-2">
                <AlertCircle size={20} />
                {error}
            </div>
        )}

        {properties.length > 0 ? (
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
                className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700"
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
