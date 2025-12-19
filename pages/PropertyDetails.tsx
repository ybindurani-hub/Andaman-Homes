
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Property } from '../types';
import { MapPin, BedDouble, Bath, Ruler, CheckCircle, ArrowLeft, Phone, Tag, MessageSquare, ImageOff, ShieldAlert, Trash2, Loader2 } from 'lucide-react';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Changed collection name to 'properties'
        const doc = await db.collection("properties").doc(id).get();
        if (doc.exists) {
          const data = { id: doc.id, ...doc.data() } as Property;
          setProperty(data);
          if (auth.currentUser && data.ownerId === auth.currentUser.uid) setIsOwner(true);
          const images = data.imageUrls && data.imageUrls.length > 0 ? data.imageUrls : [data.imageUrl];
          setActiveImage(images[0]);
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
      <div className="max-w-6xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 mb-4 font-bold uppercase text-xs tracking-widest"><ArrowLeft size={16} className="mr-1" /> Back</button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
                <div className="aspect-video bg-black rounded-3xl overflow-hidden relative">
                     <img src={activeImage} className="w-full h-full object-contain" />
                     {property.status && property.status !== 'active' && (
                         <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                             <span className="bg-red-600 text-white px-8 py-2 rounded-full font-black uppercase text-xl transform -rotate-12">{property.status}</span>
                         </div>
                     )}
                </div>
                {property.imageUrls && property.imageUrls.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto no-scrollbar">
                        {property.imageUrls.map((img, i) => (
                            <button key={i} onClick={() => setActiveImage(img)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 ${activeImage === img ? 'border-brand-500' : 'border-transparent'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 mb-2">{property.title}</h1>
                        <p className="flex items-center text-gray-500 text-sm"><MapPin size={16} className="mr-1 text-brand-500" /> {property.address}</p>
                    </div>
                    <span className="bg-brand-50 text-brand-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">{property.category}</span>
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
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Fixed Price</p>
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
