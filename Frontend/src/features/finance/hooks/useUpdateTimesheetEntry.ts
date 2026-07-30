import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { UpdateTimesheetEntryCommand } from '../types';

interface UpdateProps {
  employeeId: string;
  entryId: string;
  command: UpdateTimesheetEntryCommand;
}

export const useUpdateTimesheetEntry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, entryId, command }: UpdateProps) => financeApi.updateTimesheetEntry(employeeId, entryId, command),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['timesheet', variables.employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', variables.employeeId] });
    },
  });
};
