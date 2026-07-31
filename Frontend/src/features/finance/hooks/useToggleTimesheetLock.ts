import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

export const useToggleTimesheetLock = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, year, month, lock }: { employeeId: string; year: number; month: number; lock: boolean }) =>
      financeApi.toggleTimesheetLock(employeeId, year, month, lock),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['timesheet', variables.employeeId, variables.year, variables.month]
      });
    },
  });
};
