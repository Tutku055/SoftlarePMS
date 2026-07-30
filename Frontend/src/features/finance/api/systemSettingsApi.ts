import { apiClient } from '../../../config/apiClient';

export const systemSettingsApi = {
  closeYearAndRolloverLeaves: async (yearToClose: number): Promise<{ message: string }> => {
    const response = await apiClient.post(`/SystemSettings/close-year/${yearToClose}`);
    return response.data;
  },
  checkYearClosure: async (year: number): Promise<{ isPending: boolean }> => {
    const response = await apiClient.get(`/SystemSettings/check-year-closure/${year}`);
    return response.data;
  },
  getYearEndStats: async (year: number): Promise<any> => {
    const response = await apiClient.get(`/SystemSettings/year-end-stats/${year}`);
    return response.data;
  }
};
