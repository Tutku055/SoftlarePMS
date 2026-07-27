import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { UpdateCompensationCommand } from '../types';

export const useUpdateCompensation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, command }: { employeeId: string; command: UpdateCompensationCommand }) =>
      financeApi.updateCompensation(employeeId, command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
    },
  });
};
