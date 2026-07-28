export interface CurrencyConfig {
  id: number;
  code: string;
  symbol: string;
  label: string;
}

export const CURRENCY_CONFIGS: Record<number, CurrencyConfig> = {
  1: { id: 1, code: 'TRY', symbol: '₺', label: 'TRY - Turkish Lira (₺)' },
  2: { id: 2, code: 'USD', symbol: '$', label: 'USD - US Dollar ($)' },
  3: { id: 3, code: 'EUR', symbol: '€', label: 'EUR - Euro (€)' },
  4: { id: 4, code: 'GBP', symbol: '£', label: 'GBP - British Pound (£)' },
};

export const getCurrencySymbol = (currencyId: number): string => {
  return CURRENCY_CONFIGS[currencyId]?.symbol || '';
};

export const getCurrencyCode = (currencyId: number): string => {
  return CURRENCY_CONFIGS[currencyId]?.code || '';
};

export const formatCompensationAmount = (baseSalary: number | string, currencyId: number, salaryTypeId: number): string => {
  const symbol = getCurrencySymbol(currencyId);
  const unit = salaryTypeId === 1 ? ' / h' : ' / m';
  return `${baseSalary}${symbol}${unit}`;
};
