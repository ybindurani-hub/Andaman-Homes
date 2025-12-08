
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, SlidersHorizontal } from 'lucide-react';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const querySnapshot = await db.collection("properties").orderBy("createdAt", "desc").get();
        const props: Property[] = [];
        const batch = db.batch();
        let hasExpiredUpdates = false;
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Property;
          
          // Parse createdAt safely (handle number or Timestamp)
          let createdAtMillis = 0;
          if (data.createdAt) {
             if (typeof data.createdAt === 'number') {
                 createdAtMillis = data.createdAt;
             } else if (data.createdAt.toMillis) {
                 createdAtMillis = data.createdAt.toMillis();
             }
          }

          // Check for Expiry
          if (data.status !== 'expired' && createdAtMillis > 0 && (now - createdAtMillis > THIRTY_DAYS_MS)) {
             const docRef = db.collection("properties").doc(doc.id);
             batch.update(docRef, { status: 'expired' });
             hasExpiredUpdates = true;
             // Don't add to list
          } else if (!data.status || data.status === 'active') {
             // Show only active properties (or legacy ones without status)
             props.push({ id: doc.id, ...data });
          }
        });

        if (hasExpiredUpdates) {
            await batch.commit();
        }

        setProperties(props);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero Search Section */}
      <div className="bg-brand-900 py-16 px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
          Find your dream home in Andaman
        </h1>
        <p className="text-brand-100 text-lg mb-8 max-w-2xl mx-auto">
          Directly connect with owners. Zero Brokerage. Verified Listings.
        </p>
        
        <div className="max-w-xl mx-auto relative">
          <div className="flex shadow-lg rounded-full bg-white overflow-hidden p-1.5">
            <div className="flex-1 flex items-center px-4">
              <Search className="text-gray-400 mr-2" size={20} />
              <input 
                type="text" 
                placeholder="Search by locality or landmark..."
                className="w-full text-gray-900 focus:outline-none py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button className="bg-brand-500 hover:bg-brand-600 text-white px-6 py-2 rounded-full font-medium transition-colors">
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            {searchTerm ? `Results for "${searchTerm}"` : "Fresh Recommendations"}
          </h2>
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium">
            <SlidersHorizontal size={18} /> Filters
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-xl h-96 shadow-sm animate-pulse border border-gray-100">
                <div className="h-48 bg-gray-200 w-full rounded-t-xl"></div>
                <div className="p-4 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                    <div className="h-10 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <h3 className="text-xl font-medium text-gray-900">No properties found</h3>
            <p className="text-gray-500 mt-2">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
