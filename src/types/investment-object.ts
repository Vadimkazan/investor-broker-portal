export type PropertyType = 'apartments' | 'flats' | 'commercial' | 'country';
export type ObjectStatus = 'available' | 'reserved' | 'sold';

export interface InvestmentObject {
  id: number;
  title: string;
  type: PropertyType;
  city: string;
  address: string;
  price: number;
  yield: number;
  paybackPeriod: number;
  area: number;
  status: ObjectStatus;
  images: string[];
  videos?: string[];
  documents?: string[];
  description: string;
  brokerId: number;
  createdAt: string;
  monthlyIncome?: number;
  rentalYield?: number;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface ObjectFilters {
  search: string;
  cities: string[];
  types: PropertyType[];
  priceRange: [number, number];
  yieldRanges: string[];
  paybackRanges: string[];
  status?: ObjectStatus;
}

export interface Broker {
  id: number;
  name: string;
  company: string;
  photo: string;
  rating: number;
  phone: string;
  email: string;
  dealsCompleted: number;
}