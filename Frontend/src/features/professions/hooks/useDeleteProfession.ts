import { useMutation, useQueryClient } from '@tanstack/react-query';
import { professionApi } from '../api/professionApi';

export const useDeleteProfession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, hardDelete }: { id: string; hardDelete?: boolean }) => professionApi.deleteProfession(id, hardDelete),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionsList'] });
      queryClient.invalidateQueries({ queryKey: ['professionsLookup'] });
    }
  });
};
