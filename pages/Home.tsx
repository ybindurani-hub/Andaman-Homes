
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, ChevronDown } from 'lucide-react';
import { NativeAd } from '../components/AdSpaces';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        // Fetch all active properties
        // We remove .orderBy("createdAt", "desc") here to avoid needing a composite index
        // if we were to combine it with other filters in the future.
        // We will sort client-side.
        const querySnapshot = await db.collection("properties").get();
        
        const props: Property[] = [];
        const batch = db.batch();
        let hasExpiredUpdates = false;
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Property;
          
          let createdAtMillis = 0;
          if (data.createdAt) {
             if (typeof data.createdAt === 'number') {
                 createdAtMillis = data.createdAt;
             } else if (data.createdAt.toMillis) {
                 createdAtMillis = data.createdAt.toMillis();
             } else if (data.createdAt instanceof Date) {
                 createdAtMillis = data.createdAt.getTime();
             }
          }

          // Check expiry
          if (data.status !== 'expired' && createdAtMillis > 0 && (now - createdAtMillis > THIRTY_DAYS_MS)) {
             const docRef = db.collection("properties").doc(doc.id);
             batch.update(docRef, { status: 'expired' });
             hasExpiredUpdates = true;
          } else if (!data.status || data.status === 'active') {
             props.push({ id: doc.id, ...data });
          }
        });

        if (hasExpiredUpdates) {
            await batch.commit();
        }

        // Sort by Newest initially (Client-side)
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
        setFilteredProperties(props);
      } catch (error) {
        console.error("Error fetching properties:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Apply filters whenever dependencies change
  useEffect(() => {
    let result = [...properties];

    // 1. Search
    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(p => 
            p.title.toLowerCase().includes(lowerTerm) || 
            p.address.toLowerCase().includes(lowerTerm)
        );
    }

    // 2. Type Filter
    if (filterType !== 'all') {
        result = result.filter(p => p.category === filterType);
    }

    // 3. Sorting
    if (sortBy === 'priceLow') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
        result.sort((a, b) => b.price - a.price);
    } else {
         // Newest
         result.sort((a, b) => {
             const getMillis = (item: Property) => {
                if (!item.createdAt) return 0;
                if (typeof item.createdAt.toMillis === 'function') return item.createdAt.toMillis();
                return 0;
            };
            return getMillis(b) - getMillis(a);
        });
    }

    setFilteredProperties(result);
  }, [searchTerm, filterType, sortBy, properties]);


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Search Header */}
      <div className="bg-white p-3 sticky top-0 z-40 md:relative md:top-auto shadow-sm">
         <div className="max-w-7xl mx-auto">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search properties, areas..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-md focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 text-sm shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
         </div>
      </div>

      {/* Filters ScrollView */}
      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            
            {/* Filter: Sort */}
            <div className="relative inline-block">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="appearance-none bg-white border border-gray-300 text-gray-700 py-1.5 pl-3 pr-8 rounded-full text-xs font-medium focus:outline-none focus:border-brand-500"
                >
                    <option value="newest">Sort By: Newest</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                </select>
                <ChevronDown className="absolute right-2 top-2 text-gray-400 pointer-events-none" size={12} />
            </div>

            {/* Filter: Type */}
            <button 
                onClick={() => setFilterType('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterType === 'all' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
                All
            </button>
            <button 
                onClick={() => setFilterType('rent')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterType === 'rent' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
                Rent
            </button>
            <button 
                onClick={() => setFilterType('sale')}
                className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filterType === 'sale' ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-700'}`}
            >
                Buy
            </button>

            {/* Visual Divider */}
            <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

            <span className="text-xs text-gray-400 uppercase font-bold tracking-wider">
                {filteredProperties.length} Ads
            </span>
        </div>
      </div>

      {/* Main Grid Content */}
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-2">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="bg-white rounded-lg h-48 shadow-sm animate-pulse border border-gray-100">
                <div className="h-28 bg-gray-200 w-full rounded-t-lg"></div>
                <div className="p-2 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {filteredProperties.map((property, index) => (
              <React.Fragment key={property.id}>
                  <PropertyCard property={property} />
                  {/* Inject Native Ad after every 4th property */}
                  {(index + 1) % 4 === 0 && (
                      <div className="col-span-1">
                          <NativeAd />
                      </div>
                  )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 mx-4">
            <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
            <p className="text-gray-500 text-sm mt-1">Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
