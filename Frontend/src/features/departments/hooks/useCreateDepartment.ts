import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../config/apiClient';
import type { DepartmentDto } from '../../employees';;

export interface CreateDepartmentDto {
  name: string;
  description: string;
}

export const createDepartment = async (command: CreateDepartmentDto): Promise<DepartmentDto> => {
  const { data } = await apiClient.post<DepartmentDto>('/Departments', command);
  return data;
};

export const useCreateDepartment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDepartmentDto) => createDepartment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departmentsList'] });
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });
};
