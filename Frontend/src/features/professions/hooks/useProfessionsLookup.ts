import { useQuery } from '@tanstack/react-query';
import { professionApi } from '../api/professionApi';

export const useProfessionsLookup = () => {
  return useQuery({
    queryKey: ['professionsLookup'],
    queryFn: professionApi.getProfessionsLookup,
    staleTime: 5 * 60 * 1000,
  });
};
