// src/features/auth/components/Login/Login.tsx
import { useState } from 'react';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  useTheme,
  InputAdornment,
  Checkbox,
  FormControlLabel,
  IconButton
} from '@mui/material';
import { 
  PersonOutlined, 
  LockOutlined, 
  EmailOutlined,
  VisibilityOutlined, 
  VisibilityOffOutlined,
  ArrowBackOutlined,
  CheckCircleOutlined
} from '@mui/icons-material';
import { useLogin } from '../../hooks/useLogin';
import { useForgotPassword } from '../../hooks/useForgotPassword';
import styles from './Login.module.css';

// Arkaplanlar
import darkBg from '../../../../assets/images/DarkThemeLoginBackground.png';
import lightBg from '../../../../assets/images/LightThemeLoginBackground.png';
import logoImg from '../../../../assets/images/SoftPMSLogo.png';

// 3D İllüstrasyonlar
import illustrationLight from '../../../../assets/images/illustration-light.png';
import illustrationDark from '../../../../assets/images/illustration-dark.png';

export const Login = () => {
  const [mode, setMode] = useState<'login' | 'forgot-password'>('login');
  
  // Login Form States
  const [username, setUsername] = useState(() => localStorage.getItem('remembered_username') || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(() => localStorage.getItem('remember_me') === 'true');
  const [showPassword, setShowPassword] = useState(false);
  const [loginValidationError, setLoginValidationError] = useState<string | null>(null);

  // Forgot Password Form States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotValidationError, setForgotValidationError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Mutations
  const { mutate: loginMutate, isPending: isLoginPending, isError: isLoginError, error: loginError, reset: resetLogin } = useLogin();
  const { mutate: forgotMutate, isPending: isForgotPending, isError: isForgotError, error: forgotError, reset: resetForgot } = useForgotPassword();
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const wrapperClass = isDark ? styles.wrapperDark : styles.wrapperLight;

  const getLoginErrorMessage = () => {
    if (!loginError) return 'Login failed. Please check your credentials.';
    const anyErr = loginError as any;
    const responseData = anyErr.response?.data;
    const serverMsg =
      responseData?.errors?.message ||
      (typeof responseData?.errors === 'string' ? responseData.errors : null) ||
      responseData?.detail ||
      responseData?.message;

    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      return serverMsg;
    }
    return 'Login failed. Please check your credentials.';
  };

  const getForgotErrorMessage = () => {
    if (!forgotError) return 'Failed to send reset email. Please try again.';
    const anyErr = forgotError as any;
    const responseData = anyErr.response?.data;
    const serverMsg =
      responseData?.errors?.message ||
      (typeof responseData?.errors === 'string' ? responseData.errors : null) ||
      responseData?.detail ||
      responseData?.message;

    if (typeof serverMsg === 'string' && serverMsg.trim()) {
      return serverMsg;
    }
    return 'Failed to send reset email. Please try again.';
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginValidationError(null);

    if (!username.trim() && !password.trim()) {
      setLoginValidationError('Username and password are required.');
      return;
    }
    if (!username.trim()) {
      setLoginValidationError('Username is required.');
      return;
    }
    if (!password.trim()) {
      setLoginValidationError('Password is required.');
      return;
    }

    // Persist Remember Me preferences
    if (rememberMe) {
      localStorage.setItem('remember_me', 'true');
      localStorage.setItem('remembered_username', username.trim());
    } else {
      localStorage.removeItem('remember_me');
      localStorage.removeItem('remembered_username');
    }

    loginMutate({ username: username.trim(), password, rememberMe });
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotValidationError(null);
    setForgotSuccess(false);

    const trimmedEmail = forgotEmail.trim();
    if (!trimmedEmail) {
      setForgotValidationError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setForgotValidationError('Please enter a valid email address.');
      return;
    }

    forgotMutate(
      { email: trimmedEmail },
      {
        onSuccess: () => {
          setForgotSuccess(true);
        },
      }
    );
  };

  const switchMode = (newMode: 'login' | 'forgot-password') => {
    setMode(newMode);
    setLoginValidationError(null);
    setForgotValidationError(null);
    setForgotSuccess(false);
    resetLogin();
    resetForgot();
  };

  // Temaya göre arkaplan ve illüstrasyon seçimi
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
            {mode === 'login' ? (
              <>
                <div className={styles.headerGroup}>
                  <h1 className={styles.headerText}>Welcome Back</h1>
                  <p className={styles.subHeaderText}>Enter your credentials to access the system.</p>
                </div>

                {(loginValidationError || isLoginError) && (
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
                    {loginValidationError || getLoginErrorMessage()}
                  </Alert>
                )}

                <form onSubmit={handleLoginSubmit} className={styles.form}>
                  <TextField
                    fullWidth
                    placeholder="Username"
                    type="text"
                    variant="outlined"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (loginValidationError) setLoginValidationError(null);
                      if (isLoginError) resetLogin();
                    }}
                    autoComplete="username"
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={textFieldStyles(isDark)}
                  />
                  <TextField
                    fullWidth
                    placeholder="Password"
                    type={showPassword ? 'text' : 'password'}
                    variant="outlined"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (loginValidationError) setLoginValidationError(null);
                      if (isLoginError) resetLogin();
                    }}
                    autoComplete="current-password"
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
                              onClick={() => setShowPassword((prev) => !prev)}
                              edge="end"
                              size="small"
                              sx={{ color: isDark ? '#a1a1aa' : '#71717a' }}
                            >
                              {showPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }
                    }}
                    sx={textFieldStyles(isDark)}
                  />

                  {/* Remember Me & Forgot Password Links */}
                  <div className={styles.formOptions}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={rememberMe}
                          onChange={(e) => setRememberMe(e.target.checked)}
                          size="small"
                          sx={{
                            color: isDark ? '#71717a' : '#94a3b8',
                            '&.Mui-checked': {
                              color: isDark ? '#38bdf8' : '#0284c7',
                            },
                          }}
                        />
                      }
                      label="Remember me"
                      className={styles.rememberMeLabel}
                    />
                    <button
                      type="button"
                      className={styles.forgotPasswordLink}
                      onClick={() => switchMode('forgot-password')}
                    >
                      Forgot password?
                    </button>
                  </div>
                  
                  <div className={styles.actionWrapper}>
                    <Button
                      fullWidth
                      variant="contained"
                      type="submit"
                      disabled={isLoginPending}
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
                      {isLoginPending ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className={styles.headerGroup}>
                  <h1 className={styles.headerText}>Forgot Password</h1>
                  <p className={styles.subHeaderText}>Enter your registered email address to receive a reset link.</p>
                </div>

                {forgotSuccess ? (
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
                    If the email address exists in our system, a password reset link has been sent. Please check your inbox and spam folder.
                  </Alert>
                ) : (
                  (forgotValidationError || isForgotError) && (
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
                      {forgotValidationError || getForgotErrorMessage()}
                    </Alert>
                  )
                )}

                {!forgotSuccess && (
                  <form onSubmit={handleForgotSubmit} className={styles.form}>
                    <TextField
                      fullWidth
                      placeholder="Email Address"
                      type="email"
                      variant="outlined"
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotValidationError) setForgotValidationError(null);
                        if (isForgotError) resetForgot();
                      }}
                      autoComplete="email"
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <EmailOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
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
                        disabled={isForgotPending}
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
                        {isForgotPending ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
                      </Button>
                    </div>
                  </form>
                )}

                <div className={styles.backToLoginWrapper}>
                  <button
                    type="button"
                    className={styles.backToLoginBtn}
                    onClick={() => switchMode('login')}
                  >
                    <ArrowBackOutlined fontSize="small" />
                    Back to Sign In
                  </button>
                </div>
              </>
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

// MUI TextField ortak stilleri
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