export const VisibilityLevel = {
  Standard: 1,
  Confidential: 2,
} as const;

export type VisibilityLevel = (typeof VisibilityLevel)[keyof typeof VisibilityLevel];

export const VirtualEventType = {
  Holiday: 1,
  Birthday: 2,
} as const;

export type VirtualEventType = (typeof VirtualEventType)[keyof typeof VirtualEventType];

export const CalendarEventType = {
  TimeBased: 1,
  AllDay: 2,
  MultiDay: 3,
} as const;

export type CalendarEventType = (typeof CalendarEventType)[keyof typeof CalendarEventType];

export interface CalendarEventDto {
  id: string;
  title: string;
  description?: string | null;
  startTime: string; // ISO DateTimeOffset
  endTime: string;   // ISO DateTimeOffset
  eventType: CalendarEventType;
  reminderThresholdDays: number;
  sendEmailReminder: boolean;
  visibilityLevel: VisibilityLevel;
  departmentId?: string | null;
  departmentName?: string | null;
  userId?: string | null;
  authorName?: string | null;
  createdAt: string;
}

export interface CalendarNoteDto {
  id: string;
  userId: string;
  authorName?: string | null;
  noteDate: string;  // YYYY-MM-DD
  content: string;
  colorCode: string;
  visibilityLevel: VisibilityLevel;
  createdAt: string;
}

export interface VirtualCalendarEventDto {
  id: string;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  type: VirtualEventType;
  referenceId?: string | null;
  colorCode: string;
}

export interface CalendarDayDto {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  dayOfWeek: string;
  isToday: boolean;
  isWeekend: boolean;
  notes: CalendarNoteDto[];
  physicalEvents: CalendarEventDto[];
  virtualEvents: VirtualCalendarEventDto[];
}

export interface CalendarSettingsDto {
  holidayCountryCode: string;
  holidayReminderDays: number;
  sendEmailForHolidays: boolean;
  birthdayReminderDays: number;
  sendEmailForBirthdays: boolean;
  companyTimezoneOffsetMinutes: number;
}

export interface CreateCalendarEventPayload {
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  eventType?: CalendarEventType;
  reminderThresholdDays: number;
  sendEmailReminder: boolean;
  visibilityLevel?: VisibilityLevel;
  departmentId?: string | null;
}

export interface UpdateCalendarEventPayload {
  id: string;
  title: string;
  description?: string | null;
  startTime: string;
  endTime: string;
  eventType?: CalendarEventType;
  reminderThresholdDays: number;
  sendEmailReminder: boolean;
  visibilityLevel?: VisibilityLevel;
  departmentId?: string | null;
}

export interface CreateCalendarNotePayload {
  noteDate: string;
  content: string;
  colorCode: string;
  visibilityLevel: VisibilityLevel;
}

export interface UpdateCalendarNotePayload {
  id: string;
  noteDate: string;
  content: string;
  colorCode: string;
  visibilityLevel: VisibilityLevel;
}

export interface UpdateCalendarSettingsPayload {
  holidayCountryCode: string;
  holidayReminderDays: number;
  sendEmailForHolidays: boolean;
  birthdayReminderDays: number;
  sendEmailForBirthdays: boolean;
  companyTimezoneOffsetMinutes: number;
}

export type CalendarViewMode = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarFilters {
  showPhysicalEvents: boolean;
  showHolidays: boolean;
  showBirthdays: boolean;
  showNotes: boolean;
}

export interface CalendarItemClickEvent {
  type: 'physicalEvent' | 'note' | 'virtualEvent';
  item: CalendarEventDto | CalendarNoteDto | VirtualCalendarEventDto;
}
