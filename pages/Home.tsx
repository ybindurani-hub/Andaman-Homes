
import React, { useEffect, useState, useCallback } from 'react';
import { db } from '../firebase';
import { Property } from '../types';
import PropertyCard from '../components/PropertyCard';
import { Search, Loader2, Info, RefreshCw, Plus, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NativeAd } from '../components/AdSpaces';

const Home: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [filtered, setFiltered] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rent' | 'sale'>('all');

  const fetchProperties = useCallback(async () => {
    console.group("🏠 Home Diagnostics");
    try {
      setLoading(true);
      setError(null);
      
      console.log("1. Attempting fetch from collection: 'properties'");
      const snapshot = await db.collection("properties").get();
      
      console.log(`2. Success! Found ${snapshot.size} total documents.`);
      
      const props: Property[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as Property;
        
        // BE LENIENT: Show if status is missing, 'active', or anything except 'deleted'/'expired'
        const isVisible = !data.status || data.status === 'active' || data.status === 'sold' || data.status === 'rented';
        
        if (isVisible) {
          props.push({ id: doc.id, ...data });
        }
      });

      console.log(`3. After filtering for active/visible: ${props.length} items.`);

      // Robust Sort: Handle missing createdAt
      props.sort((a, b) => {
        const getTime = (p: any) => {
            if (!p.createdAt) return 0;
            if (p.createdAt.toMillis) return p.createdAt.toMillis();
            if (p.createdAt instanceof Date) return p.createdAt.getTime();
            if (typeof p.createdAt === 'number') return p.createdAt;
            return 0;
        };
        return getTime(b) - getTime(a);
      });

      setProperties(props);
      if (snapshot.size === 0) {
          console.warn("⚠️ COLLECTION 'properties' IS EMPTY. Please check your Firebase Console.");
      }
    } catch (err: any) {
      console.error("❌ Firestore Fetch Error:", err);
      if (err.message?.includes("permission-denied")) {
          setError("Permission Denied: Please check if Firestore rules allow public read on 'properties'.");
      } else {
          setError(`Database Error: ${err.message || "Unknown connection error"}`);
      }
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    let result = [...properties];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        (p.title?.toLowerCase().includes(term)) || 
        (p.address?.toLowerCase().includes(term))
      );
    }
    if (filterType !== 'all') {
      result = result.filter(p => p.category === filterType);
    }
    setFiltered(result);
  }, [searchTerm, filterType, properties]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Search Header */}
      <div className="bg-white p-4 sticky top-0 z-40 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto flex gap-3">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-brand-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search Port Blair, Havelock, etc..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm outline-none focus:border-brand-500 focus:bg-white transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="bg-white px-4 py-3 border-b border-gray-100 overflow-x-auto no-scrollbar">
        <div className="max-w-7xl mx-auto flex gap-2">
          {['all', 'rent', 'sale'].map((t) => (
            <button 
              key={t}
              onClick={() => setFilterType(t as any)}
              className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                filterType === t ? 'bg-brand-600 text-white shadow-lg scale-105' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
              <div key={n} className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="bg-gray-200 animate-pulse h-40 rounded-xl mb-3" />
                 <div className="bg-gray-200 animate-pulse h-4 w-3/4 rounded mb-2" />
                 <div className="bg-gray-200 animate-pulse h-3 w-1/2 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-red-50 shadow-xl px-6 max-w-md mx-auto">
            <div className="bg-red-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShieldAlert className="text-red-500" size={40} />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Sync Error</h3>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">{error}</p>
            <button 
                onClick={fetchProperties} 
                className="flex items-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 mx-auto"
            >
                <RefreshCw size={20} /> Retry Now
            </button>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filtered.map((p, i) => (
              <React.Fragment key={p.id}>
                <PropertyCard property={p} />
                {(i + 1) % 6 === 0 && <NativeAd />}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-dashed border-4 border-gray-100 px-6 max-w-2xl mx-auto">
            <div className="bg-gray-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Info className="text-gray-300" size={48} />
            </div>
            <h3 className="text-2xl font-black text-gray-900">No properties found</h3>
            <p className="text-gray-500 mt-2 mb-8 text-sm">We checked the 'properties' collection and found no matching active listings.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button onClick={fetchProperties} className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-6 py-3 rounded-2xl font-bold hover:bg-gray-200">
                    <RefreshCw size={18} /> Refresh List
                </button>
                <Link to="/add-property" className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700">
                    <Plus size={20} /> Post First Listing
                </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;
