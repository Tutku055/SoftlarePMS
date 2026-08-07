import { apiClient } from '../../../config/apiClient';
import type {
  CalendarDayDto,
  CalendarEventDto,
  CalendarNoteDto,
  CalendarSettingsDto,
  CreateCalendarEventPayload,
  CreateCalendarNotePayload,
  UpdateCalendarEventPayload,
  UpdateCalendarNotePayload,
  UpdateCalendarSettingsPayload,
} from '../types/calendar.types';

export const calendarApi = {
  getCalendarRange: async (startDate: string, endDate: string): Promise<CalendarDayDto[]> => {
    const { data } = await apiClient.get<CalendarDayDto[]>('/calendar/range', {
      params: { startDate, endDate },
    });
    return data;
  },

  getMonthlyCalendar: async (year: number, month: number): Promise<CalendarDayDto[]> => {
    const { data } = await apiClient.get<CalendarDayDto[]>('/calendar/monthly', {
      params: { year, month },
    });
    return data;
  },

  getCalendarEvent: async (id: string): Promise<CalendarEventDto> => {
    const { data } = await apiClient.get<CalendarEventDto>(`/calendar/events/${id}`);
    return data;
  },

  createCalendarEvent: async (payload: CreateCalendarEventPayload): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>('/calendar/events', payload);
    return data;
  },

  updateCalendarEvent: async (id: string, payload: UpdateCalendarEventPayload): Promise<void> => {
    await apiClient.put(`/calendar/events/${id}`, payload);
  },

  deleteCalendarEvent: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/events/${id}`);
  },

  getCalendarNote: async (id: string): Promise<CalendarNoteDto> => {
    const { data } = await apiClient.get<CalendarNoteDto>(`/calendar/notes/${id}`);
    return data;
  },

  createCalendarNote: async (payload: CreateCalendarNotePayload): Promise<{ id: string }> => {
    const { data } = await apiClient.post<{ id: string }>('/calendar/notes', payload);
    return data;
  },

  updateCalendarNote: async (id: string, payload: UpdateCalendarNotePayload): Promise<void> => {
    await apiClient.put(`/calendar/notes/${id}`, payload);
  },

  deleteCalendarNote: async (id: string): Promise<void> => {
    await apiClient.delete(`/calendar/notes/${id}`);
  },

  getCalendarSettings: async (): Promise<CalendarSettingsDto> => {
    const { data } = await apiClient.get<CalendarSettingsDto>('/calendar/settings');
    return data;
  },

  updateCalendarSettings: async (payload: UpdateCalendarSettingsPayload): Promise<void> => {
    await apiClient.put('/calendar/settings', payload);
  },
};
