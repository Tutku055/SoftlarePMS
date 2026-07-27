import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { GenerateMonthlyTimesheetCommand } from '../types';

export const useGenerateTimesheet = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: GenerateMonthlyTimesheetCommand) => financeApi.generateMonthlyTimesheet(command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', variables.employeeId, variables.year, variables.month] });
    },
  });
};
