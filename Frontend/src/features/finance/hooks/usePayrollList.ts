import { useQuery } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

export const usePayrollList = (employeeId: string) => {
  return useQuery({
    queryKey: ['payrolls', employeeId],
    queryFn: () => financeApi.getPayrollSlips(employeeId),
    enabled: !!employeeId,
  });
};
