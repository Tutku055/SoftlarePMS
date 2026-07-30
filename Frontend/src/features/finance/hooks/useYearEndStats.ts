import { useQuery } from '@tanstack/react-query';
import { systemSettingsApi } from '../api/systemSettingsApi';

export const useYearEndStats = (year: number) => {
  return useQuery({
    queryKey: ['yearEndStats', year],
    queryFn: () => systemSettingsApi.getYearEndStats(year),
    enabled: !!year
  });
};
