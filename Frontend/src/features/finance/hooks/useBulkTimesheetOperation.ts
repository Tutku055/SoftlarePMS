import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeApi } from '../api/financeApi';
import type { BulkTimesheetOperationRequest } from '../types';

export const useBulkTimesheetOperation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BulkTimesheetOperationRequest) => financeApi.bulkTimesheetOperation(request),
    onSuccess: () => {
      // Since bulk affects multiple employees/timesheets, it's safer to invalidate all timesheets
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
    },
  });
};
