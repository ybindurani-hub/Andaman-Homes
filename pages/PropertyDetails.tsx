
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Property } from '../types';
import { MapPin, BedDouble, Bath, Ruler, CheckCircle, ArrowLeft, Phone, Shield, AlertTriangle, Tag, MessageSquare, ImageOff, Trash2 } from 'lucide-react';

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

          // Ensure images array exists
          const images = data.imageUrls && data.imageUrls.length > 0 
            ? data.imageUrls 
            : data.imageUrl ? [data.imageUrl] : [];
          
          setAllImages(images);
          if (images.length > 0) setActiveImage(images[0]);
        } else {
          console.log("No such document!");
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
      if (!id || !property) return;
      try {
          await db.collection("properties").doc(id).update({ status: newStatus });
          setProperty({ ...property, status: newStatus });
          alert(`Property marked as ${newStatus}`);
      } catch (error) {
          console.error("Error updating status:", error);
          alert("Failed to update status");
      }
  };

  const deleteProperty = async () => {
      if (!id) return;
      if (window.confirm("Are you sure you want to delete this listing permanently? This action cannot be undone.")) {
          try {
              await db.collection("properties").doc(id).delete();
              alert("Property deleted successfully.");
              navigate('/my-ads');
          } catch (error) {
              console.error("Error deleting property:", error);
              alert("Failed to delete property.");
          }
      }
  };

  const handleStartChat = async () => {
    if (!auth.currentUser) {
        navigate('/login');
        return;
    }
    
    if (!property) return;

    if (property.ownerId === auth.currentUser.uid) {
        alert("You cannot chat with yourself!");
        return;
    }

    try {
        // Create a unique Chat ID based on sorted UIDs to ensure one chat room per pair
        const uids = [auth.currentUser.uid, property.ownerId].sort();
        const chatId = uids.join('_');

        const chatRef = db.collection('chats').doc(chatId);
        const chatDoc = await chatRef.get();

        if (!chatDoc.exists) {
            // Create chat room if it doesn't exist
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
    } catch (error) {
        console.error("Error starting chat:", error);
        alert("Failed to start chat.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-12 w-12 border-4 border-brand-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!property) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
            <h2 className="text-2xl font-bold text-gray-900">Property not found</h2>
            <Link to="/" className="mt-4 text-brand-600 hover:text-brand-700 font-medium">Return Home</Link>
        </div>
    );
  }

  const isInactive = property.status && property.status !== 'active';
  const sqMeters = Math.round(property.area * 0.092903);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft size={18} className="mr-1" /> Back to Properties
        </Link>
        
        {/* Status Banner for Non-Active Listings */}
        {isInactive && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-md">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700 font-medium">
                            This property is {property.status?.toUpperCase()}. It is no longer available.
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* Owner Controls */}
        {isOwner && (
            <div className="bg-white border border-gray-200 p-4 rounded-xl mb-6 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Owner Actions</h3>
                <div className="flex flex-wrap gap-3">
                    {property.status !== 'active' ? (
                         <button onClick={() => updateStatus('active')} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700">
                            Re-activate Listing
                         </button>
                    ) : (
                        <>
                            <button onClick={() => updateStatus('sold')} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
                                <Tag size={16} /> Mark as Sold
                            </button>
                            <button onClick={() => updateStatus('rented')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2">
                                <CheckCircle size={16} /> Mark as Rented
                            </button>
                            <button onClick={() => updateStatus('occupied')} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700">
                                Mark as Occupied
                            </button>
                        </>
                    )}
                    
                    {/* Delete Button */}
                    <button onClick={deleteProperty} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 flex items-center gap-2">
                        <Trash2 size={16} /> Delete Listing
                    </button>
                </div>
            </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            {/* Image Side - Improved View */}
            <div className="bg-black flex flex-col justify-center relative">
                <div className="h-[400px] w-full flex items-center justify-center bg-gray-900">
                    {allImages.length > 0 && !imgError ? (
                        <img 
                            src={activeImage} 
                            alt={property.title} 
                            className={`max-w-full max-h-full object-contain ${isInactive ? 'grayscale opacity-75' : ''}`}
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="text-white flex flex-col items-center">
                            <ImageOff size={48} className="text-gray-600" />
                            <span className="text-gray-500 mt-2">Image not available</span>
                        </div>
                    )}
                    
                    {isInactive && (
                        <div className="absolute inset-0 flex items-center justify-center z-10">
                            <span className="bg-red-600 text-white text-xl font-bold px-6 py-2 rounded-full transform -rotate-12 shadow-lg border-2 border-white">
                                {property.status?.toUpperCase()}
                            </span>
                        </div>
                    )}
                </div>
                {/* Thumbnails */}
                {allImages.length > 1 && (
                  <div className="flex gap-2 p-4 overflow-x-auto bg-gray-900 border-t border-gray-800 no-scrollbar">
                    {allImages.map((img, idx) => (
                      <button 
                        key={idx}
                        onClick={() => { setActiveImage(img); setImgError(false); }}
                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${activeImage === img ? 'border-brand-500 ring-2 ring-brand-900' : 'border-gray-700 opacity-60 hover:opacity-100'}`}
                      >
                        <img src={img} alt={`View ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
            </div>

            {/* Content Side */}
            <div className="p-6 lg:p-10 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start mb-4">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{property.title}</h1>
                        <span className={`text-xs sm:text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap ml-4 uppercase ${property.type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-brand-100 text-brand-800'}`}>
                            For {property.type || 'Rent'}
                        </span>
                    </div>
                    
                    <div className="flex items-center text-gray-600 mb-6">
                        <MapPin size={20} className="mr-2 text-gray-400" />
                        <span className="text-lg">{property.address}</span>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-8">
                        <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                            <BedDouble size={24} className="mx-auto text-brand-500 mb-2" />
                            <div className="text-xl font-bold text-gray-900">{property.bedrooms}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Bedrooms</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                            <Bath size={24} className="mx-auto text-brand-500 mb-2" />
                            <div className="text-xl font-bold text-gray-900">{property.bathrooms}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Bathrooms</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl text-center border border-gray-100">
                            <Ruler size={24} className="mx-auto text-brand-500 mb-2" />
                            <div className="text-xl font-bold text-gray-900">{property.area}</div>
                            <div className="text-xs text-gray-500 uppercase tracking-wide">Sq Ft <br/><span className="text-gray-400">({sqMeters} m²)</span></div>
                        </div>
                    </div>

                    {/* Amenities */}
                    {property.amenities && property.amenities.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Amenities</h3>
                            <div className="flex flex-wrap gap-2">
                                {property.amenities.map(amenity => (
                                    <span key={amenity} className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                                        <CheckCircle size={14} className="mr-1.5 text-brand-500" />
                                        {amenity}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{property.description}</p>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <div className="flex flex-col gap-4">
                         <div>
                            <div className="text-sm text-gray-500">{property.type === 'rent' ? 'Rent / Month' : 'Total Price'}</div>
                            <div className="text-3xl font-bold text-brand-600">₹{property.price.toLocaleString('en-IN')}</div>
                        </div>
                        
                        {!isInactive && !isOwner && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                                {/* Chat Button */}
                                <button 
                                    onClick={handleStartChat}
                                    className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                >
                                    <MessageSquare size={20} />
                                    Chat with Owner
                                </button>

                                {/* Call Button - Only if number exists */}
                                {property.contactNumber ? (
                                    <a 
                                        href={`tel:${property.contactNumber}`}
                                        className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Phone size={20} />
                                        Call Owner
                                    </a>
                                ) : (
                                    <div className="bg-gray-100 text-gray-500 px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200">
                                        <Phone size={20} />
                                        Number Hidden
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* If owner, show message */}
                        {isOwner && (
                           <div className="bg-brand-50 p-3 rounded-lg text-brand-700 text-center text-sm">
                               This is your property listing.
                           </div> 
                        )}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetails;
