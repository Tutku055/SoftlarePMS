import { useQuery } from '@tanstack/react-query';
import { systemSettingsApi } from '../api/systemSettingsApi';

export const useYearClosureStatus = (year: number) => {
  return useQuery({
    queryKey: ['yearClosureStatus', year],
    queryFn: () => systemSettingsApi.checkYearClosure(year),
    enabled: !!year,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
