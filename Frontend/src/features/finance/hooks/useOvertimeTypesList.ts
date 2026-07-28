import { useQuery } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

interface UseOvertimeTypesListOptions {
  pageNumber: number;
  pageSize: number;
  searchTerm?: string;
  filters?: { field: string; operator: string; value: string }[];
}

export const useOvertimeTypesList = (options: UseOvertimeTypesListOptions) => {
  return useQuery({
    queryKey: ['overtimeTypesList', options],
    queryFn: () => overtimeTypeApi.getOvertimeTypesWithPagination(options),
    placeholderData: (previousData) => previousData, // keep previous data while fetching new page
  });
};
