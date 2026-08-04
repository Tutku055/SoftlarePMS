// src/features/auth/components/ResetPassword/ResetPassword.tsx
import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  useTheme,
  InputAdornment,
  IconButton
} from '@mui/material';
import { 
  EmailOutlined,
  LockOutlined, 
  VisibilityOutlined, 
  VisibilityOffOutlined,
  CheckCircleOutlined,
  ArrowBackOutlined
} from '@mui/icons-material';
import { useResetPassword } from '../../hooks/useResetPassword';
import { validatePassword } from '../../../../utils/passwordValidation';
import { PasswordCriteriaChecklist } from '../../../../components/common/PasswordCriteriaChecklist';
import styles from './ResetPassword.module.css';

// Arkaplanlar ve Görseller
import darkBg from '../../../../assets/images/DarkThemeLoginBackground.png';
import lightBg from '../../../../assets/images/LightThemeLoginBackground.png';
import logoImg from '../../../../assets/images/SoftPMSLogo.png';
import illustrationLight from '../../../../assets/images/illustration-light.png';
import illustrationDark from '../../../../assets/images/illustration-dark.png';

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const { mutate, isPending, isError, error, reset } = useResetPassword();

  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const wrapperClass = isDark ? styles.wrapperDark : styles.wrapperLight;

  const getErrorMessage = () => {
    if (!error) return 'Password reset failed. The token may be expired or invalid.';
    const anyErr = error as any;
    const responseData = anyErr.response?.data;
    const serverMsg =
      responseData?.errors?.message ||
      (typeof responseData?.errors === 'string' ? responseData.errors : null) ||
      responseData?.detail ||
      responseData?.message;

    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      return serverMsg;
    }
    return 'Password reset failed. The token may be expired or invalid.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!token || !email) {
      setValidationError('Invalid or missing password reset link. Please request a new one.');
      return;
    }

    if (!newPassword || !confirmPassword) {
      setValidationError('Please fill in both password fields.');
      return;
    }

    const { isValid, errorMessage } = validatePassword(newPassword);
    if (!isValid) {
      setValidationError(errorMessage || 'Password does not meet all complexity requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    mutate(
      { email, token, newPassword },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
      }
    );
  };

  const bgImage = isDark ? darkBg : lightBg;
  const currentIllustration = isDark ? illustrationDark : illustrationLight;

  return (
    <div 
      className={`${styles.wrapper} ${wrapperClass}`}
      style={{ 
        backgroundImage: `url(${bgImage})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className={styles.authCard}>
        
        {/* Sol Panel - Form */}
        <div className={styles.formSection}>
          <div className={styles.brand}>
            <img src={logoImg} alt="Logo" className={styles.brandLogo} />
            <span className={styles.brandText}>SoftPMS</span>
          </div>

          <div className={styles.formWrapper}>
            <div className={styles.headerGroup}>
              <h1 className={styles.headerText}>Reset Password</h1>
              <p className={styles.subHeaderText}>
                {isSuccess 
                  ? 'Your password has been changed successfully.' 
                  : 'Enter a strong new password for your account.'}
              </p>
            </div>

            {/* Invalid or Missing Token Warning */}
            {(!token || !email) && !isSuccess && (
              <Alert 
                severity="warning" 
                className={styles.alertBox}
                sx={{ 
                  backgroundColor: isDark ? 'rgba(120, 53, 15, 0.4)' : '#fffbeb',
                  borderColor: isDark ? 'rgba(217, 119, 6, 0.4)' : '#fde68a',
                  color: isDark ? '#fde68a' : '#92400e',
                  '& .MuiAlert-icon': { color: isDark ? '#fbbf24' : '#d97706' }
                }}
              >
                Invalid or missing reset token. Please request a new password reset link from the login page.
              </Alert>
            )}

            {/* Server / Validation Error */}
            {(validationError || isError) && (
              <Alert 
                severity="error" 
                className={styles.alertBox}
                sx={{ 
                  backgroundColor: isDark ? 'rgba(69, 10, 10, 0.4)' : '#fef2f2',
                  borderColor: isDark ? 'rgba(127, 29, 29, 0.5)' : '#fecaca',
                  color: isDark ? '#fca5a5' : '#991b1b',
                  '& .MuiAlert-icon': { color: isDark ? '#f87171' : '#dc2626' }
                }}
              >
                {validationError || getErrorMessage()}
              </Alert>
            )}

            {/* Success State */}
            {isSuccess ? (
              <div>
                <Alert 
                  severity="success" 
                  icon={<CheckCircleOutlined fontSize="inherit" />}
                  className={styles.alertBox}
                  sx={{ 
                    backgroundColor: isDark ? 'rgba(6, 78, 59, 0.4)' : '#f0fdf4',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#bbf7d0',
                    color: isDark ? '#86efac' : '#166534',
                    '& .MuiAlert-icon': { color: isDark ? '#4ade80' : '#16a34a' }
                  }}
                >
                  Your password has been updated. You can now sign in using your new password.
                </Alert>

                <div className={styles.actionWrapper}>
                  <Button
                    fullWidth
                    variant="contained"
                    onClick={() => navigate('/login')}
                    disableElevation
                    className={styles.submitBtn}
                    sx={{
                      backgroundColor: isDark ? '#ffffff' : '#0f172a',
                      color: isDark ? '#0f172a' : '#ffffff',
                      '&:hover': {
                        backgroundColor: isDark ? '#e4e4e7' : '#1e293b',
                      }
                    }}
                  >
                    Go to Sign In
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {/* Email Read-only Field */}
                <TextField
                  fullWidth
                  value={email}
                  disabled
                  variant="outlined"
                  placeholder="Email"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <EmailOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{
                    ...textFieldStyles(isDark),
                    '& .MuiOutlinedInput-root': {
                      ...textFieldStyles(isDark)['& .MuiOutlinedInput-root'],
                      opacity: 0.75,
                    }
                  }}
                />

                {/* New Password Field */}
                <TextField
                  fullWidth
                  placeholder="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    if (validationError) setValidationError(null);
                    if (isError) reset();
                  }}
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword((prev) => !prev)}
                            edge="end"
                            size="small"
                            sx={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                          >
                            {showNewPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={textFieldStyles(isDark)}
                />

                {/* Password Criteria Checklist */}
                <PasswordCriteriaChecklist password={newPassword} isDark={isDark} />


                {/* Confirm Password Field */}
                <TextField
                  fullWidth
                  placeholder="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  variant="outlined"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (validationError) setValidationError(null);
                    if (isError) reset();
                  }}
                  autoComplete="new-password"
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <LockOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowConfirmPassword((prev) => !prev)}
                            edge="end"
                            size="small"
                            sx={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                          >
                            {showConfirmPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={textFieldStyles(isDark)}
                />

                <div className={styles.actionWrapper}>
                  <Button
                    fullWidth
                    variant="contained"
                    type="submit"
                    disabled={isPending || !token || !email}
                    disableElevation
                    className={styles.submitBtn}
                    sx={{
                      backgroundColor: isDark ? '#ffffff' : '#0f172a',
                      color: isDark ? '#0f172a' : '#ffffff',
                      '&:hover': {
                        backgroundColor: isDark ? '#e4e4e7' : '#1e293b',
                      },
                      '&.Mui-disabled': {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.1)',
                        color: isDark ? '#52525b' : '#94a3b8',
                      }
                    }}
                  >
                    {isPending ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
                  </Button>
                </div>

                <div className={styles.backToLoginWrapper}>
                  <button
                    type="button"
                    className={styles.backToLoginBtn}
                    onClick={() => navigate('/login')}
                  >
                    <ArrowBackOutlined fontSize="small" />
                    Back to Sign In
                  </button>
                </div>
              </form>
            )}
          </div>
          
          <div className={styles.footer}>
            <p>&copy; {new Date().getFullYear()} SoftPMS. All rights reserved.</p>
          </div>
        </div>

        {/* Sağ Panel - 3D Görsel Alanı */}
        <div className={styles.visualSection}>
          <div className={styles.visualContent}>
            <img 
              src={currentIllustration} 
              alt="System Overview" 
              className={styles.illustration} 
            />
          </div>
        </div>

      </div>
    </div>
  );
};

const textFieldStyles = (isDark: boolean) => ({
  mb: 2.5,
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: isDark ? 'rgba(24, 24, 27, 0.6)' : '#ffffff',
    backdropFilter: isDark ? 'blur(10px)' : 'none',
    '& fieldset': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#e2e8f0',
      transition: 'all 0.3s ease',
    },
    '&:hover fieldset': {
      borderColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#cbd5e1',
    },
    '&.Mui-focused fieldset': {
      borderColor: isDark ? '#38bdf8' : '#0284c7',
      borderWidth: '1.5px',
    },
    '& input': {
      color: isDark ? '#f8fafc' : '#0f172a',
      padding: '14px 16px',
      fontSize: '0.95rem',
      fontWeight: 500,
    }
  }
});
