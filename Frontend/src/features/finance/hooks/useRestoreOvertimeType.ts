import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

export const useRestoreOvertimeType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: overtimeTypeApi.restoreOvertimeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeTypesList'] });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    }
  });
};
