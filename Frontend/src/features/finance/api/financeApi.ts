import { apiClient } from '../../../config/apiClient';
import type { MonthlyTimesheet, PayrollSlip, UpdateTimesheetEntryCommand, CalculateMonthlyPayrollCommand, GenerateMonthlyTimesheetCommand } from '../types';

export const financeApi = {
  getMonthlyTimesheet: async (employeeId: string, year: number, month: number) => {
    const { data } = await apiClient.get<MonthlyTimesheet>(`/employees/${employeeId}/timesheets/${year}/${month}`);
    return data;
  },
  generateMonthlyTimesheet: async (command: GenerateMonthlyTimesheetCommand) => {
    const { data } = await apiClient.post<string>(`/employees/${command.employeeId}/timesheets`, command);
    return data;
  },
  updateTimesheetEntry: async (employeeId: string, entryId: string, command: UpdateTimesheetEntryCommand) => {
    const { data } = await apiClient.put<boolean>(`/employees/${employeeId}/timesheets/entries/${entryId}`, command);
    return data;
  },
  getPayrollSlips: async (employeeId: string) => {
    const { data } = await apiClient.get<PayrollSlip[]>(`/employees/${employeeId}/payrolls`);
    return data;
  },
  calculatePayroll: async (command: CalculateMonthlyPayrollCommand) => {
    const { data } = await apiClient.post<string>(`/employees/${command.employeeId}/payrolls/calculate`, command);
    return data;
  },
  updateCompensation: async (employeeId: string, command: any) => {
    const { data } = await apiClient.post<string>(`/employees/${employeeId}/compensations`, command);
    return data;
  },
  editCompensation: async (employeeId: string, id: string, command: any) => {
    const { data } = await apiClient.put(`/employees/${employeeId}/compensations/${id}`, command);
    return data;
  },
  deleteCompensation: async (employeeId: string, id: string) => {
    const { data } = await apiClient.delete(`/employees/${employeeId}/compensations/${id}`);
    return data;
  }
};
