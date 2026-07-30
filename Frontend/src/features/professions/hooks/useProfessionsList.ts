import { useQuery } from '@tanstack/react-query';
import { professionApi } from '../api/professionApi';

interface UseProfessionsListOptions {
  pageNumber: number;
  pageSize: number;
  filters?: { field: string; operator: string; value: string }[];
}

export const useProfessionsList = (options: UseProfessionsListOptions) => {
  return useQuery({
    queryKey: ['professionsList', options],
    queryFn: () => professionApi.getProfessionsWithPagination(options),
    placeholderData: (previousData) => previousData,
  });
};
