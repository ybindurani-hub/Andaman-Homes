
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { Upload, Loader2, MapPin, Home, Ruler, BedDouble, Bath, Phone, X, IndianRupee } from 'lucide-react';
import firebase from 'firebase/compat/app';

const AMENITIES_LIST = [
  "Parking", "Lift", "Gym", "Swimming Pool", "Power Backup", 
  "Security", "Club House", "Park", "Gas Pipeline", "Vastu Compliant"
];

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [phoneError, setPhoneError] = useState('');

  const [formData, setFormData] = useState({
    type: 'rent',
    title: '',
    address: '',
    price: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    amenities: [] as string[],
    contactNumber: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'contactNumber') setPhoneError('');
  };

  const handleTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, type }));
  };

  const handleAmenityToggle = (amenity: string) => {
    setFormData(prev => {
      const current = prev.amenities;
      if (current.includes(amenity)) {
        return { ...prev, amenities: current.filter(a => a !== amenity) };
      } else {
        return { ...prev, amenities: [...current, amenity] };
      }
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles: File[] = Array.from(e.target.files);
      if (imageFiles.length + newFiles.length > 20) {
        alert("You can upload a maximum of 20 photos.");
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

  const validatePhoneNumber = (phone: string) => {
    // If empty, it's valid because it's optional
    if (!phone) return true;
    const regex = /^(\+91|0)?[6-9]\d{9}$/;
    const cleanPhone = phone.replace(/[\s-]/g, '');
    return regex.test(cleanPhone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    
    if (imageFiles.length === 0) {
      alert("Please upload at least one property image.");
      return;
    }
    
    if (formData.contactNumber && !validatePhoneNumber(formData.contactNumber)) {
        setPhoneError("Please enter a valid Indian mobile number.");
        return;
    }

    setLoading(true);

    try {
      // 1. Upload All Images
      const uploadPromises = imageFiles.map(async (file) => {
        const storageRef = storage.ref(`properties/${Date.now()}_${Math.random().toString(36).substring(7)}_${file.name}`);
        const snapshot = await storageRef.put(file);
        return snapshot.ref.getDownloadURL();
      });

      const imageUrls = await Promise.all(uploadPromises);

      // 2. Prepare Property Data
      const propertyData = {
        type: formData.type,
        title: formData.title,
        address: formData.address,
        price: Number(formData.price),
        description: formData.description,
        bedrooms: Number(formData.bedrooms),
        bathrooms: Number(formData.bathrooms),
        area: Number(formData.area),
        amenities: formData.amenities,
        contactNumber: formData.contactNumber, // Optional
        imageUrl: imageUrls[0], 
        imageUrls: imageUrls,   
        ownerId: auth.currentUser.uid,
        status: 'active',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      // 3. Save directly (Unlimited Free Ads)
      await db.collection("properties").add(propertyData);
      
      // Increment stats just for tracking, but no payment logic
      await db.collection('users').doc(auth.currentUser.uid).set({
          adsPosted: firebase.firestore.FieldValue.increment(1)
      }, { merge: true });

      alert("Ad Posted Successfully!");
      navigate('/');
      
    } catch (error) {
      console.error("Error processing property: ", error);
      alert("Failed to process. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-brand-900 px-8 py-6 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Post Property Ad</h2>
                <p className="text-brand-100 mt-1">Get genuine leads without any brokerage.</p>
            </div>
            <div className="hidden sm:block">
                 <span className="bg-green-500 text-white font-bold px-4 py-2 rounded-full text-sm shadow-lg">
                     100% Free
                 </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            
            {/* Property Type Selection */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">I want to...</label>
                <div className="grid grid-cols-2 gap-4 sm:w-1/2">
                    <button 
                        type="button" 
                        onClick={() => handleTypeChange('rent')}
                        className={`py-3 px-4 text-center rounded-lg border font-medium transition-all ${formData.type === 'rent' ? 'bg-brand-50 border-brand-500 text-brand-700 ring-1 ring-brand-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        Rent Out
                    </button>
                    <button 
                        type="button" 
                        onClick={() => handleTypeChange('sale')}
                        className={`py-3 px-4 text-center rounded-lg border font-medium transition-all ${formData.type === 'sale' ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}
                    >
                        Sell
                    </button>
                </div>
            </div>

            {/* Address Input */}
            <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Property Location / Address</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="address"
                        required
                        className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        placeholder="Complete Address (House No, Building, Street, City)"
                        value={formData.address}
                        onChange={handleInputChange}
                    />
                </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Property Photos (Add Multiple)</label>
                
                {previewUrls.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4 mb-4">
                    {previewUrls.map((url, index) => (
                      <div key={index} className="relative group aspect-square rounded-lg overflow-hidden border border-gray-200">
                        <img src={url} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-brand-400 hover:bg-brand-50 transition-colors">
                  <div className="space-y-1 text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600 justify-center mt-4">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-brand-600 hover:text-brand-500 focus-within:outline-none">
                        <span>Upload photos</span>
                        <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only" 
                            accept="image/*" 
                            multiple 
                            onChange={handleImageChange} 
                        />
                      </label>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG up to 10MB each</p>
                  </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
              {/* Title */}
              <div className="sm:col-span-4">
                <label className="block text-sm font-medium text-gray-700">Property Title</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Home className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        name="title"
                        required
                        className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        placeholder="e.g. Spacious 2BHK near Aberdeen Bazaar"
                        value={formData.title}
                        onChange={handleInputChange}
                    />
                </div>
              </div>

              {/* Price */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">{formData.type === 'rent' ? 'Expected Rent / Month' : 'Expected Price'}</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <IndianRupee className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                        type="number"
                        name="price"
                        required
                        className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border"
                        placeholder={formData.type === 'rent' ? "15000" : "5000000"}
                        value={formData.price}
                        onChange={handleInputChange}
                    />
                </div>
              </div>

              {/* Stats Row */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Bedrooms</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BedDouble className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="number" name="bedrooms" required className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" value={formData.bedrooms} onChange={handleInputChange} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Bathrooms</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Bath className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="number" name="bathrooms" required className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" value={formData.bathrooms} onChange={handleInputChange} />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Area (sqft)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Ruler className="h-5 w-5 text-gray-400" />
                    </div>
                    <input type="number" name="area" required className="focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border" value={formData.area} onChange={handleInputChange} />
                </div>
              </div>

              {/* Amenities */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Amenities</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {AMENITIES_LIST.map((amenity) => (
                        <div key={amenity} className="flex items-center">
                            <input
                                id={`amenity-${amenity}`}
                                type="checkbox"
                                checked={formData.amenities.includes(amenity)}
                                onChange={() => handleAmenityToggle(amenity)}
                                className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                            />
                            <label htmlFor={`amenity-${amenity}`} className="ml-2 text-sm text-gray-700">
                                {amenity}
                            </label>
                        </div>
                    ))}
                </div>
              </div>

              {/* Description */}
              <div className="sm:col-span-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <div className="mt-1">
                  <textarea
                    name="description"
                    rows={4}
                    required
                    className="shadow-sm focus:ring-brand-500 focus:border-brand-500 block w-full sm:text-sm border border-gray-300 rounded-md p-2"
                    placeholder="Tell people about the neighborhood, nearby landmarks, recent renovations, etc."
                    value={formData.description}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                <label className="block text-sm font-medium text-gray-700">Your Contact Number (Optional)</label>
                <p className="text-xs text-gray-500 mb-2">Leave blank if you prefer to be contacted via chat only.</p>
                <div className="mt-1 relative rounded-md shadow-sm sm:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="tel"
                        name="contactNumber"
                        className={`focus:ring-brand-500 focus:border-brand-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2 border ${phoneError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                        placeholder="+91 90000 00000"
                        value={formData.contactNumber}
                        onChange={handleInputChange}
                    />
                </div>
                {phoneError && <p className="mt-1 text-sm text-red-600">{phoneError}</p>}
              </div>

            </div>

            <div className="pt-5 border-t border-gray-100 flex justify-end">
                <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none mr-3"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-8 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-brand-600 hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                            Post Free Ad
                        </>
                    ) : (
                        'Post Free Ad'
                    )}
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddProperty;
