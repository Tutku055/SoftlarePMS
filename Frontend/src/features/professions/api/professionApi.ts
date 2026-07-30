import { apiClient } from '../../../config/apiClient';
import type { Profession, ProfessionLookupDto, PaginatedList } from '../types';

export const professionApi = {
  getProfessionsLookup: async () => {
    const { data } = await apiClient.get<ProfessionLookupDto[]>('/professions/lookup');
    return data;
  },

  getProfessionsWithPagination: async (params: {
    pageNumber: number;
    pageSize: number;
    filters?: { field: string; operator: string; value: string }[];
  }) => {
    const { data } = await apiClient.post<PaginatedList<Profession>>('/professions/search', params);
    return data;
  },

  createProfession: async (command: { name: string; description?: string }) => {
    const { data } = await apiClient.post<Profession>('/professions', command);
    return data;
  },

  updateProfession: async (id: string, command: { id: string; name: string; description?: string; isActive: boolean }) => {
    await apiClient.put(`/professions/${id}`, command);
  },

  deleteProfession: async (id: string, hardDelete: boolean = false) => {
    await apiClient.delete(`/professions/${id}?hardDelete=${hardDelete}`);
  },
};
