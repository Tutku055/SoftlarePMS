import { useMutation, useQueryClient } from '@tanstack/react-query';
import { systemSettingsApi } from '../api/systemSettingsApi';

export const useCloseYearRollover = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (yearToClose: number) => systemSettingsApi.closeYearAndRolloverLeaves(yearToClose),
    onSuccess: () => {
      // Invalidate timesheets so the UI refreshes and removes the lock
      queryClient.invalidateQueries({ queryKey: ['timesheet'] });
      // Also invalidate employees because CarriedOverLeaves just changed
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['yearEndStats'] });
    }
  });
};
