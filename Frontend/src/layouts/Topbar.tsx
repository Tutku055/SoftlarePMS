import React from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Divider, Breadcrumbs, Link } from '@mui/material';
import { DarkMode, LightMode, Logout, Person } from '@mui/icons-material';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import styles from './Topbar.module.css';

const drawerWidth = 280;

export const Topbar: React.FC = () => {
  const { mode, toggleTheme } = useThemeStore();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDarkMode = mode === 'dark';

  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = useAuthStore((state) => state.permissions);
  const displayName = currentUser?.username || 'User';
  
  const isPasswordChangeRequired = currentUser?.requiresPasswordChange || 
    (permissions.includes('Users.ChangePassword') && !permissions.includes('Dashboard.Read'));

  const currentDrawerWidth = isPasswordChangeRequired ? 0 : drawerWidth;

  return (
    <AppBar
      position="fixed"
      elevation={0}
      className={styles.appBar}
      sx={{
        width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
        ml: { sm: `${currentDrawerWidth}px` },
        backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(31, 41, 55, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(8px)',
        color: 'text.primary',
        borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: 0,
        transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1), margin 0.3s, width 0.3s',
      }}
    >
      <Toolbar sx={{ minHeight: '70px !important' }}>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Breadcrumbs aria-label="breadcrumb">
            <Link 
              component={RouterLink} 
              to="/" 
              color={pathnames.length === 0 ? "text.primary" : "inherit"}
              underline="hover"
              sx={{ fontWeight: pathnames.length === 0 ? 700 : 500 }}
            >
              Dashboard
            </Link>
            {pathnames.map((value, index) => {
              const last = index === pathnames.length - 1;
              const to = `/${pathnames.slice(0, index + 1).join('/')}`;
              const label = value.length > 20 ? 'Details' : value.charAt(0).toUpperCase() + value.slice(1);

              return last ? (
                <Typography color="text.primary" key={to} sx={{ fontWeight: 700, letterSpacing: '-0.5px' }}>
                  {label}
                </Typography>
              ) : (
                <Link 
                  component={RouterLink} 
                  to={to} 
                  color="inherit" 
                  underline="hover" 
                  key={to}
                  sx={{ fontWeight: 500 }}
                >
                  {label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <IconButton 
            onClick={toggleTheme} 
            color="inherit"
            className={styles.iconButton}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
          
          <Divider 
            orientation="vertical" 
            flexItem 
            sx={{ 
              my: 2, 
              borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
            }} 
          />

          <Button
            color="inherit"
            startIcon={<Person />}
            className={styles.profileButton}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
            onClick={() => {
              if (currentUser?.id && permissions.includes('Users.Read')) {
                navigate(`/users/${currentUser.id}`);
              }
            }}
          >
            <Box 
              component="span" 
              sx={{ 
                maxWidth: '120px',
                overflow: 'hidden', 
                textOverflow: 'ellipsis', 
                whiteSpace: 'nowrap',
                display: 'inline-block'
              }}
            >
              {displayName}
            </Box>
          </Button>

          <IconButton 
            color="inherit" 
            onClick={handleLogout} 
            title="Logout"
            className={`${styles.iconButton} ${styles.logoutButton}`}
          >
            <Logout fontSize="small" />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};