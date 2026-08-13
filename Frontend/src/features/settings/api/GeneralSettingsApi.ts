import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from "../../../config/apiClient";

export interface SystemParametersDto {
  companyName: string;
  companyLogoPath: string;
  employeeNoPrefix: string;
  goLiveYear: number;
  monthlyWorkingHours: number;
  dailyWorkingHours: number;
  smtpHost: string;
  smtpPort: number;
  senderName: string;
  senderEmail: string;
  smtpUserName: string;
  smtpPassword: string;
  smtpEnableSsl: boolean;
}

export const useSystemParameters = () => {
  return useQuery<SystemParametersDto>({
    queryKey: ['system-parameters'],
    queryFn: async () => {
      const response = await apiClient.get('/systemsettings/parameters');
      return response.data;
    }
  });
};

export const useUpdateSystemParameters = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: SystemParametersDto) => {
      const response = await apiClient.put('/systemsettings/parameters', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-parameters'] });
    }
  });
};

export const useUploadCompanyLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('File', file);
      
      const response = await apiClient.post('/systemsettings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data.logoPath;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-parameters'] });
    }
  });
};

export interface TestEmailResultDto {
  success: boolean;
  message: string;
}

export const useTestEmailConnection = () => {
  return useMutation({
    mutationFn: async (data: SystemParametersDto): Promise<TestEmailResultDto> => {
      const response = await apiClient.post('/systemsettings/test-email', data);
      return response.data;
    }
  });
};
