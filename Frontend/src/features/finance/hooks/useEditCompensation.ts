import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';

interface EditCompensationCommand {
  baseSalary: number;
  salaryType: number;
  currency: number;
  effectiveDate: string;
}

export const useEditCompensation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, id, command }: { employeeId: string; id: string; command: EditCompensationCommand }) =>
      financeApi.editCompensation(employeeId, id, command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
    },
  });
};
