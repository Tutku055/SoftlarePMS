import { useMutation, useQueryClient } from '@tanstack/react-query';
import { professionApi } from '../api/professionApi';

export const useUpdateProfession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, command }: { id: string; command: { id: string; name: string; description?: string; isActive: boolean } }) =>
      professionApi.updateProfession(id, command),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionsList'] });
      queryClient.invalidateQueries({ queryKey: ['professionsLookup'] });
    }
  });
};
