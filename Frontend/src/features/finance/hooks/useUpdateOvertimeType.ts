import { useMutation, useQueryClient } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

export const useUpdateOvertimeType = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { id: string; command: { id: string; name: string; multiplier: number } }) => 
      overtimeTypeApi.updateOvertimeType(data.id, data.command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['overtimeTypesList'] });
      queryClient.invalidateQueries({ queryKey: ['overtimeTypes'] });
    }
  });
};
