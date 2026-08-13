import { apiClient } from '../../../config/apiClient';
import type { PaginatedList } from '../../users';;
import type { GetRolesParams, RoleListDto, CreateRoleDto, UpdateRoleDto } from '../types';
import type { RoleDto } from '../../users';;

export const getRolesList = async (params: GetRolesParams): Promise<PaginatedList<RoleListDto>> => {
  const { data } = await apiClient.post<PaginatedList<RoleListDto>>('/Roles/search', params);
  return data;
};

export const getPermissions = async (): Promise<import('../types').PermissionDto[]> => {
  const { data } = await apiClient.get<import('../types').PermissionDto[]>('/Permissions');
  return data;
};

export const createRole = async (command: CreateRoleDto): Promise<RoleDto> => {
  const { data } = await apiClient.post<RoleDto>('/Roles', command);
  return data;
};

export const updateRole = async (command: UpdateRoleDto): Promise<void> => {
  await apiClient.put(`/Roles/${command.id}`, command);
};

export const deleteRole = async (id: string): Promise<void> => {
  await apiClient.delete(`/Roles/${id}`);
};

export const toggleRoleActive = async (id: string): Promise<void> => {
  await apiClient.put(`/Roles/${id}/toggle-active`);
};

export const getRoleById = async (id: string): Promise<RoleDto> => {
  const { data } = await apiClient.get<RoleDto>(`/Roles/${id}`);
  return data;
};

export const assignPermissions = async (id: string, permissionIds: string[]): Promise<void> => {
  await apiClient.put(`/Roles/${id}/permissions`, { permissionIds });
};
