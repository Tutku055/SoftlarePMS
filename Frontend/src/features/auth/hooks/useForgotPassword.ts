import { useMutation } from '@tanstack/react-query';
import { forgotPassword } from '../api/auth';
import type { ForgotPasswordPayload, AuthMessageResponse } from '../types';

export const useForgotPassword = () => {
  return useMutation<AuthMessageResponse, Error, ForgotPasswordPayload>({
    mutationFn: forgotPassword,
  });
};
