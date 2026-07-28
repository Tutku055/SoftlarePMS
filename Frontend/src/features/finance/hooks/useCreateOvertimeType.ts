import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

export const useCreateOvertimeType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: overtimeTypeApi.createOvertimeType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeTypesList'] });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    }
  });
};
