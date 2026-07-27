import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

export const useTimesheetDetail = (employeeId: string, year: number, month: number) => {
  return useQuery({
    queryKey: ['timesheet', employeeId, year, month],
    queryFn: () => financeApi.getMonthlyTimesheet(employeeId, year, month),
    enabled: !!employeeId && !!year && !!month,
    retry: false
  });
};
