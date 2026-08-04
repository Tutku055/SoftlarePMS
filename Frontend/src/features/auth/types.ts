export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  username: string;
  email: string;
  requiresPasswordChange?: boolean;
}

export interface LoginCredentials {
  username?: string;
  password?: string;
  rememberMe?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

export interface AuthMessageResponse {
  message: string;
}

