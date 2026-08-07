import { useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi } from '../api/calendarApi';
import { calendarKeys } from './useCalendarData';
import type {
  CreateCalendarEventPayload,
  CreateCalendarNotePayload,
  UpdateCalendarEventPayload,
  UpdateCalendarNotePayload,
  UpdateCalendarSettingsPayload,
} from '../types/calendar.types';

export const useCalendarMutations = () => {
  const queryClient = useQueryClient();

  const invalidateCalendar = () => {
    queryClient.invalidateQueries({ queryKey: calendarKeys.all });
  };

  const createEventMutation = useMutation({
    mutationFn: (payload: CreateCalendarEventPayload) => calendarApi.createCalendarEvent(payload),
    onSuccess: invalidateCalendar,
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCalendarEventPayload }) =>
      calendarApi.updateCalendarEvent(id, payload),
    onSuccess: invalidateCalendar,
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => calendarApi.deleteCalendarEvent(id),
    onSuccess: invalidateCalendar,
  });

  const createNoteMutation = useMutation({
    mutationFn: (payload: CreateCalendarNotePayload) => calendarApi.createCalendarNote(payload),
    onSuccess: invalidateCalendar,
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateCalendarNotePayload }) =>
      calendarApi.updateCalendarNote(id, payload),
    onSuccess: invalidateCalendar,
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => calendarApi.deleteCalendarNote(id),
    onSuccess: invalidateCalendar,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: UpdateCalendarSettingsPayload) => calendarApi.updateCalendarSettings(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarKeys.settings() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.all });
    },
  });

  return {
    createEventMutation,
    updateEventMutation,
    deleteEventMutation,
    createNoteMutation,
    updateNoteMutation,
    deleteNoteMutation,
    updateSettingsMutation,
  };
};
