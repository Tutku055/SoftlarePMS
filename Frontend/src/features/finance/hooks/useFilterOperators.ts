import { useQuery } from '@tanstack/react-query';
import { systemSettingsApi } from '../api/systemSettingsApi';

export type FilterOperatorItem = { value: string; label: string };

export type FilterOperatorsDto = {
  stringOperators: FilterOperatorItem[];
  fullNameOperators: FilterOperatorItem[];
  dateOperators: FilterOperatorItem[];
  numberOperators: FilterOperatorItem[];
  fileSizeOperators: FilterOperatorItem[];
  selectOperators: FilterOperatorItem[];
  multiSelectOperators: FilterOperatorItem[];
};

export const useFilterOperators = () => {
  return useQuery<FilterOperatorsDto>({
    queryKey: ['filterOperators'],
    queryFn: () => systemSettingsApi.getFilterOperators(),
    staleTime: Infinity, // These don't change often
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
};
