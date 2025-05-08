export interface Currency {
  code: string; // e.g., USD, EUR
  symbol: string; // e.g., $, €
  name: string; // e.g., United States Dollar
}

export const SUPPORTED_CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'United States Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'ZAR', symbol: 'R', name: 'South African Rand' },
  { code: 'CAD', symbol: '$', name: 'Canadian Dollar' },
];

export const DEFAULT_CURRENCY_CODE = 'USD';

export const findCurrencyByCode = (code: string): Currency | undefined => {
  return SUPPORTED_CURRENCIES.find(c => c.code === code);
};

export const getDefaultCurrency = (): Currency => {
  const defaultCurrency = findCurrencyByCode(DEFAULT_CURRENCY_CODE);
  if (!defaultCurrency) {
    // Fallback if DEFAULT_CURRENCY_CODE is somehow not in SUPPORTED_CURRENCIES
    // This should ideally not happen if constants are well-defined.
    return SUPPORTED_CURRENCIES[0] || { code: 'USD', symbol: '$', name: 'United States Dollar' };
  }
  return defaultCurrency;
};

