
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Property } from '../types';
import { 
  MapPin, 
  BedDouble, 
  Bath, 
  Ruler, 
  Heart, 
  ArrowLeft, 
  Phone, 
  Tag, 
  MessageSquare, 
  ImageOff, 
  ShieldAlert, 
  Trash2, 
  Loader2,
  Share2,
  Check
} from 'lucide-react';
import { InterstitialAd } from '../components/AdSpaces';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState('');
  const [isOwner, setIsOwner] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const doc = await db.collection("properties").doc(id).get();
        if (doc.exists) {
          const data = { id: doc.id, ...doc.data() } as Property;
          setProperty(data);
          if (auth.currentUser && data.ownerId === auth.currentUser.uid) setIsOwner(true);
          const images = data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : [data.imageUrl];
          setActiveImage(images[0]);
          
          // Trigger Ad after content loads
          setTimeout(() => setShowAd(true), 1500);
        } else {
          setError("Listing not found.");
        }
      } catch (err) {
        setError("Error loading property details.");
      } finally {
        setLoading(false);
      }
    };
    fetchProperty();
  }, [id]);

  useEffect(() => {
    if (!auth.currentUser || !id) return;
    const favRef = db.collection('users').doc(auth.currentUser.uid).collection('favorites').doc(id);
    const unsubscribe = favRef.onSnapshot(doc => {
      setIsFavorited(doc.exists);
    });
    return () => unsubscribe();
  }, [id]);

  const toggleFavorite = async () => {
    if (!auth.currentUser) return navigate('/login');
    if (!id) return;
    
    const favRef = db.collection('users').doc(auth.currentUser.uid).collection('favorites').doc(id);
    
    try {
      if (isFavorited) {
        await favRef.delete();
      } else {
        await favRef.set({
          propertyId: id,
          savedAt: new Date().getTime()
        });
      }
    } catch (err) {
      console.error("Error updating favorites:", err);
    }
  };

  const handleShare = async () => {
    if (!property) return;
    const shareData = {
      title: property.title,
      text: `Check out this property on Andaman Homes: ${property.title} in ${property.address}`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleStartChat = async () => {
    if (!auth.currentUser) return navigate('/login');
    if (!property) return;
    if (property.ownerId === auth.currentUser.uid) return alert("You posted this ad.");

    const chatId = [auth.currentUser.uid, property.ownerId].sort().join('_');
    const chatRef = db.collection('chats').doc(chatId);
    
    try {
        const doc = await chatRef.get();
        if (!doc.exists) {
            await chatRef.set({
                participants: [auth.currentUser.uid, property.ownerId].sort(),
                propertyId: property.id,
                propertyTitle: property.title,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastMessage: '',
                lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        navigate(`/chat/${chatId}`);
    } catch (err) {
        alert("Unable to start chat. Check your internet.");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-brand-500" size={40} /></div>;
  if (error || !property) return (
      <div className="h-screen flex flex-col items-center justify-center p-6 text-center">
          <ShieldAlert className="text-red-500 mb-4" size={48} />
          <h1 className="text-xl font-bold mb-4">{error || "Property not found"}</h1>
          <Link to="/" className="text-brand-600 font-bold">Back to Home</Link>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <InterstitialAd isOpen={showAd} onFinish={() => setShowAd(false)} />
      
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
            <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 font-bold uppercase text-xs tracking-widest transition-colors hover:text-gray-900"><ArrowLeft size={16} className="mr-1" /> Back</button>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleShare}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${copied ? 'bg-green-50 border-green-100 text-green-600' : 'bg-white border-gray-200 text-gray-500 hover:border-brand-200 hover:text-brand-600'}`}
                >
                    {copied ? <Check size={16} /> : <Share2 size={16} />}
                    {copied ? 'Link Copied' : 'Share'}
                </button>
                {!isOwner && (
                    <button 
                      onClick={toggleFavorite}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-wider transition-all border ${isFavorited ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-gray-200 text-gray-500 hover:border-red-200 hover:text-red-500'}`}
                    >
                        <Heart size={16} className={isFavorited ? 'fill-current' : ''} />
                        {isFavorited ? 'Saved' : 'Save'}
                    </button>
                )}
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="aspect-video bg-black rounded-3xl overflow-hidden relative shadow-lg">
                     <img src={activeImage} className="w-full h-full object-contain" />
                     {property.status && property.status !== 'active' && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                             <span className="bg-red-600 text-white px-8 py-2 rounded-full font-black uppercase text-xl transform -rotate-12">{property.status}</span>
                         </div>
                     )}
                </div>
                {property.imageUrls && property.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {property.imageUrls.map((img, i) => (
                            <button key={i} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${activeImage === img ? 'border-brand-500 scale-95 shadow-inner' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{property.title}</h1>
                        <p className="flex items-center text-gray-500 text-sm"><MapPin size={16} className="mr-1 text-brand-500" /> {property.address}</p>
                    </div>
                    <span className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{property.category}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="text-center">
                        <Ruler className="mx-auto text-brand-500 mb-1" size={20} />
                        <p className="text-sm font-black">{property.area} <span className="text-[10px] text-gray-400 font-bold">Sqft</span></p>
                    </div>
                    {property.bedrooms && (
                        <div className="text-center">
                            <BedDouble className="mx-auto text-brand-500 mb-1" size={20} />
                            <p className="text-sm font-black">{property.bedrooms} <span className="text-[10px] text-gray-400 font-bold">BHK</span></p>
                        </div>
                    )}
                    <div className="text-center">
                        <Tag className="mx-auto text-brand-500 mb-1" size={20} />
                        <p className="text-sm font-black capitalize">{property.listedBy || 'Owner'}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-black uppercase text-[10px] tracking-[0.2em] text-gray-400 mb-3">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-between gap-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Expected Price</p>
                        <p className="text-3xl font-black text-brand-700">₹ {property.price.toLocaleString('en-IN')}</p>
                    </div>
                    
                    {!isOwner && (
                        <div className="flex gap-2">
                             <button onClick={handleStartChat} className="bg-brand-600 text-white p-4 rounded-2xl shadow-lg hover:bg-brand-700 transition-all active:scale-95">
                                 <MessageSquare size={24} />
                             </button>
                             {property.contactNumber && (
                                 <a href={`tel:${property.contactNumber}`} className="bg-gray-900 text-white p-4 rounded-2xl shadow-lg hover:bg-black transition-all active:scale-95">
                                     <Phone size={24} />
                                 </a>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
