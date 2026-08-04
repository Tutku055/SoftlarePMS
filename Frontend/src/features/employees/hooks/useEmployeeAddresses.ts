import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEmployeeAddresses,
  getEmployeeAddressById,
  createEmployeeAddress,
  updateEmployeeAddress,
  deleteEmployeeAddress,
  searchEmployeeAddresses,
  type GetAddressQueryParams,
} from '../api/addressesApi';
import type { CreateEmployeeAddressDto, UpdateEmployeeAddressDto } from '../types';

export const useEmployeeAddresses = (employeeId?: string, onlyActive?: boolean) => {
  return useQuery({
    queryKey: ['employee-addresses', employeeId, { onlyActive }],
    queryFn: () => getEmployeeAddresses(employeeId!, onlyActive),
    enabled: !!employeeId,
  });
};

export const useEmployeeAddressDetail = (employeeId?: string, addressId?: string) => {
  return useQuery({
    queryKey: ['employee-address', employeeId, addressId],
    queryFn: () => getEmployeeAddressById(employeeId!, addressId!),
    enabled: !!employeeId && !!addressId,
  });
};

export const useSearchEmployeeAddresses = (
  employeeId?: string,
  params?: GetAddressQueryParams
) => {
  return useQuery({
    queryKey: ['employee-addresses-search', employeeId, params],
    queryFn: () => searchEmployeeAddresses(employeeId!, params!),
    enabled: !!employeeId && !!params,
  });
};

export const useCreateEmployeeAddress = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      dto,
    }: {
      employeeId: string;
      dto: CreateEmployeeAddressDto;
    }) => createEmployeeAddress(employeeId, dto),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-addresses', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-addresses-search', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
};

export const useUpdateEmployeeAddressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      employeeId,
      id,
      dto,
    }: {
      employeeId: string;
      id: string;
      dto: UpdateEmployeeAddressDto;
    }) => updateEmployeeAddress(employeeId, id, dto),
    onSuccess: (_, { employeeId, id }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-addresses', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-addresses-search', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-address', employeeId, id] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
};

export const useDeleteEmployeeAddressMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ employeeId, id }: { employeeId: string; id: string }) =>
      deleteEmployeeAddress(employeeId, id),
    onSuccess: (_, { employeeId }) => {
      queryClient.invalidateQueries({ queryKey: ['employee-addresses', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee-addresses-search', employeeId] });
      queryClient.invalidateQueries({ queryKey: ['employee', employeeId] });
    },
  });
};
