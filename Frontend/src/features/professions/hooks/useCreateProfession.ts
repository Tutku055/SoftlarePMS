import { useMutation, useQueryClient } from '@tanstack/react-query';
import { professionApi } from '../api/professionApi';

export const useCreateProfession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: professionApi.createProfession,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionsList'] });
      queryClient.invalidateQueries({ queryKey: ['professionsLookup'] });
    }
  });
};
