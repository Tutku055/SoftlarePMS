import React, { useEffect } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Box, Button, Divider, Breadcrumbs, Link, Badge } from '@mui/material';
import { DarkMode, LightMode, Logout, Person, NotificationsNoneRounded } from '@mui/icons-material';
import { useThemeStore } from '../store/useThemeStore';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import { useNotificationStore } from '../store/useNotificationStore';
import { useBreadcrumbStore, getBreadcrumbsForPath } from '../store/useBreadcrumbStore';
import styles from './Topbar.module.css';

const drawerWidth = 280;

export const Topbar: React.FC = () => {
  const { mode, toggleTheme } = useThemeStore();
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const customTitle = useBreadcrumbStore((state) => state.customTitle);
  const breadcrumbs = getBreadcrumbsForPath(location.pathname, customTitle);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isDarkMode = mode === 'dark';

  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = useAuthStore((state) => state.permissions);
  const displayName = currentUser?.username?.trim() || (currentUser?.email ? currentUser.email.split('@')[0] : '') || 'User';
  
  const canReadNotifications = permissions.includes('Notifications.Read');
  const unreadCount = useNotificationStore((state) => state.unreadCount);
  const fetchUnreadCount = useNotificationStore((state) => state.fetchUnreadCount);

  useEffect(() => {
    if (canReadNotifications) {
      fetchUnreadCount();
    }
  }, [canReadNotifications, fetchUnreadCount, location.pathname]);

  // Poll unread count every 30s so the badge stays fresh without requiring navigation
  useEffect(() => {
    if (!canReadNotifications) return;

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30_000);

    return () => clearInterval(interval);
  }, [canReadNotifications, fetchUnreadCount]);

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
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              if (isLast || !item.path) {
                return (
                  <Typography
                    key={`${item.label}-${index}`}
                    color="text.primary"
                    sx={{
                      fontWeight: isLast ? 700 : 500,
                      letterSpacing: '-0.3px',
                      fontSize: '0.9rem',
                      opacity: !isLast && !item.path ? 0.7 : 1,
                    }}
                  >
                    {item.label}
                  </Typography>
                );
              }

              return (
                <Link
                  component={RouterLink}
                  to={item.path}
                  key={`${item.label}-${index}`}
                  color="inherit"
                  underline="hover"
                  sx={{ fontWeight: 500, fontSize: '0.9rem' }}
                >
                  {item.label}
                </Link>
              );
            })}
          </Breadcrumbs>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {canReadNotifications && (
            <IconButton
              onClick={() => navigate('/notifications')}
              color="inherit"
              className={styles.iconButton}
              title="Notifications"
            >
              <Badge badgeContent={unreadCount} color="error" max={99}>
                <NotificationsNoneRounded fontSize="small" />
              </Badge>
            </IconButton>
          )}

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