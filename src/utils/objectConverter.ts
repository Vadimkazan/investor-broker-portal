import { InvestmentObjectDB } from '@/services/api';
import { InvestmentObject } from '@/types/investment-object';

type RawObject = InvestmentObjectDB & {
  brokerId?: number;
  propertyType?: string;
  yieldPercent?: number;
  paybackYears?: number;
  createdAt?: string;
  broker?: { id: number; name: string; email: string; phone?: string; city?: string; club?: string };
};

export const convertDBObjectToFrontend = (input: InvestmentObjectDB): InvestmentObject => {
  const obj = input as RawObject;
  return {
    id: obj.id,
    title: obj.title,
    city: obj.city,
    address: obj.address,
    type: (obj.property_type ?? obj.propertyType) as InvestmentObject['type'],
    price: obj.price,
    yield: Number(obj.yield_percent ?? obj.yieldPercent ?? 0),
    paybackPeriod: Number(obj.payback_years ?? obj.paybackYears ?? 0),
    area: obj.area || 0,
    images: obj.images || [],
    videos: obj.videos || [],
    documents: obj.documents || [],
    description: obj.description || '',
    status: obj.status,
    createdAt: obj.created_at || obj.createdAt || new Date().toISOString(),
    brokerId: obj.broker_id ?? obj.brokerId ?? 0,
    broker: obj.broker,
    minInvestment: obj.min_investment,
    monthlyPayment: obj.monthly_payment,
    strategy: obj.strategy,
    dealCycle: obj.deal_cycle,
    presentationLink: obj.presentation_link,
    investmentDecision: obj.investment_decision
  };
};

export const convertFrontendToDBObject = (obj: InvestmentObject): Omit<InvestmentObjectDB, 'id' | 'created_at'> => {
  return {
    title: obj.title,
    city: obj.city,
    address: obj.address,
    property_type: obj.type as InvestmentObjectDB['property_type'],
    area: obj.area,
    price: obj.price,
    yield_percent: obj.yield,
    payback_years: obj.paybackPeriod,
    description: obj.description,
    images: obj.images,
    videos: obj.videos || [],
    documents: obj.documents || [],
    status: obj.status,
    broker_id: obj.brokerId
  };
};