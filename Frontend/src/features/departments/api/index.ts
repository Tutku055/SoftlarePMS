import { apiClient } from '../../../config/apiClient';
import type { DepartmentDto, PaginatedList } from '../../employees';;
import type { GetDepartmentsParams, UpdateDepartmentDto } from '../types';

export const getDepartmentsList = async (params: GetDepartmentsParams): Promise<PaginatedList<DepartmentDto>> => {
  const { data } = await apiClient.post<PaginatedList<DepartmentDto>>('/Departments/search', params);
  return data;
};

export const getDepartment = async (id: string): Promise<DepartmentDto> => {
  const { data } = await apiClient.get<DepartmentDto>(`/Departments/${id}`);
  return data;
};

export const updateDepartment = async (command: UpdateDepartmentDto): Promise<void> => {
  await apiClient.put(`/Departments/${command.id}`, command);
};
