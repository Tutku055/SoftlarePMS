export const DEFAULT_LOCALE = 'en-US';

export const formatDateDisplay = (date: Date | string | null | undefined, locale: string = DEFAULT_LOCALE): string => {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' });
};
