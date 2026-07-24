import { apiClient } from '../../../config/apiClient';
import type { 
  EmployeeReferenceDto, 
  CreateEmployeeReferenceDto, 
  UpdateEmployeeReferenceDto 
} from '../types';

export const getEmployeeReferences = async (
  employeeId: string
): Promise<EmployeeReferenceDto[]> => {
  const { data } = await apiClient.get<EmployeeReferenceDto[]>(`/employees/${employeeId}/references`);
  return data;
};

export const createEmployeeReference = async (
  employeeId: string, 
  reference: CreateEmployeeReferenceDto
): Promise<EmployeeReferenceDto> => {
  const { data } = await apiClient.post<EmployeeReferenceDto>(`/employees/${employeeId}/references`, reference);
  return data;
};

export const updateEmployeeReference = async (
  employeeId: string, 
  referenceId: string, 
  reference: UpdateEmployeeReferenceDto
): Promise<void> => {
  await apiClient.put(`/employees/${employeeId}/references/${referenceId}`, reference);
};

export const deleteEmployeeReference = async (
  employeeId: string, 
  referenceId: string
): Promise<void> => {
  await apiClient.delete(`/employees/${employeeId}/references/${referenceId}`);
};
