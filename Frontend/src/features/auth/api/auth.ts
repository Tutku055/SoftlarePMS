import { apiClient } from '../../../config/apiClient';
import type { 
  LoginCredentials, 
  LoginResponse, 
  ForgotPasswordPayload, 
  ResetPasswordPayload,
  AuthMessageResponse 
} from '../types';

export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>('/Auth/login', credentials);
  return data;
};

export const forgotPassword = async (payload: ForgotPasswordPayload): Promise<AuthMessageResponse> => {
  const { data } = await apiClient.post<AuthMessageResponse>('/Auth/forgot-password', payload);
  return data;
};

export const resetPassword = async (payload: ResetPasswordPayload): Promise<AuthMessageResponse> => {
  const { data } = await apiClient.post<AuthMessageResponse>('/Auth/reset-password', payload);
  return data;
};

