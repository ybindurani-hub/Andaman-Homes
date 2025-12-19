
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { db, auth } from '../firebase';
import firebase from 'firebase/compat/app';
import { Loader2, CheckCircle, ShieldCheck } from 'lucide-react';

const PaymentPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { propertyData } = location.state || {};
    const [loading, setLoading] = useState(false);

    // Redirect if no data found
    useEffect(() => {
        if (!propertyData) {
            navigate('/add-property');
        }
    }, [propertyData, navigate]);

    const handlePaymentConfirmation = async () => {
        setLoading(true);
        try {
            if (!auth.currentUser) return;

            // 1. Save the Property to 'properties' collection
            await db.collection("properties").add({
                ...propertyData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // 2. Increment user's ad usage
            await db.collection('users').doc(auth.currentUser.uid).set({
                freeAdsUsed: firebase.firestore.FieldValue.increment(1)
            }, { merge: true });

            alert("Payment Verified! Your ad is now live.");
            navigate('/');

        } catch (error) {
            console.error("Payment processing error:", error);
            alert("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!propertyData) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
                <div className="bg-brand-900 p-6 text-center">
                    <h2 className="text-2xl font-bold text-white">Complete Your Listing</h2>
                    <p className="text-brand-100 mt-2">Pay ₹20 to publish your ad</p>
                </div>

                <div className="p-8 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-xl mb-6 border-2 border-brand-100 shadow-inner flex flex-col items-center justify-center w-full">
                        <img 
                           src="/payment-qr.png"
                           alt="Scan to Pay"
                           className="w-56 h-56 object-contain rounded-lg border border-gray-100"
                           onError={(e) => {
                               const target = e.currentTarget;
                               target.src = "https://api.qrserver.com/v1/create-qr-code/?size=225x225&data=upi://pay?pa=merchant@upi&pn=AndamanHomes&am=20.00&cu=INR";
                               target.onerror = null; 
                           }}
                        />
                        <p className="text-center text-xs text-gray-500 mt-3 font-medium">Scan with GPay, PhonePe, or Paytm</p>
                    </div>

                    <div className="text-center space-y-2 mb-8">
                        <div className="text-3xl font-bold text-gray-900">₹20.00</div>
                        <p className="text-sm text-gray-600">Listing Fee for: <span className="font-semibold">{propertyData.title}</span></p>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg flex items-start gap-3 w-full mb-8">
                        <ShieldCheck className="text-blue-600 flex-shrink-0" size={20} />
                        <div className="text-sm text-blue-800">
                            <strong>Secure Payment:</strong> Your listing remains active for 30 days. Genuine leads, no brokerage.
                        </div>
                    </div>

                    <button
                        onClick={handlePaymentConfirmation}
                        disabled={loading}
                        className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg transform transition hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            <>
                                <CheckCircle size={20} /> I Have Paid
                            </>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => navigate('/add-property')}
                        className="mt-4 text-gray-500 text-sm hover:underline"
                    >
                        Cancel Transaction
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;
