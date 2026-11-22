export const CALENDAR_DAY_STATUSES = ["locked", "ready", "opened"] as const;

export type CalendarDayStatus = (typeof CALENDAR_DAY_STATUSES)[number];

export interface CalendarDaySummary {
  dayNumber: number;
  status: CalendarDayStatus;
}

export interface CalendarDayListResponse {
  days: CalendarDaySummary[];
}

export interface OpenedGiftDetails {
  dayNumber: number;
  status: "opened";
  title: string;
  description: string;
  imageUrl: string;
}
