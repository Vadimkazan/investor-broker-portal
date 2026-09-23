const NBSP = '\u00A0';

const withSpaces = (n: number) =>
  Math.round(n).toLocaleString('ru-RU').replace(/\s/g, NBSP);

export const formatPrice = (value: number | string | null | undefined): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return `${withSpaces(n)}${NBSP}₽`;
};

export const formatPriceShort = (value: number | string | null | undefined): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return withSpaces(n);
};

export const formatPriceSigned = (value: number | string | null | undefined): string => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${withSpaces(n)}${NBSP}₽`;
};

export default formatPrice;
