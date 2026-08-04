// src/utils/passwordValidation.ts

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
}

export interface PasswordValidationResult {
  isValid: boolean;
  criteria: PasswordCriteria;
  errorMessage: string | null;
}

export const getPasswordCriteria = (password: string): PasswordCriteria => ({
  hasMinLength: (password || '').length >= 8,
  hasUppercase: /[A-Z]/.test(password || ''),
  hasLowercase: /[a-z]/.test(password || ''),
  hasNumber: /[0-9]/.test(password || ''),
  hasSpecial: /[\W_]/.test(password || ''),
});

export const validatePassword = (password: string): PasswordValidationResult => {
  if (!password) {
    return {
      isValid: false,
      criteria: getPasswordCriteria(''),
      errorMessage: 'Password is required.',
    };
  }

  const criteria = getPasswordCriteria(password);
  const isValid =
    criteria.hasMinLength &&
    criteria.hasUppercase &&
    criteria.hasLowercase &&
    criteria.hasNumber &&
    criteria.hasSpecial;

  let errorMessage: string | null = null;
  if (!criteria.hasMinLength) {
    errorMessage = 'Password must be at least 8 characters long.';
  } else if (!criteria.hasUppercase) {
    errorMessage = 'Password must contain at least one uppercase letter.';
  } else if (!criteria.hasLowercase) {
    errorMessage = 'Password must contain at least one lowercase letter.';
  } else if (!criteria.hasNumber) {
    errorMessage = 'Password must contain at least one digit.';
  } else if (!criteria.hasSpecial) {
    errorMessage = 'Password must contain at least one special character.';
  }

  return { isValid, criteria, errorMessage };
};
