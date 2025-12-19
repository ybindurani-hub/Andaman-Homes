
import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, ChevronDown, ShieldAlert, Loader2, Info } from 'lucide-react';
import { NativeAd } from '../components/AdSpaces';

const Home: React.FC = () => {
  const [allProperties, setAllProperties] = useState<Property[]>([]);
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priceLow' | 'priceHigh'>('newest');

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        // Updated to use 'posts' collection per security rules
        const querySnapshot = await db.collection("posts").get();
            
        const props: Property[] = [];
        const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
        const now = Date.now();

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Property;
          
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
        setError(null);
      } catch (err: any) {
        console.error("Home: Fetch Error:", err);
        setError("Unable to load listings. Please check your internet connection.");
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

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
            const getT = (p: any) => p.createdAt?.toMillis?.() || p.createdAt || 0;
            return getT(b) - getT(a);
        });
    }

    setFilteredProperties(result);
  }, [searchTerm, filterType, sortBy, allProperties]);


  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-3 sticky top-0 z-40 md:relative md:top-auto shadow-sm">
         <div className="max-w-7xl mx-auto">
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Search area, city or property..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-md focus:outline-none focus:border-brand-500 text-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
         </div>
      </div>

      <div className="bg-white border-b border-gray-100 py-3 px-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-gray-300 text-gray-700 py-1.5 px-3 rounded-full text-xs font-medium focus:outline-none"
            >
                <option value="newest">Sort: Newest</option>
                <option value="priceLow">Price: Low-High</option>
                <option value="priceHigh">Price: High-Low</option>
            </select>

            <div className="flex bg-gray-100 p-0.5 rounded-full">
                {['all', 'rent', 'sale'].map((t) => (
                    <button 
                        key={t}
                        onClick={() => setFilterType(t as any)} 
                        className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition-all ${filterType === t ? 'bg-white text-brand-600 shadow-sm' : 'text-gray-500'}`}
                    >
                        {t}
                    </button>
                ))}
            </div>
            
            <span className="text-xs text-gray-400 font-bold ml-auto">{filteredProperties.length} Properties</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 mt-4">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <div key={n} className="bg-white rounded-lg h-48 shadow-sm animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : error ? (
            <div className="text-center py-20 bg-white rounded-xl border border-red-100 mx-2 shadow-sm">
                <div className="mx-auto w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <ShieldAlert size={24} />
                </div>
                <h3 className="text-lg font-bold text-gray-900">{error}</h3>
                <p className="text-gray-500 text-sm mt-1 px-10">Please check your connection or refresh the page.</p>
                <button onClick={() => window.location.reload()} className="mt-4 text-brand-600 text-sm font-bold underline">Refresh Page</button>
            </div>
        ) : filteredProperties.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
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
          <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300 mx-2">
            <Info className="mx-auto text-gray-300 mb-2" size={32} />
            <h3 className="text-lg font-medium text-gray-900">No properties found</h3>
            <button onClick={() => {setSearchTerm(''); setFilterType('all');}} className="text-brand-600 text-sm font-bold mt-2">Clear filters</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
