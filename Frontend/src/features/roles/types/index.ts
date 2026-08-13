import type { FilterCriteria } from '../../users';;

export interface GetRolesParams {
  pageNumber: number;
  pageSize: number;
  filters?: FilterCriteria[];
}

export interface RoleListDto {
  id: string;
  name: string;
  description: string;
  color: string;
  userCount: number;
  isActive: boolean;
  isSystemRole: boolean;
}

export interface CreateRoleDto {
  name: string;
  description: string;
  color: string;
  permissionIds?: string[];
}

export interface PermissionDto {
  id: string;
  name: string;
  description: string;
}

export interface UpdateRoleDto {
  id: string;
  name: string;
  description: string;
  color: string;
}
