import { apiClient } from '../../../config/apiClient';
import type {
  EmployeeAddressDto,
  CreateEmployeeAddressDto,
  UpdateEmployeeAddressDto,
  PaginatedList,
  FilterCriteria,
} from '../types';

export interface GetAddressQueryParams {
  pageNumber: number;
  pageSize: number;
  filters?: FilterCriteria[];
}

export const getEmployeeAddresses = async (
  employeeId: string,
  onlyActive?: boolean
): Promise<EmployeeAddressDto[]> => {
  const { data } = await apiClient.get<EmployeeAddressDto[]>(
    `/employees/${employeeId}/addresses`,
    { params: { onlyActive } }
  );
  return data;
};

export const getEmployeeAddressById = async (
  employeeId: string,
  id: string
): Promise<EmployeeAddressDto> => {
  const { data } = await apiClient.get<EmployeeAddressDto>(
    `/employees/${employeeId}/addresses/${id}`
  );
  return data;
};

export const createEmployeeAddress = async (
  employeeId: string,
  dto: CreateEmployeeAddressDto
): Promise<EmployeeAddressDto> => {
  const { data } = await apiClient.post<EmployeeAddressDto>(
    `/employees/${employeeId}/addresses`,
    dto
  );
  return data;
};

export const updateEmployeeAddress = async (
  employeeId: string,
  id: string,
  dto: UpdateEmployeeAddressDto
): Promise<EmployeeAddressDto> => {
  const { data } = await apiClient.put<EmployeeAddressDto>(
    `/employees/${employeeId}/addresses/${id}`,
    dto
  );
  return data;
};

export const deleteEmployeeAddress = async (
  employeeId: string,
  id: string
): Promise<void> => {
  await apiClient.delete(`/employees/${employeeId}/addresses/${id}`);
};

export const searchEmployeeAddresses = async (
  employeeId: string,
  params: GetAddressQueryParams
): Promise<PaginatedList<EmployeeAddressDto>> => {
  const { data } = await apiClient.post<PaginatedList<EmployeeAddressDto>>(
    `/employees/${employeeId}/addresses/search`,
    params
  );
  return data;
};
