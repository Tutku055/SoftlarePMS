export interface MonthlyTimesheet {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  totalWorkedDays: number;
  totalOvertimeHours: number;
  totalAbsentDays: number;
  entries: TimesheetEntry[];
  isPreviousYearPendingClosure?: boolean;
  isLocked: boolean;
}

export interface TimesheetEntry {
  id: string;
  monthlyTimesheetId: string;
  date: string;
  status: number; // matches backend TimesheetStatus enum: 1=Worked, 2=Weekend, 3=PaidLeave, 4=UnpaidLeave, 5=Absent, 6=Holiday
  overtimeHours: number;
  overtimeTypeId?: string;
  salaryType: number;
  workedHours: number;
  paidLeaveHours: number;
  unpaidLeaveHours: number;
}

export interface PayrollSlipLineItem {
  id: string;
  itemType: number; // 1 = Earning, 2 = Deduction
  description: string;
  amount: number;
}

export interface PayrollSlip {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  baseSalary: string;
  totalEarnings: string;
  totalDeductions: string;
  netSalary: string;
  salaryTypes: string;
  issueDate: string;
  lineItems: PayrollSlipLineItem[];
}

export interface UpdateTimesheetEntryCommand {
  entryId: string;
  status: number;
  overtimeHours: number;
  overtimeTypeId?: string;
  workedHours: number;
  paidLeaveHours: number;
  unpaidLeaveHours: number;
}

export interface CalculateMonthlyPayrollCommand {
  employeeId: string;
  year: number;
  month: number;
}

export interface GenerateMonthlyTimesheetCommand {
  employeeId: string;
  year: number;
  month: number;
}

// Sent to POST /employees/{employeeId}/compensations
export interface UpdateCompensationCommand {
  baseSalary: number;
  salaryType: number; // 1=Hourly, 2=Monthly
  currency: number;   // 1=TRY, etc.
  effectiveDate: string;
}

export interface OvertimeType {
  id: string;
  name: string;
  multiplier: number;
  isActive: boolean;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const BulkTimesheetAction = {
  GenerateTimesheet: 1,
  ApplyStatus: 2,
  Lock: 3,
  Unlock: 4,
  ApplyOvertime: 5,
  ApplyLeaveHours: 6,
} as const;

export type BulkTimesheetAction = typeof BulkTimesheetAction[keyof typeof BulkTimesheetAction];

export const BulkTimesheetScope = {
  AllActive: 1,
  Department: 2,
  Selected: 3,
} as const;

export type BulkTimesheetScope = typeof BulkTimesheetScope[keyof typeof BulkTimesheetScope];

export const BulkTimesheetPeriodType = {
  Day: 1,
  Month: 2,
  DayInterval: 3,
} as const;

export type BulkTimesheetPeriodType = typeof BulkTimesheetPeriodType[keyof typeof BulkTimesheetPeriodType];

export interface BulkTimesheetOperationRequest {
  action: BulkTimesheetAction;
  scope: BulkTimesheetScope;
  periodType: BulkTimesheetPeriodType;
  year: number;
  month: number;
  day?: number;
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeIds?: string[];
  status?: number;
  overtimeHours?: number;
  overtimeTypeId?: string;
  paidLeaveHours?: number;
  unpaidLeaveHours?: number;
}

export interface BulkOperationResultDto {
  processed: number;
  skipped: number;
  skippedReasons: Record<string, string[]>;
}
