
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { Upload, Loader2, MapPin, Ruler, X, IndianRupee } from 'lucide-react';
import firebase from 'firebase/compat/app';

declare global { interface Window { Razorpay: any; } }

type CategoryType = 'rent' | 'sale-house' | 'sale-land';

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [category, setCategory] = useState<CategoryType>('rent'); 
  const [formData, setFormData] = useState({
    title: '', address: '', price: '', description: '', bedrooms: '', bathrooms: '',
    area: '', furnishing: 'semi', parking: 'both', floorNumber: '', totalFloors: '',
    facing: 'north', amenities: [] as string[], contactNumber: '', listedBy: 'owner',
  });

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      setImageFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPreviewUrls(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const savePropertyToDb = async (paymentStatus: 'free' | 'paid', paymentId: string | null, amount: number) => {
    try {
        setLoadingText("Uploading high-quality images...");
        const uploadPromises = imageFiles.map(async (file) => {
            const extension = file.name.split('.').pop();
            // Changed storage path to 'properties'
            const storageRef = storage.ref(`properties/${Date.now()}_${Math.random().toString(36).substr(7)}.${extension}`);
            const snapshot = await storageRef.put(file);
            return snapshot.ref.getDownloadURL();
        });
        const imageUrls = await Promise.all(uploadPromises);

        setLoadingText("Publishing listing...");
        const isLand = category === 'sale-land';
        const finalData = {
            category: category === 'rent' ? 'rent' : 'sale',
            propertyType: isLand ? 'land' : 'house',
            title: formData.title || "Untitled Property",
            address: formData.address || "Andaman Islands",
            price: Number(formData.price) || 0,
            description: formData.description || "",
            area: Number(formData.area) || 0,
            ...(!isLand && {
                bedrooms: Number(formData.bedrooms) || 1,
                bathrooms: Number(formData.bathrooms) || 1,
                furnishing: formData.furnishing,
                parking: formData.parking,
                floorNumber: formData.floorNumber,
                totalFloors: formData.totalFloors,
            }),
            amenities: formData.amenities,
            contactNumber: formData.contactNumber || auth.currentUser?.phoneNumber || "",
            listedBy: formData.listedBy,
            imageUrl: imageUrls[0] || "", 
            imageUrls: imageUrls,   
            ownerId: auth.currentUser!.uid,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            paymentStatus, 
            paymentId, 
            paymentAmount: amount
        };

        // Changed collection name to 'properties'
        await db.collection("properties").add(finalData);
        
        // Update user stats
        await db.collection('users').doc(auth.currentUser!.uid).set({
            adsPosted: firebase.firestore.FieldValue.increment(1),
            ...(paymentStatus === 'free' && { freeAdsUsed: firebase.firestore.FieldValue.increment(1) })
        }, { merge: true });

        console.log("Property saved successfully to 'properties' collection.");
        navigate('/');
    } catch (error: any) {
        console.error("Error saving ad:", error);
        alert(`Upload failed: ${error.message || "Unknown error"}`);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) return alert("Please upload at least one photo of the property.");
    if (!formData.title || !formData.price || !formData.address) return alert("Please fill in title, price, and address.");
    
    setLoading(true);
    setLoadingText("Checking account details...");

    try {
        const userDoc = await db.collection('users').doc(auth.currentUser!.uid).get();
        const freeUsed = userDoc.data()?.freeAdsUsed || 0;

        if (freeUsed < 10) {
            await savePropertyToDb('free', null, 0);
        } else {
            setLoadingText("Opening secure payment...");
            const options = {
                key: "rzp_test_1DP5mmOlF5G5ag", 
                amount: 3000, 
                currency: "INR",
                name: "Andaman Homes",
                handler: async (res: any) => await savePropertyToDb('paid', res.razorpay_payment_id, 30),
                modal: { ondismiss: () => setLoading(false) }
            };
            new window.Razorpay(options).open();
        }
    } catch (err) {
        console.error("Submit Error:", err);
        setLoading(false);
        alert("Verification failed. Please check your internet.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100">
          <div className="bg-brand-600 p-8 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tight">Post Your Ad</h2>
              <p className="opacity-80 text-sm font-medium mt-1">Free for owners. No brokerage, ever.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Select Category</label>
                <div className="grid grid-cols-3 gap-3">
                    {['rent', 'sale-house', 'sale-land'].map(c => (
                        <button 
                            key={c} 
                            type="button" 
                            onClick={() => setCategory(c as any)} 
                            className={`py-4 rounded-2xl border-2 font-black text-[10px] uppercase tracking-wider transition-all ${
                                category === c ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-gray-100 text-gray-400 hover:border-gray-200'
                            }`}
                        >
                            {c.replace('-', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Basic Details</label>
                <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="Listing Title (e.g. 2BHK near Phoenix Bay)" />
                <input name="address" required value={formData.address} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="Exact Location / Area Name" />
                
                <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                        <span className="absolute left-4 top-4 text-gray-400 font-bold">₹</span>
                        <input name="price" type="number" required value={formData.price} onChange={handleInputChange} className="w-full pl-8 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="Expected Price" />
                    </div>
                    <div className="relative">
                        <input name="area" type="number" required value={formData.area} onChange={handleInputChange} className="w-full pr-12 pl-4 py-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-bold focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="Area" />
                        <span className="absolute right-4 top-4 text-gray-400 text-xs font-bold uppercase">Sqft</span>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea name="description" required value={formData.description} onChange={handleInputChange} className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-medium h-32 focus:bg-white focus:border-brand-500 transition-all outline-none" placeholder="Describe your property (amenities, nearby landmarks, etc.)"></textarea>
            </div>
            
            <div className="space-y-4">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Photos (Max 10)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
                    {previewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 group shadow-sm border border-gray-200">
                            <img src={url} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 flex items-center justify-center bg-red-600/60 opacity-0 group-hover:opacity-100 transition-opacity text-white">
                                <X size={24} />
                            </button>
                        </div>
                    ))}
                    {previewUrls.length < 10 && (
                        <label className="aspect-square border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400 transition-colors">
                            <Upload size={24} /> 
                            <span className="text-[8px] mt-1 uppercase font-black tracking-tighter">Add Photo</span>
                            <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                        </label>
                    )}
                </div>
            </div>

            <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
                {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : 'PUBLISH LISTING'}
            </button>
          </form>
      </div>
    </div>
  );
};

export default AddProperty;
