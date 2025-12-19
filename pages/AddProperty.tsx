
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
      // Fix: Explicitly cast Array.from to File[] to ensure 'file' is not inferred as 'unknown'
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
            const storageRef = storage.ref(`properties/${Date.now()}_${Math.random().toString(36).substr(7)}.${extension}`);
            // No compression - upload raw blob
            const snapshot = await storageRef.put(file);
            return snapshot.ref.getDownloadURL();
        });
        const imageUrls = await Promise.all(uploadPromises);

        setLoadingText("Publishing listing...");
        const isLand = category === 'sale-land';
        const finalData = {
            category: category === 'rent' ? 'rent' : 'sale',
            propertyType: isLand ? 'land' : 'house',
            title: formData.title,
            address: formData.address,
            price: Number(formData.price),
            description: formData.description,
            area: Number(formData.area),
            ...(!isLand && {
                bedrooms: Number(formData.bedrooms),
                bathrooms: Number(formData.bathrooms),
                furnishing: formData.furnishing,
                parking: formData.parking,
                floorNumber: formData.floorNumber,
                totalFloors: formData.totalFloors,
            }),
            amenities: formData.amenities,
            contactNumber: formData.contactNumber,
            listedBy: formData.listedBy,
            imageUrl: imageUrls[0], 
            imageUrls: imageUrls,   
            ownerId: auth.currentUser!.uid,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            paymentStatus, paymentId, paymentAmount: amount
        };

        await db.collection("properties").add(finalData);
        await db.collection('users').doc(auth.currentUser!.uid).set({
            adsPosted: firebase.firestore.FieldValue.increment(1),
            ...(paymentStatus === 'free' && { freeAdsUsed: firebase.firestore.FieldValue.increment(1) })
        }, { merge: true });

        navigate('/');
    } catch (error) {
        console.error("Error saving ad:", error);
        alert("Upload failed. Ensure you have a stable connection.");
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageFiles.length === 0) return alert("Upload at least one image.");
    setLoading(true);
    setLoadingText("Checking account...");

    const userDoc = await db.collection('users').doc(auth.currentUser!.uid).get();
    const freeUsed = userDoc.data()?.freeAdsUsed || 0;

    if (freeUsed < 10) {
        await savePropertyToDb('free', null, 0);
    } else {
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
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-brand-600 p-6 text-white"><h2 className="text-xl font-bold">New Property Ad</h2></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-3 gap-2">
                {['rent', 'sale-house', 'sale-land'].map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c as any)} className={`py-3 rounded-xl border-2 font-bold text-xs uppercase ${category === c ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-100 text-gray-400'}`}>{c.replace('-', ' ')}</button>
                ))}
            </div>
            <input name="title" required value={formData.title} onChange={handleInputChange} className="w-full p-3 border rounded-xl" placeholder="Listing Title" />
            <input name="address" required value={formData.address} onChange={handleInputChange} className="w-full p-3 border rounded-xl" placeholder="Full Address" />
            <div className="grid grid-cols-2 gap-4">
                <input name="price" type="number" required value={formData.price} onChange={handleInputChange} className="w-full p-3 border rounded-xl" placeholder="Price (₹)" />
                <input name="area" type="number" required value={formData.area} onChange={handleInputChange} className="w-full p-3 border rounded-xl" placeholder="Area (Sq. Ft)" />
            </div>
            <textarea name="description" required value={formData.description} onChange={handleInputChange} className="w-full p-3 border rounded-xl h-32" placeholder="Tell us more about the property..."></textarea>
            
            <div className="space-y-4">
                <label className="block text-sm font-bold text-gray-700">Property Photos</label>
                <div className="grid grid-cols-4 gap-3">
                    {previewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group">
                            <img src={url} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity text-white"><X /></button>
                        </div>
                    ))}
                    <label className="aspect-square border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 text-gray-400">
                        <Upload size={24} /> <span className="text-[10px] mt-1 uppercase font-bold">Add Photo</span>
                        <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                    </label>
                </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-brand-600 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2">
                {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : 'Publish Ad'}
            </button>
          </form>
      </div>
    </div>
  );
};

export default AddProperty;
