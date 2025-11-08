import { InvestmentObjectDB } from '@/services/api';
import { InvestmentObject } from '@/types/investment-object';

export const convertDBObjectToFrontend = (obj: InvestmentObjectDB): InvestmentObject => {
  return {
    id: obj.id,
    title: obj.title,
    city: obj.city,
    address: obj.address,
    type: obj.property_type,
    price: obj.price,
    yield: obj.yield_percent,
    paybackPeriod: obj.payback_years,
    area: obj.area || 0,
    images: obj.images || [],
    videos: obj.videos || [],
    documents: obj.documents || [],
    description: obj.description || '',
    status: obj.status,
    createdAt: obj.created_at || new Date().toISOString(),
    brokerId: obj.broker_id || 1,
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
    property_type: obj.type,
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