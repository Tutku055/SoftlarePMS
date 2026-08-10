export const padZero = (n: number): string => (n < 10 ? `0${n}` : `${n}`);

export const formatDateToIso = (d: Date): string => {
  const year = d.getFullYear();
  const month = padZero(d.getMonth() + 1);
  const day = padZero(d.getDate());
  return `${year}-${month}-${day}`;
};

export const parseDateOnly = (dateStr: string): Date => {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

export const toLocalISOStringWithOffset = (date: Date): string => {
  const pad = (n: number, length: number = 2) => String(n).padStart(length, '0');
  const tzOffset = -date.getTimezoneOffset(); // in minutes
  const diff = tzOffset >= 0 ? '+' : '-';
  const offsetHours = pad(Math.floor(Math.abs(tzOffset) / 60));
  const offsetMinutes = pad(Math.abs(tzOffset) % 60);

  return date.getFullYear() +
      '-' + pad(date.getMonth() + 1) +
      '-' + pad(date.getDate()) +
      'T' + pad(date.getHours()) +
      ':' + pad(date.getMinutes()) +
      ':' + pad(date.getSeconds()) +
      '.' + pad(date.getMilliseconds(), 3) +
      diff + offsetHours + ':' + offsetMinutes;
};

export const getMonthGridRange = (currentDate: Date): { startDate: string; endDate: string; dates: Date[] } => {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // First day of current month
  const firstOfMonth = new Date(year, month, 1);
  // Day of week: 0 is Sunday, 1 is Monday... convert so Monday is 0, Sunday is 6
  let dayOfWeek = firstOfMonth.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6;

  // Grid start (Monday of the first week row)
  const gridStart = new Date(year, month, 1 - dayOfWeek);

  // We generate exactly 35 or 42 days (5 or 6 weeks)
  const lastOfMonth = new Date(year, month + 1, 0);
  let lastDayOfWeek = lastOfMonth.getDay() - 1;
  if (lastDayOfWeek < 0) lastDayOfWeek = 6;
  const daysAfter = 6 - lastDayOfWeek;

  const totalDays = dayOfWeek + lastOfMonth.getDate() + daysAfter;
  const targetCells = totalDays > 35 ? 42 : 35;

  const dates: Date[] = [];
  for (let i = 0; i < targetCells; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + i);
    dates.push(cellDate);
  }

  const startDate = formatDateToIso(dates[0]);
  const endDate = formatDateToIso(dates[dates.length - 1]);

  return { startDate, endDate, dates };
};

export const getWeekRange = (currentDate: Date): { startDate: string; endDate: string; dates: Date[] } => {
  const d = new Date(currentDate);
  let dayOfWeek = d.getDay() - 1;
  if (dayOfWeek < 0) dayOfWeek = 6; // Monday = 0, Sunday = 6

  const monday = new Date(d);
  monday.setDate(d.getDate() - dayOfWeek);

  const dates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const weekDate = new Date(monday);
    weekDate.setDate(monday.getDate() + i);
    dates.push(weekDate);
  }

  const startDate = formatDateToIso(dates[0]);
  const endDate = formatDateToIso(dates[6]);

  return { startDate, endDate, dates };
};

export const getDayRange = (currentDate: Date): { startDate: string; endDate: string; dates: Date[] } => {
  const iso = formatDateToIso(currentDate);
  return { startDate: iso, endDate: iso, dates: [new Date(currentDate)] };
};

export const getAgendaRange = (currentDate: Date, days = 30): { startDate: string; endDate: string; dates: Date[] } => {
  const dates: Date[] = [];
  const start = new Date(currentDate);
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d);
  }
  const startDate = formatDateToIso(dates[0]);
  const endDate = formatDateToIso(dates[dates.length - 1]);
  return { startDate, endDate, dates };
};

export const formatTimeDisplay = (isoDateTime: string): string => {
  try {
    const date = new Date(isoDateTime);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return '';
  }
};

export const formatRangeLabel = (
  mode: 'month' | 'week' | 'day' | 'agenda',
  currentDate: Date
): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  if (mode === 'month') {
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
  }

  if (mode === 'week') {
    const { dates } = getWeekRange(currentDate);
    const first = dates[0];
    const last = dates[6];
    if (first.getMonth() === last.getMonth()) {
      return `${monthNames[first.getMonth()]} ${first.getDate()} – ${last.getDate()}, ${first.getFullYear()}`;
    }
    return `${monthNames[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${monthNames[last.getMonth()].slice(0, 3)} ${last.getDate()}, ${last.getFullYear()}`;
  }

  if (mode === 'day') {
    return `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
  }

  // Agenda mode
  const { dates } = getAgendaRange(currentDate, 30);
  const first = dates[0];
  const last = dates[dates.length - 1];
  return `Agenda: ${monthNames[first.getMonth()].slice(0, 3)} ${first.getDate()} – ${monthNames[last.getMonth()].slice(0, 3)} ${last.getDate()}`;
};
