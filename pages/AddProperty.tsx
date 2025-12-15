
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { Upload, Loader2, MapPin, Home, Ruler, BedDouble, Bath, Phone, X, IndianRupee, Car, Building, Compass, Layers, User } from 'lucide-react';
import firebase from 'firebase/compat/app';

const AMENITIES_LIST = [
  "Parking", "Lift", "Gym", "Swimming Pool", "Power Backup", 
  "Security", "Club House", "Park", "Gas Pipeline", "Vastu Compliant", "Water Supply"
];

type CategoryType = 'rent' | 'sale-house' | 'sale-land';

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  // UI State
  const [category, setCategory] = useState<CategoryType>('rent'); 
  
  // Data State
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '', // Rent or Price
    description: '',
    
    // Specifics
    bedrooms: '',
    bathrooms: '',
    area: '', // Sqft (Builtup for house, Plot for land)
    
    // Extras
    furnishing: 'semi', // fully, semi, unfurnished
    parking: 'both', // bike, car, both, none
    floorNumber: '',
    totalFloors: '',
    
    // Land Specifics
    facing: 'north',
    
    // Meta
    amenities: [] as string[],
    contactNumber: '',
    listedBy: 'owner', // owner, broker, builder
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => {
      const current = prev.amenities;
      return current.includes(amenity) 
        ? { ...prev, amenities: current.filter(a => a !== amenity) }
        : { ...prev, amenities: [...current, amenity] };
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 20) {
        alert("Maximum 20 photos allowed.");
        return;
      }
      setImageFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (imageFiles.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      // 1. Upload Images
      const uploadPromises = imageFiles.map(async (file) => {
        const storageRef = storage.ref(`properties/${Date.now()}_${Math.random().toString(36).substr(7)}_${file.name}`);
        const snapshot = await storageRef.put(file);
        return snapshot.ref.getDownloadURL();
      });
      const imageUrls = await Promise.all(uploadPromises);

      // 2. Map Data based on Category
      const isLand = category === 'sale-land';
      
      const finalData = {
        category: category === 'rent' ? 'rent' : 'sale',
        propertyType: isLand ? 'land' : 'house',
        
        title: formData.title,
        address: formData.address,
        price: Number(formData.price),
        description: formData.description,
        area: Number(formData.area),
        
        // Conditionally add fields
        ...(!isLand && {
            bedrooms: Number(formData.bedrooms),
            bathrooms: Number(formData.bathrooms),
            furnishing: formData.furnishing,
            parking: formData.parking,
            floorNumber: formData.floorNumber,
            totalFloors: formData.totalFloors,
        }),
        
        ...(isLand && {
            facing: formData.facing,
        }),

        amenities: formData.amenities,
        contactNumber: formData.contactNumber,
        listedBy: formData.listedBy,
        
        imageUrl: imageUrls[0], 
        imageUrls: imageUrls,   
        ownerId: auth.currentUser.uid,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      await db.collection("properties").add(finalData);
      
      // Update User Stats
      await db.collection('users').doc(auth.currentUser.uid).set({
          adsPosted: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      navigate('/');
      
    } catch (error) {
      console.error("Error posting ad:", error);
      alert("Failed to post ad. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Header */}
          <div className="bg-brand-600 px-6 py-5">
            <h2 className="text-xl font-bold text-white">Post Your Ad</h2>
            <p className="text-brand-100 text-sm">Reach genuine buyers & tenants instantly</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            
            {/* Category Selector */}
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">I want to...</label>
                <div className="grid grid-cols-3 gap-3">
                    <button type="button" onClick={() => setCategory('rent')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'rent' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-200'}`}>
                        Rent Out<br/><span className="text-xs font-normal text-gray-500">House/Flat</span>
                    </button>
                    <button type="button" onClick={() => setCategory('sale-house')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'sale-house' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>
                        Sell<br/><span className="text-xs font-normal text-gray-500">House/Flat</span>
                    </button>
                    <button type="button" onClick={() => setCategory('sale-land')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'sale-land' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'}`}>
                        Sell<br/><span className="text-xs font-normal text-gray-500">Plot/Land</span>
                    </button>
                </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleInputChange} 
                        placeholder={category === 'sale-land' ? "e.g. 200 Sq.m Plot in Aberdeen" : "e.g. 2 BHK Fully Furnished Flat"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input type="text" name="address" required value={formData.address} onChange={handleInputChange} 
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" 
                            placeholder="Locality, City" />
                    </div>
                </div>

                {/* Price / Rent */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        {category === 'rent' ? 'Monthly Rent (₹)' : 'Total Price (₹)'}
                    </label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input type="number" name="price" required value={formData.price} onChange={handleInputChange} 
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>

                {/* Listed By */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Listed By</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <select name="listedBy" value={formData.listedBy} onChange={handleInputChange}
                            className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                            <option value="owner">Owner</option>
                            <option value="broker">Broker / Agent</option>
                            <option value="builder">Builder</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* DYNAMIC FIELDS SECTION */}
            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 tracking-wide">
                    {category === 'sale-land' ? 'Plot Details' : 'Property Features'}
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    
                    {/* Area (Common but labeled differently) */}
                    <div className="col-span-2">
                         <label className="block text-xs font-medium text-gray-500 mb-1">
                            {category === 'sale-land' ? 'Plot Area (sq. ft)' : 'Built-up Area (sq. ft)'}
                         </label>
                         <div className="relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input type="number" name="area" required value={formData.area} onChange={handleInputChange} 
                                className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                         </div>
                         {/* Helper for Sq Meters */}
                         {formData.area && (
                             <p className="text-[10px] text-gray-500 mt-1 text-right">
                                 ≈ {(Number(formData.area) * 0.0929).toFixed(2)} Sq. Meters
                             </p>
                         )}
                    </div>

                    {category !== 'sale-land' && (
                        <>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bedrooms</label>
                                <div className="relative">
                                    <BedDouble className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <input type="number" name="bedrooms" required value={formData.bedrooms} onChange={handleInputChange} className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="BHK" />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bathrooms</label>
                                <div className="relative">
                                    <Bath className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                    <input type="number" name="bathrooms" required value={formData.bathrooms} onChange={handleInputChange} className="w-full pl-8 px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="No." />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Furnishing</label>
                                <select name="furnishing" value={formData.furnishing} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="semi">Semi Furnished</option>
                                    <option value="fully">Fully Furnished</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Parking</label>
                                <select name="parking" value={formData.parking} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                    <option value="none">No Parking</option>
                                    <option value="bike">Bike Only</option>
                                    <option value="car">Car Only</option>
                                    <option value="both">Bike & Car</option>
                                </select>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Floor No.</label>
                                <input type="text" name="floorNumber" value={formData.floorNumber} onChange={handleInputChange} placeholder="e.g. 2" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>

                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Total Floors</label>
                                <input type="text" name="totalFloors" value={formData.totalFloors} onChange={handleInputChange} placeholder="e.g. 4" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                        </>
                    )}

                    {category === 'sale-land' && (
                        <div className="col-span-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Facing</label>
                            <div className="relative">
                                <Compass className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                                <select name="facing" value={formData.facing} onChange={handleInputChange} className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                    <option value="north">North</option>
                                    <option value="south">South</option>
                                    <option value="east">East</option>
                                    <option value="west">West</option>
                                    <option value="ne">North-East</option>
                                    <option value="nw">North-West</option>
                                    <option value="se">South-East</option>
                                    <option value="sw">South-West</option>
                                </select>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Description & Amenities */}
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                    <textarea name="description" rows={4} required value={formData.description} onChange={handleInputChange} placeholder="Nearby landmarks, water availability, etc." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none text-sm" />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                    <div className="flex flex-wrap gap-2">
                        {AMENITIES_LIST.map(amenity => (
                            <button
                                key={amenity}
                                type="button"
                                onClick={() => handleAmenityToggle(amenity)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${formData.amenities.includes(amenity) ? 'bg-brand-50 border-brand-500 text-brand-700' : 'bg-white border-gray-300 text-gray-600'}`}
                            >
                                {amenity}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Images & Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Photos (Max 20)</label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {previewUrls.slice(0, 4).map((url, i) => (
                            <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                                <img src={url} className="w-full h-full object-cover" />
                                <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"><X size={10} /></button>
                            </div>
                        ))}
                    </div>
                    <label className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Upload size={16} /> Upload Images
                        </div>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                    </label>
                 </div>

                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} placeholder="+91 99999 99999" className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Buyers/Tenants will call this number.</p>
                 </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Post Ad Now'}
                </button>
            </div>

          </form>
      </div>
    </div>
  );
};

export default AddProperty;
