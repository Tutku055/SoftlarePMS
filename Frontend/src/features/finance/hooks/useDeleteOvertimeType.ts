import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

export const useDeleteOvertimeType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: overtimeTypeApi.deleteOvertimeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeTypesList'] });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    }
  });
};
