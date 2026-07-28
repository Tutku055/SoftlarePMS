import { apiClient } from '../../../config/apiClient';
import type { OvertimeType, PaginatedList } from '../types';

export const overtimeTypeApi = {
  getOvertimeTypes: async (includeDeleted: boolean = false) => {
    const { data } = await apiClient.get<OvertimeType[]>(`/overtimeTypes?includeDeleted=${includeDeleted}`);
    return data;
  },
  getOvertimeTypesWithPagination: async (params: {
    pageNumber: number;
    pageSize: number;
    searchTerm?: string;
    filters?: { field: string; operator: string; value: string }[];
  }) => {
    const { data } = await apiClient.post<PaginatedList<OvertimeType>>('/overtimeTypes/paged', params);
    return data;
  },
  createOvertimeType: async (command: { name: string; multiplier: number }) => {
    const { data } = await apiClient.post<string>('/overtimeTypes', command);
    return data;
  },
  updateOvertimeType: async (id: string, command: { id: string; name: string; multiplier: number }) => {
    await apiClient.put(`/overtimeTypes/${id}`, command);
  },
  deleteOvertimeType: async (id: string) => {
    await apiClient.delete(`/overtimeTypes/${id}`);
  },
  restoreOvertimeType: async (id: string) => {
    await apiClient.patch(`/overtimeTypes/${id}/restore`);
  }
};
