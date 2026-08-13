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

export const DEFAULT_CURRENCY_ID = 1;
export const DEFAULT_LOCALE = 'en-US';

/**
 * Returns localized month name in English by default (e.g. 1 -> "January", 2 -> "February").
 */
export const formatMonthName = (month: number, locale: string = DEFAULT_LOCALE): string => {
  return new Date(2000, month - 1, 1).toLocaleDateString(locale, { month: 'long' });
};

/**
 * Finds CurrencyConfig whether the input is a numeric ID (1), numeric string ("1"), or currency code ("TRY").
 */
export const getCurrencyConfig = (currency: number | string | undefined | null): CurrencyConfig | undefined => {
  if (currency === undefined || currency === null) return undefined;
  if (typeof currency === 'number') {
    return CURRENCY_CONFIGS[currency];
  }
  const numericId = Number(currency);
  if (!isNaN(numericId) && CURRENCY_CONFIGS[numericId]) {
    return CURRENCY_CONFIGS[numericId];
  }
  const upperCode = String(currency).trim().toUpperCase();
  return Object.values(CURRENCY_CONFIGS).find(c => c.code === upperCode);
};

export const getCurrencySymbol = (currency: number | string | undefined | null): string => {
  const config = getCurrencyConfig(currency);
  if (config) return config.symbol;
  if (typeof currency === 'string' && isNaN(Number(currency))) return currency;
  return '';
};

export const getCurrencyCode = (currency: number | string | undefined | null): string => {
  const config = getCurrencyConfig(currency);
  if (config) return config.code;
  if (typeof currency === 'string' && isNaN(Number(currency))) return currency;
  return '';
};

export const getCurrencyLabel = (currency: number | string | undefined | null): string => {
  const config = getCurrencyConfig(currency);
  return config?.label || String(currency || '');
};

export const formatCompensationAmount = (
  baseSalary: number | string,
  currency: number | string | undefined | null,
  salaryTypeId: number,
  locale: string = DEFAULT_LOCALE
): string => {
  const code = getCurrencyCode(currency) || 'TRY';
  const num = typeof baseSalary === 'string' ? parseFloat(baseSalary.replace(',', '.')) : baseSalary;
  const formattedNum = !isNaN(num)
    ? new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
    : String(baseSalary);
  const unit = salaryTypeId === 1 ? ' / h' : ' / m';
  return `${formattedNum} ${code}${unit}`;
};

/**
 * Parses raw slip amount strings (e.g. "15000.00 TRY", "15000,00 EUR", "15000") into numeric amount and currency code.
 */
export const parseSlipAmount = (raw: string | number | undefined | null): { amount: number; currencyCode: string } => {
  if (raw === undefined || raw === null) return { amount: 0, currencyCode: '' };
  if (typeof raw === 'number') return { amount: raw, currencyCode: '' };
  const parts = String(raw).trim().split(/\s+/);
  const numberString = parts[0]?.replace(',', '.') || '0';
  return { amount: parseFloat(numberString) || 0, currencyCode: parts[1] || '' };
};

/**
 * Standard industry format for payroll slips, invoices, and financial reports:
 * E.g. "15,000.00 TRY", "1,500.00 EUR", "-500.00 TRY" using dynamic user/browser locale.
 */
export const formatSlipAmount = (
  rawAmount: number | string | undefined | null,
  currency?: number | string | null,
  negative = false,
  locale: string = DEFAULT_LOCALE
): string => {
  if (rawAmount === undefined || rawAmount === null) return '0.00';
  let num = 0;
  let code = getCurrencyCode(currency);

  if (typeof rawAmount === 'string' && isNaN(Number(rawAmount))) {
    const parsed = parseSlipAmount(rawAmount);
    num = parsed.amount;
    if (!code && parsed.currencyCode) {
      code = getCurrencyCode(parsed.currencyCode) || parsed.currencyCode;
    }
  } else {
    num = typeof rawAmount === 'string' ? parseFloat(rawAmount) : rawAmount;
    if (isNaN(num)) num = 0;
  }

  const formatted = new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Math.abs(num));
  const prefix = negative && num > 0 ? '-' : (num < 0 ? '-' : '');
  return `${prefix}${formatted}${code ? ` ${code}` : ''}`;
};

/**
 * Returns localized period display in English by default (e.g. "August 2026").
 */
export const formatPeriodDisplay = (year: number, month: number, locale: string = DEFAULT_LOCALE): string => {
  try {
    const date = new Date(year, month - 1, 1);
    return date.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  } catch {
    return `${String(month).padStart(2, '0')}/${year}`;
  }
};



/**
 * Broadly sanitizes unicode and international characters (accents, umlauts, cedillas, ogoneks, carons, strokes, ligatures)
 * across all languages so standard PDF fonts render cleanly without corrupted glyphs, question marks, or broken text.
 */
export const sanitizeForPdf = (text: string | null | undefined): string => {
  if (!text) return '';
  return String(text)
    .replace(/ß/g, 'ss')
    .replace(/ẞ/g, 'SS')
    .replace(/æ/g, 'ae')
    .replace(/Æ/g, 'AE')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/ø/g, 'o')
    .replace(/Ø/g, 'O')
    .replace(/ł/g, 'l')
    .replace(/Ł/g, 'L')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/ı/g, 'i')
    .replace(/İ/g, 'I')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
};

/**
 * Returns an international, English-by-default period string sanitized for PDF generation.
 */
export const formatPeriodForPdf = (year: number, month: number, locale: string = DEFAULT_LOCALE): string => {
  const localized = formatPeriodDisplay(year, month, locale);
  return sanitizeForPdf(localized);
};



