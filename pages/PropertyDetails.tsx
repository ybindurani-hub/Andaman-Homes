
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Property } from '../types';
import { MapPin, BedDouble, Bath, Ruler, CheckCircle, ArrowLeft, Phone, Tag, MessageSquare, ImageOff, Trash2, Building, Car, Compass, User } from 'lucide-react';

const PropertyDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState<string>('');
  const [allImages, setAllImages] = useState<string[]>([]);
  const [isOwner, setIsOwner] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      if (!id) return;
      try {
        const docRef = db.collection("properties").doc(id);
        const docSnap = await docRef.get();
        
        if (docSnap.exists) {
          const data = { id: docSnap.id, ...docSnap.data() } as Property;
          setProperty(data);
          
          if (auth.currentUser && data.ownerId === auth.currentUser.uid) {
            setIsOwner(true);
          }

          const images = data.imageUrls && data.imageUrls.length > 0 
            ? data.imageUrls 
            : data.imageUrl ? [data.imageUrl] : [];
          
          setAllImages(images);
          if (images.length > 0) setActiveImage(images[0]);
        }
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperty();
  }, [id]);

  const updateStatus = async (newStatus: 'sold' | 'rented' | 'occupied' | 'active') => {
      if (!id) return;
      await db.collection("properties").doc(id).update({ status: newStatus });
      setProperty(prev => prev ? { ...prev, status: newStatus } : null);
  };

  const deleteProperty = async () => {
      if (!id || !window.confirm("Permanently delete this ad?")) return;
      await db.collection("properties").doc(id).delete();
      navigate('/my-ads');
  };

  const handleStartChat = async () => {
    if (!auth.currentUser) return navigate('/login');
    if (!property) return;
    if (property.ownerId === auth.currentUser.uid) return alert("You cannot chat with yourself!");

    const uids = [auth.currentUser.uid, property.ownerId].sort();
    const chatId = uids.join('_');
    const chatRef = db.collection('chats').doc(chatId);
    
    // Create if not exists
    const chatDoc = await chatRef.get();
    if (!chatDoc.exists) {
        await chatRef.set({
            participants: uids,
            propertyId: property.id,
            propertyTitle: property.title,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastMessage: '',
            lastMessageTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }
    navigate(`/chat/${chatId}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-brand-500 rounded-full border-t-transparent"></div></div>;
  if (!property) return <div className="text-center mt-20">Property not found. <Link to="/" className="text-brand-600">Go Back</Link></div>;

  const isInactive = property.status && property.status !== 'active';
  const sqMeters = property.area ? (property.area * 0.092903).toFixed(1) : '0';
  const isLand = property.propertyType === 'land';

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft size={18} className="mr-1" /> Back
        </Link>
        
        {isOwner && (
            <div className="bg-white p-4 rounded-xl mb-4 border border-gray-200 shadow-sm flex flex-wrap gap-3 items-center">
                <span className="text-xs font-bold text-gray-500 uppercase mr-2">Owner Controls:</span>
                {property.status === 'active' ? (
                     <>
                        <button onClick={() => updateStatus('sold')} className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200">Mark Sold/Rented</button>
                        <button onClick={deleteProperty} className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200">Delete Ad</button>
                     </>
                ) : (
                    <button onClick={() => updateStatus('active')} className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm font-medium hover:bg-green-200">Re-activate Ad</button>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div className="space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden relative flex items-center justify-center">
                     {allImages.length > 0 && !imgError ? (
                         <img src={activeImage} className={`w-full h-full object-contain ${isInactive ? 'opacity-50 grayscale' : ''}`} onError={() => setImgError(true)} />
                     ) : (
                         <div className="text-white flex flex-col items-center"><ImageOff size={32} />No Image</div>
                     )}
                     {isInactive && <div className="absolute inset-0 flex items-center justify-center"><span className="bg-red-600 text-white px-6 py-2 rounded-full font-bold transform -rotate-12">{property.status?.toUpperCase()}</span></div>}
                </div>
                {allImages.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2">
                        {allImages.map((img, i) => (
                            <button key={i} onClick={() => setActiveImage(img)} className={`w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border-2 ${activeImage === img ? 'border-brand-500' : 'border-transparent'}`}>
                                <img src={img} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 leading-tight">{property.title}</h1>
                        <div className="flex items-center text-gray-500 mt-2 text-sm">
                            <MapPin size={16} className="mr-1" /> {property.address}
                        </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${property.category === 'sale' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {property.category === 'sale' ? 'For Sale' : 'For Rent'}
                    </span>
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 grid grid-cols-3 gap-4 text-center">
                    {/* Area (Always Shown) */}
                    <div>
                        <div className="flex items-center justify-center text-brand-600 mb-1"><Ruler size={20} /></div>
                        <div className="font-bold text-gray-900">{property.area}</div>
                        <div className="text-[10px] text-gray-500 uppercase">Sq. Ft</div>
                    </div>
                    
                    {/* Conditional Fields */}
                    {!isLand && (
                        <>
                            <div>
                                <div className="flex items-center justify-center text-brand-600 mb-1"><BedDouble size={20} /></div>
                                <div className="font-bold text-gray-900">{property.bedrooms}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Bedrooms</div>
                            </div>
                            <div>
                                <div className="flex items-center justify-center text-brand-600 mb-1"><Bath size={20} /></div>
                                <div className="font-bold text-gray-900">{property.bathrooms}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Bathrooms</div>
                            </div>
                        </>
                    )}

                    {isLand && (
                        <>
                             <div>
                                <div className="flex items-center justify-center text-brand-600 mb-1"><Compass size={20} /></div>
                                <div className="font-bold text-gray-900 capitalize">{property.facing || 'N/A'}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Facing</div>
                            </div>
                            <div>
                                <div className="flex items-center justify-center text-brand-600 mb-1"><Tag size={20} /></div>
                                <div className="font-bold text-gray-900">{sqMeters}</div>
                                <div className="text-[10px] text-gray-500 uppercase">Sq. Mtrs</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Additional Details Grid */}
                <div className="mt-6 grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                    <div className="flex justify-between border-b border-gray-100 pb-2">
                        <span className="text-gray-500">Listed By</span>
                        <span className="font-medium capitalize text-gray-900">{property.listedBy || 'Owner'}</span>
                    </div>
                    {!isLand && (
                        <>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Furnishing</span>
                                <span className="font-medium capitalize text-gray-900">{property.furnishing || 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Floor</span>
                                <span className="font-medium text-gray-900">{property.floorNumber ? `${property.floorNumber} of ${property.totalFloors||'-'}` : 'N/A'}</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-100 pb-2">
                                <span className="text-gray-500">Parking</span>
                                <span className="font-medium capitalize text-gray-900">{property.parking || 'None'}</span>
                            </div>
                        </>
                    )}
                </div>

                <div className="mt-6">
                    <h3 className="font-bold text-gray-900 mb-2">Description</h3>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                </div>

                {property.amenities?.length > 0 && (
                    <div className="mt-6">
                        <h3 className="font-bold text-gray-900 mb-2">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                            {property.amenities.map(a => (
                                <span key={a} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-md flex items-center">
                                    <CheckCircle size={10} className="mr-1 text-brand-500" /> {a}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-xs text-gray-500">Price</p>
                            <p className="text-3xl font-bold text-brand-700">₹ {property.price.toLocaleString('en-IN')}</p>
                        </div>
                    </div>

                    {!isOwner && !isInactive && (
                        <div className="flex gap-3">
                            <button onClick={handleStartChat} className="flex-1 bg-brand-600 text-white py-3 rounded-xl font-bold hover:bg-brand-700 flex items-center justify-center gap-2">
                                <MessageSquare size={18} /> Chat
                            </button>
                            {property.contactNumber ? (
                                <a href={`tel:${property.contactNumber}`} className="flex-1 bg-gray-900 text-white py-3 rounded-xl font-bold hover:bg-gray-800 flex items-center justify-center gap-2">
                                    <Phone size={18} /> Call
                                </a>
                            ) : (
                                <button disabled className="flex-1 bg-gray-100 text-gray-400 py-3 rounded-xl font-bold cursor-not-allowed">Number Hidden</button>
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
