
import React, { useEffect, useState } from 'react';
import { db, auth } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, ChevronDown, ShieldAlert, Loader2, Info, RefreshCw } from 'lucide-react';
import { NativeAd } from '../components/AdSpaces';

const Home: React.FC = () => {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');

  const fetchProperties = async () => {
    // Only attempt if authenticated to satisfy Firestore rules
    if (!auth.currentUser) return;

    try {
      setLoading(true);
      setError(null);
      
      const querySnapshot = await db.collection("posts").get();
          
      const props: Property[] = [];
      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
      const now = Date.now();

      querySnapshot.forEach((doc) => {
        const data = doc.data() as Property;
        
        // Skip inactive or expired listings
        if (data.status && data.status !== 'active') return;

        let createdAtMillis = 0;
        if (data.createdAt) {
           if (typeof data.createdAt === 'number') createdAtMillis = data.createdAt;
           else if (data.createdAt.toMillis) createdAtMillis = data.createdAt.toMillis();
           else if (data.createdAt instanceof Date) createdAtMillis = data.createdAt.getTime();
        }

        const isExpired = createdAtMillis > 0 && (now - createdAtMillis > THIRTY_DAYS_MS);
        
        if (!isExpired) {
           props.push({ id: doc.id, ...data });
        }
      });

      setAllProperties(props);
    } catch (err: any) {
      console.error("Home Fetch Error:", err);
      if (err.message.includes("permission-denied")) {
          setError("Access Denied: Please sign out and sign in again.");
      } else {
          setError("Unable to sync with database. Please check your internet.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Complex Client-side Filtering
  useEffect(() => {
    let result = [...allProperties];

    if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        result = result.filter(p => 
            p.title.toLowerCase().includes(lowerTerm) || 
            p.address.toLowerCase().includes(lowerTerm)
        );
    }

    if (filterType !== 'all') {
        result = result.filter(p => p.category === filterType);
    }

    if (sortBy === 'priceLow') {
        result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'priceHigh') {
        result.sort((a, b) => b.price - a.price);
    } else {
        result.sort((a, b) => {
            const getT = (p: any) => {
                if (!p.createdAt) return 0;
                if (typeof p.createdAt === 'number') return p.createdAt;
                return p.createdAt.toMillis?.() || 0;
            };
            return getT(b) - getT(a);
        });
    }

    setFilteredProperties(result);
  }, [searchTerm, filterType, sortBy, allProperties]);


  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Search Header */}
      <div className="bg-white p-4 sticky top-0 z-40 shadow-sm border-b border-gray-100">
         <div className="max-w-7xl mx-auto">
            <div className="relative group">
                <input 
                    type="text" 
                    placeholder="Search area, project or BHK..."
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-50 transition-all text-sm font-medium"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            </div>
         </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white py-3 px-4 shadow-sm border-b border-gray-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex bg-gray-100 p-1 rounded-xl">
                {['all', 'rent', 'sale'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setFilterType(t as any)} 
                        className={`px-5 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${filterType === t ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-white border border-gray-200 text-gray-600 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-100"
                >
                    <option value="newest">Sort: Newest</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                </select>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-2xl h-60 shadow-sm animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : error ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-red-50 mx-auto max-w-lg shadow-sm">
                <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-2">{error}</h3>
                <p className="text-gray-500 text-sm px-10 mb-8">This might be due to a poor connection or outdated session.</p>
                <button 
                    onClick={fetchProperties}
                    className="inline-flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-brand-700 shadow-lg transition-all active:scale-95"
                >
                    <RefreshCw size={18} /> Retry Connection
                </button>
            </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProperties.map((property, index) => (
              <React.Fragment key={property.id}>
                  <PropertyCard property={property} />
                  {(index + 1) % 5 === 0 && (
                      <div className="col-span-1">
                          <NativeAd />
                      </div>
                  )}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-300">
            <div className="mx-auto w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-300">
                <Info size={40} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">No matching properties</h3>
            <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or search keywords.</p>
            <button onClick={() => {setSearchTerm(''); setFilterType('all');}} className="mt-6 text-brand-600 font-extrabold text-sm border-b-2 border-brand-200 hover:border-brand-600 transition-all">Reset All Filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
