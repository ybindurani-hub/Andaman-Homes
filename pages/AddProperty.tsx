
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, storage, auth } from '../firebase';
import { Upload, Loader2, MapPin, Ruler, BedDouble, Bath, Phone, X, IndianRupee, Compass, User, CreditCard } from 'lucide-react';
import firebase from 'firebase/compat/app';

// Extend window for Razorpay
declare global {
  interface Window {
    Razorpay: any;
  }
}

const AMENITIES_LIST = [
  "Parking", "Lift", "Gym", "Swimming Pool", "Power Backup", 
  "Security", "Club House", "Park", "Gas Pipeline", "Vastu Compliant", "Water Supply"
];

type CategoryType = 'rent' | 'sale-house' | 'sale-land';

const AddProperty: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const [category, setCategory] = useState<CategoryType>('rent'); 
  const [formData, setFormData] = useState({
    title: '',
    address: '',
    price: '',
    description: '',
    bedrooms: '',
    bathrooms: '',
    area: '',
    furnishing: 'semi',
    parking: 'both',
    floorNumber: '',
    totalFloors: '',
    facing: 'north',
    amenities: [] as string[],
    contactNumber: '',
    listedBy: 'owner',
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
      // We keep a count limit for display reasons, but remove quality/size limits
      if (imageFiles.length + newFiles.length > 20) {
        alert("Maximum 20 photos allowed for better listing performance.");
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

  const savePropertyToDb = async (paymentStatus: 'free' | 'paid', paymentId: string | null, amount: number) => {
    try {
        setLoadingText("Uploading photos...");
        
        const uploadPromises = imageFiles.map(async (file) => {
            // Firebase Storage handles all formats and sizes automatically
            const extension = file.name.split('.').pop();
            const storageRef = storage.ref(`properties/${Date.now()}_${Math.random().toString(36).substr(7)}.${extension}`);
            const snapshot = await storageRef.put(file);
            return snapshot.ref.getDownloadURL();
        });
        const imageUrls = await Promise.all(uploadPromises);

        setLoadingText("Finalizing listing...");

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
            ...(isLand && { facing: formData.facing }),
            amenities: formData.amenities,
            contactNumber: formData.contactNumber,
            listedBy: formData.listedBy,
            imageUrl: imageUrls[0], 
            imageUrls: imageUrls,   
            ownerId: auth.currentUser!.uid,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            paymentStatus: paymentStatus,
            paymentId: paymentId,
            paymentAmount: amount
        };

        await db.collection("properties").add(finalData);
        const userRef = db.collection('users').doc(auth.currentUser!.uid);
        
        if (paymentStatus === 'free') {
            await userRef.set({
                adsPosted: firebase.firestore.FieldValue.increment(1),
                freeAdsUsed: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        } else {
            await userRef.set({
                adsPosted: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });
        }

        navigate('/');
    } catch (error) {
        console.error("Error saving ad:", error);
        alert("Failed to save ad. Please try again.");
    } finally {
        setLoading(false);
        setLoadingText("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    if (imageFiles.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setLoading(true);
    setLoadingText("Checking limits...");

    try {
        const configDoc = await db.collection('settings').doc('ad_config').get();
        const { freeLimit = 10, adPrice = 30 } = configDoc.exists ? configDoc.data() as any : {};
        const userDoc = await db.collection('users').doc(auth.currentUser.uid).get();
        const userData = userDoc.data();
        const freeUsed = userData?.freeAdsUsed || 0;

        if (freeUsed < freeLimit) {
            await savePropertyToDb('free', null, 0);
        } else {
            setLoadingText("Initializing Payment...");
            const options = {
                key: "rzp_test_1DP5mmOlF5G5ag", 
                amount: adPrice * 100, 
                currency: "INR",
                name: "Andaman Homes",
                description: `Premium Ad Posting (Ad #${(userData?.adsPosted || 0) + 1})`,
                handler: async function (response: any) {
                    await savePropertyToDb('paid', response.razorpay_payment_id, adPrice);
                },
                prefill: {
                    name: auth.currentUser.displayName || "User",
                    email: auth.currentUser.email || "",
                },
                theme: { color: "#16a34a" },
                modal: { ondismiss: () => setLoading(false) }
            };

            if (window.Razorpay) {
                const rzp = new window.Razorpay(options);
                rzp.open();
            } else {
                alert("Payment gateway failed to load.");
                setLoading(false);
            }
        }
    } catch (error) {
        setLoading(false);
        alert("Something went wrong.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-brand-600 px-6 py-5">
            <h2 className="text-xl font-bold text-white">Post Your Ad</h2>
            <p className="text-brand-100 text-sm">Reach genuine buyers & tenants instantly</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
            <div className="space-y-3">
                <label className="text-sm font-bold text-gray-900 uppercase tracking-wide">I want to...</label>
                <div className="grid grid-cols-3 gap-3">
                    <button type="button" onClick={() => setCategory('rent')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'rent' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-gray-200 hover:border-brand-200'}`}>Rent Out</button>
                    <button type="button" onClick={() => setCategory('sale-house')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'sale-house' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:border-blue-200'}`}>Sell House</button>
                    <button type="button" onClick={() => setCategory('sale-land')} className={`py-3 px-2 rounded-xl border-2 text-sm font-bold transition-all ${category === 'sale-land' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 hover:border-purple-200'}`}>Sell Land</button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="e.g. 2 BHK Modern Apartment" />
                </div>
                
                <div className="col-span-1 md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Address</label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input type="text" name="address" required value={formData.address} onChange={handleInputChange} className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" placeholder="Locality, City" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                    <div className="relative">
                        <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                        <input type="number" name="price" required value={formData.price} onChange={handleInputChange} className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none" />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Listed By</label>
                    <select name="listedBy" value={formData.listedBy} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none bg-white">
                        <option value="owner">Owner</option>
                        <option value="broker">Broker</option>
                        <option value="builder">Builder</option>
                    </select>
                </div>
            </div>

            <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                <h3 className="text-sm font-bold text-gray-900 uppercase mb-4 tracking-wide">Property Features</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="col-span-2">
                         <label className="block text-xs font-medium text-gray-500 mb-1">Area (sq. ft)</label>
                         <div className="relative">
                            <Ruler className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input type="number" name="area" required value={formData.area} onChange={handleInputChange} className="w-full pl-9 px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                         </div>
                    </div>
                    {category !== 'sale-land' && (
                        <>
                            <div className="col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">BHK</label>
                                <input type="number" name="bedrooms" value={formData.bedrooms} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Furnishing</label>
                                <select name="furnishing" value={formData.furnishing} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white">
                                    <option value="unfurnished">Unfurnished</option>
                                    <option value="semi">Semi</option>
                                    <option value="fully">Fully</option>
                                </select>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium text-gray-700">Photos (Any format allowed)</label>
                <div className="grid grid-cols-5 gap-2 mb-2">
                    {previewUrls.map((url, i) => (
                        <div key={i} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                            <img src={url} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"><X size={10} /></button>
                        </div>
                    ))}
                </div>
                <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col items-center gap-1 text-sm text-gray-500">
                        <Upload size={24} /> <span>Upload High-Res Photos</span>
                    </div>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={handleImageChange} />
                </label>
                <p className="text-[10px] text-gray-400">All image sizes and qualities are supported. High-resolution photos help sell faster.</p>
            </div>

            <div className="pt-4">
                <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-70">
                    {loading ? <><Loader2 className="animate-spin" /> {loadingText}</> : 'Post Ad Now'}
                </button>
            </div>
          </form>
      </div>
    </div>
  );
};

export default AddProperty;
