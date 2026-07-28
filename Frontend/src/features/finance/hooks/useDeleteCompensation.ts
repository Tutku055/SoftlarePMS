import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

export const useDeleteCompensation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      financeApi.deleteCompensation(employeeId, id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
    },
  });
};
