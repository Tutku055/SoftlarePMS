import { useMutation } from '@tanstack/react-query';
import { resetPassword } from '../api/auth';
import type { ResetPasswordPayload, AuthMessageResponse } from '../types';

export const useResetPassword = () => {
  return useMutation<AuthMessageResponse, Error, ResetPasswordPayload>({
    mutationFn: resetPassword,
  });
};
