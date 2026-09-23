export const MY_PROPERTIES_URL = 'https://functions.poehali.dev/0ba0b9bd-3805-4a0a-9da3-f07a49b5fcaf';

export const PROPERTY_KIND_LABELS: Record<string, string> = {
  flats: 'Квартира',
  apartments: 'Апартаменты',
  commercial: 'Коммерческая',
  country: 'Загородная',
  land: 'Земля',
  garage: 'Гараж / паркинг',
};

export interface MyProperty {
  id: number;
  title: string;
  propertyType: string;
  city: string;
  address: string;
  purchasePrice: number;
  purchaseDate: string | null;
  currentValue: number;
  monthlyIncome: number;
  imageUrl: string | null;
  notes: string;
  createdAt: string | null;
}

export interface MyPropertySummary {
  count: number;
  totalInvested: number;
  totalValue: number;
  growth: number;
  growthPercent: number;
  monthlyIncome: number;
  yearlyIncome: number;
  yieldPercent: number;
}

export interface MyPropertyInput {
  title: string;
  propertyType: string;
  city: string;
  address: string;
  purchasePrice: string;
  purchaseDate: string;
  currentValue: string;
  monthlyIncome: string;
  imageUrl: string;
  notes: string;
}

export const formatMoney = (value: number): string => {
  if (!value) return '0\u00A0₽';
  return `${Math.round(value).toLocaleString('ru-RU').replace(/\s/g, '\u00A0')}\u00A0₽`;
};
