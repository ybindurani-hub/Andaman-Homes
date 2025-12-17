
export interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  imageUrl: string; // Primary thumbnail
  imageUrls?: string[]; // Array of all images
  ownerId: string;
  createdAt: any; 
  
  // Category & Type
  category: 'rent' | 'sale'; // rent or sale
  propertyType: 'house' | 'apartment' | 'land' | 'commercial'; // Sub-type
  
  // House/Apartment Specifics
  bedrooms?: number;
  bathrooms?: number;
  furnishing?: 'fully' | 'semi' | 'unfurnished';
  parking?: 'bike' | 'car' | 'both' | 'none';
  floorNumber?: string; // e.g., "G", "1", "2"
  totalFloors?: string;
  
  // Land Specifics
  area: number; // Used for Built-up Area (House) or Plot Area (Land) in sqft
  plotDimensions?: string; // e.g. 30x40
  facing?: 'north' | 'south' | 'east' | 'west' | 'ne' | 'nw' | 'se' | 'sw';
  
  // Metadata
  amenities: string[];
  contactNumber?: string;
  listedBy: 'owner' | 'broker' | 'builder';
  
  // Lifecycle
  status?: 'active' | 'sold' | 'rented' | 'expired' | 'occupied';
  
  // Payment Info
  paymentStatus?: 'free' | 'paid';
  paymentId?: string;
  paymentAmount?: number;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  freeAdsUsed: number;
  adsPosted: number;
}

export interface AdSettings {
  freeLimit: number;
  adPrice: number;
}
