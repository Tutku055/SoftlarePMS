import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { CalculateMonthlyPayrollCommand } from '../types';

export const useCalculatePayroll = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (command: CalculateMonthlyPayrollCommand) => financeApi.calculatePayroll(command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrolls'] });
    },
  });
};
