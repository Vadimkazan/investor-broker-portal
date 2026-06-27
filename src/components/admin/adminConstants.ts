export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const ROLE_LABELS: Record<string, string> = {
  investor: 'Инвестор',
  broker: 'Брокер',
  admin: 'Админ',
  manager: 'Менеджер'
};

export const STATUS_LABELS: Record<string, string> = {
  available: 'Свободен',
  reserved: 'Бронь',
  sold: 'Продано'
};

export { PROPERTY_TYPE_LABELS as TYPE_LABELS } from '@/types/investment-object';

export type DeleteConfirm = { type: 'user' | 'object'; id: number; name: string };