import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { 
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, 
  Toolbar, Box, Typography, Collapse
} from '@mui/material';
import { 
  Dashboard, PeopleAlt, FolderCopy, 
  Settings, ExpandLess, ExpandMore, Business, MonetizationOnRounded,
  NotificationsActiveRounded, CalendarMonth
} from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import logoImg from '../assets/images/SoftPMSLogo.png';

// --- TypeScript Arayüzleri (Interfaces) ---

interface SubMenuItem {
  title: string;
  path: string;
  permission?: string;
}

interface MenuItem {
  title: string;
  path?: string; // Ana menüde direkt link varsa
  icon: ReactNode;
  children?: SubMenuItem[]; // Alt menüsü olanlar için
  permission?: string;
}

// -----------------------------------------

const drawerWidth = 280;

// Menü Hiyerarşisi
const menuConfig: MenuItem[] = [
  { 
    title: 'Dashboard', 
    path: '/dashboard', 
    icon: <Dashboard />,
    permission: 'Dashboard.Read'
  },
  { 
    title: 'Calendar', 
    path: '/calendar', 
    icon: <CalendarMonth />,
    permission: 'Calendar.Read'
  },
  { 
    title: 'Notifications', 
    path: '/notifications', 
    icon: <NotificationsActiveRounded />,
    permission: 'Notifications.Read'
  },
  { 
    title: 'Document Archive', 
    path: '/documents/archive', 
    icon: <FolderCopy />,
    permission: 'Documents.Read'
  },
  { 
    title: 'Personnel Operations', 
    icon: <PeopleAlt />,
    children: [
      { title: 'Roster', path: '/employees/roster', permission: 'Employees.Read' },
      { title: 'Create Employee', path: '/employees/create', permission: 'Employees.Create' },
      { title: 'Addresses', path: '/employees/addresses', permission: 'EmployeeAddresses.Read' }
    ]
  },
  { 
    title: 'Departments', 
    icon: <Business />,
    children: [
      { title: 'Department List', path: '/departments/list', permission: 'Departments.Read' },
      { title: 'Department Employees', path: '/departments/employees', permission: 'Departments.Read' },
      { title: 'Professions', path: '/departments/professions', permission: 'Professions.Read' }
    ]
  },
  { 
    title: 'Financial Management', 
    icon: <MonetizationOnRounded />,
    children: [
      { title: 'Timesheets', path: '/finance/timesheets', permission: 'Timesheets.Read' },
      { title: 'Payrolls', path: '/finance/payrolls', permission: 'Payrolls.Read' },
      { title: 'Overtime', path: '/finance/overtime-types', permission: 'OvertimeTypes.Read' }
    ]
  },
  { 
    title: 'System Settings', 
    icon: <Settings />,
    children: [
      { title: 'General Settings', path: '/settings/general', permission: 'SystemSettings.Manage' },
      { title: 'Users', path: '/settings/users', permission: 'Users.Read' },
      { title: 'Roles & Permissions', path: '/settings/roles', permission: 'Roles.Read' },
      { title: 'System Logs', path: '/settings/system-logs', permission: 'AuditLogs.Read' },
      { title: 'Year-End Operations', path: '/settings/year-end', permission: 'SystemSettings.YearEndOperations' }
    ]
  }
];

import { useAuthStore } from '../store/useAuthStore';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const hasPermission = useAuthStore(state => state.hasPermission);
  const currentUser = useAuthStore(state => state.currentUser);
  const permissions = useAuthStore(state => state.permissions);

  const isPasswordChangeRequired = currentUser?.requiresPasswordChange || 
    (permissions.includes('Users.ChangePassword') && !permissions.includes('Dashboard.Read'));

  // Alt menülerin açık/kapalı state'ini tutan obje (Type: Record<string, boolean>)
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  if (isPasswordChangeRequired) {
    return null;
  }

  const handleToggle = (title: string) => {
    setOpenStates((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    const visibleChildren = item.children?.filter(child => !child.permission || hasPermission(child.permission)) || [];
    
    // If it's a folder (has children defined) but none of the children are visible, hide the entire folder
    if (item.children && item.children.length > 0 && visibleChildren.length === 0) {
      return null;
    }

    const hasChildren = visibleChildren.length > 0;
    
    // Alt menüsü yoksa ve path eşleşiyorsa ana menü aktiftir
    const isActive = !hasChildren && item.path && location.pathname.startsWith(item.path);
    
    // Alt menülerden biri aktifse, ana menünün açık kalması vb. mantıklar eklenebilir
    const isOpen = openStates[item.title];

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                handleToggle(item.title);
              } else if (item.path) {
                navigate(item.path);
              }
            }}
            className={`${styles.menuItem} ${isActive ? styles.activeItem : ''}`}
            sx={{ minHeight: 48, px: 2.5 }}
          >
            <ListItemIcon 
              sx={{ 
                minWidth: 40, 
                color: isActive ? 'primary.main' : 'text.secondary' 
              }}
            >
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Typography 
                  sx={{ 
                    fontSize: '0.95rem', 
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'primary.main' : 'text.primary',
                    transition: 'color 0.3s ease'
                  }}
                >
                  {item.title}
                </Typography>
              }
            />
            {hasChildren && (isOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />)}
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {visibleChildren.map((child) => {
                const isChildActive = location.pathname === child.path;
                return (
                  <ListItemButton
                    key={child.title}
                    onClick={() => navigate(child.path)}
                    className={`${styles.menuItem} ${styles.subMenuItem} ${isChildActive ? styles.activeSubItem : ''}`}
                  >
                    <ListItemText 
                      primary={
                        <Typography 
                          sx={{ 
                            fontSize: '0.85rem',
                            fontWeight: isChildActive ? 600 : 400,
                            color: isChildActive ? 'primary.main' : 'text.secondary',
                            transition: 'color 0.3s ease'
                          }}
                        >
                          {child.title}
                        </Typography>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
            borderRight: (theme) => `1px solid ${theme.palette.divider}`,
            backgroundColor: (theme) => theme.palette.background.paper, 
            backgroundImage: 'none', 
            borderRadius: 0, 
            boxShadow: (theme) => theme.palette.mode === 'dark' ? '4px 0 24px rgba(0,0,0,0.2)' : 'none',
            transition: 'background-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), color 0.4s cubic-bezier(0.4, 0, 0.2, 1), border-color 0.4s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          },
        }}
        open
      >
        <div className={styles.sidebarContainer}>
          <Toolbar sx={{ mb: 2, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <img 
                src={logoImg} 
                alt="SoftPMS Logo" 
                style={{ 
                  width: 36, 
                  height: 36, 
                  objectFit: 'contain', 
                  borderRadius: 6 
                }} 
              />
              <Typography variant="h6" color="text.primary" sx={{ fontWeight: 800, letterSpacing: '-0.5px' }}>
                SoftPMS
              </Typography>
            </Box>
          </Toolbar>

          <Box className={styles.sidebarNav} sx={{ overflowY: 'auto', overflowX: 'hidden', px: 1, pb: 4 }}>
            <List>
              {menuConfig.map((item) => renderMenuItem(item))}
            </List>
          </Box>
        </div>
      </Drawer>
    </Box>
  );
};