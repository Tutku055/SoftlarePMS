// src/features/auth/components/Login/Login.tsx
import { useState } from 'react';
import { 
  TextField, 
  Button, 
  CircularProgress, 
  Alert, 
  useTheme,
  InputAdornment
} from '@mui/material';
import { PersonOutlined, LockOutlined } from '@mui/icons-material';
import { useLogin } from '../../hooks/useLogin';
import styles from './Login.module.css';

// Arkaplanlar
import darkBg from '../../../../assets/images/DarkThemeLoginBackground.png';
import lightBg from '../../../../assets/images/LightThemeLoginBackground.png';
import logoImg from '../../../../assets/images/SoftPMSLogo.png';

// Yeni 3D İllüstrasyonlar (Light ve Dark Mode için)
import illustrationLight from '../../../../assets/images/illustration-light.png';
import illustrationDark from '../../../../assets/images/illustration-dark.png';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { mutate, isPending, isError, error } = useLogin();
  
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const wrapperClass = isDark ? styles.wrapperDark : styles.wrapperLight;

  const getErrorMessage = () => {
    if (!error) return 'Login failed. Please check your credentials.';
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
    return 'Login failed. Please check your credentials.';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username && password) {
      mutate({ username, password });
    }
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
            <div className={styles.headerGroup}>
              <h1 className={styles.headerText}>Welcome Back</h1>
              <p className={styles.subHeaderText}>Enter your credentials to access the system.</p>
            </div>

            {isError && (
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
                {getErrorMessage()}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <TextField
                fullWidth
                placeholder="Username"
                type="text"
                variant="outlined"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                required
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
                type="password"
                variant="outlined"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockOutlined sx={{ color: isDark ? '#a1a1aa' : '#71717a' }} />
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
                  disabled={isPending}
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
                  {isPending ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
                </Button>
              </div>
            </form>
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