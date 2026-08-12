import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../config/apiClient';

// DTOs
export interface DashboardNotificationDto {
  id: string;
  type: number;
  title: string;
  message: string;
  targetDate?: string;
  remainingDays?: number;
  createdAt: string;
  payloadJson?: string;
  isRead?: boolean;
}

export interface CalendarDayDto {
  date: string;
  isToday: boolean;
  notes: any[];
  physicalEvents: any[];
  virtualEvents: any[];
}

export interface DashboardKpisAndEventsDto {
  activeEmployeesCount: number;
  totalDepartmentsCount: number;
  newHiresThisMonthCount: number;
  topNotifications: DashboardNotificationDto[];
  todayEvents?: CalendarDayDto;
}

export interface ChartDistributionItemDto {
  name: string;
  value: number;
  isOther: boolean;
  subItems: string[];
}

export interface DashboardDistributionsDto {
  departmentDistribution: ChartDistributionItemDto[];
  professionDistribution: ChartDistributionItemDto[];
}

export interface ExpenseDepartmentDto {
  departmentName: string;
  expensesByCurrency: Record<string, number>;
}

export interface DashboardExpenseChartsDto {
  monthlyExpenses: ExpenseDepartmentDto[];
  hourlyExpenses: ExpenseDepartmentDto[];
}

// API Functions
const getKpisAndEvents = async (): Promise<DashboardKpisAndEventsDto> => {
  const { data } = await apiClient.get('/dashboard/kpis-events');
  return data;
};

const getDistributions = async (): Promise<DashboardDistributionsDto> => {
  const { data } = await apiClient.get('/dashboard/distributions');
  return data;
};

const getExpenseCharts = async (): Promise<DashboardExpenseChartsDto> => {
  const { data } = await apiClient.get('/dashboard/expense-charts');
  return data;
};

// React Query Hooks
export const useGetDashboardKpisAndEvents = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard', 'kpis-events'],
    queryFn: getKpisAndEvents,
    enabled,
  });
};

export const useGetDashboardDistributions = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard', 'distributions'],
    queryFn: getDistributions,
    enabled,
  });
};

export const useGetDashboardExpenseCharts = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['dashboard', 'expense-charts'],
    queryFn: getExpenseCharts,
    enabled,
  });
};
