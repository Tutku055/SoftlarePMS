export interface MonthlyTimesheet {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  totalWorkedDays: number;
  totalOvertimeHours: number;
  totalAbsentDays: number;
  entries: TimesheetEntry[];
}

export interface TimesheetEntry {
  id: string;
  monthlyTimesheetId: string;
  date: string;
  status: number; // matches backend TimesheetStatus enum: 1=Worked, 2=Weekend, 3=PaidLeave, 4=UnpaidLeave, 5=Absent, 6=Holiday
  overtimeHours: number;
}

export interface PayrollSlip {
  id: string;
  employeeId: string;
  year: number;
  month: number;
  baseSalary: number;
  totalEarnings: number;
  totalDeductions: number;
  netSalary: number;
  issueDate: string;
}

export interface UpdateTimesheetEntryCommand {
  entryId: string;
  status: number;
  overtimeHours: number;
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
