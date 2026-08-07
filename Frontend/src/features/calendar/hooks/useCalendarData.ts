import { useQuery } from '@tanstack/react-query';
import { calendarApi } from '../api/calendarApi';
import type { CalendarDayDto, CalendarSettingsDto } from '../types/calendar.types';

export const calendarKeys = {
  all: ['calendar'] as const,
  range: (startDate: string, endDate: string) => [...calendarKeys.all, 'range', startDate, endDate] as const,
  settings: () => [...calendarKeys.all, 'settings'] as const,
};

export const useCalendarRange = (startDate: string, endDate: string, enabled = true) => {
  return useQuery<CalendarDayDto[]>({
    queryKey: calendarKeys.range(startDate, endDate),
    queryFn: () => calendarApi.getCalendarRange(startDate, endDate),
    enabled: Boolean(startDate && endDate && enabled),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useCalendarSettings = () => {
  return useQuery<CalendarSettingsDto>({
    queryKey: calendarKeys.settings(),
    queryFn: () => calendarApi.getCalendarSettings(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
};
