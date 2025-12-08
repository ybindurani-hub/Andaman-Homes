
export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  imageUrl: string; // Primary thumbnail
  imageUrls?: string[]; // Array of all images
  bedrooms: number;
  bathrooms: number;
  area: number; // in sqft
  ownerId: string;
  createdAt: any; // Can be number or Firestore Timestamp
  // New fields for full functionality
  type: 'rent' | 'sale';
  amenities: string[];
  contactNumber: string;
  // Status for managing lifecycle
  status?: 'active' | 'sold' | 'rented' | 'expired' | 'occupied';
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  freeAdsUsed?: number;
}
