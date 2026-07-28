import { useQuery } from '@tanstack/react-query';
import { overtimeTypeApi } from '../api/overtimeTypeApi';

export const useOvertimeTypes = (includeDeleted: boolean = false) => {
  return useQuery({
    queryKey: ['overtimeTypes', includeDeleted],
    queryFn: () => overtimeTypeApi.getOvertimeTypes(includeDeleted),
  });
};
