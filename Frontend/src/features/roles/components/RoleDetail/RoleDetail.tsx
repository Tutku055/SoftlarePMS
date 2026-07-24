import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../../store/useAuthStore';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import { getAdaptedRoleColor } from '../../../../theme/colorUtils';

import { useRoleDetail } from '../../hooks/useRoleDetail';
import { useUpdateRole } from '../../hooks/useUpdateRole';
import { useDeleteRole } from '../../hooks/useDeleteRole';
import { useAssignRolePermissions } from '../../hooks/useAssignRolePermissions';
import { usePermissionsList } from '../../hooks/usePermissionsList';
import { useToggleRoleActive } from '../../hooks/useToggleRoleActive';

import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  useTheme,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  ArrowBackRounded,
  DeleteRounded,
  BadgeRounded,
  SecurityRounded,
  CheckRounded,
  ExpandMoreRounded
} from '@mui/icons-material';
import styles from './RoleDetail.module.css';

// ─── PREMIUM THEME STYLES (Matching UserDetail.tsx) ───────────────────
const glassPanelSx = {
  background: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid',
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  borderRadius: '16px',
  p: 3,
  boxShadow: (theme: any) => theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  transition: 'box-shadow 0.3s ease',
};

const premiumInputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.6)' : 'background.paper',
    borderRadius: '10px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    '&:hover': {
      boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(128, 128, 128, 0.1)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(128, 128, 128, 0.2) !important',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main !important',
    borderWidth: '1px !important',
  }
};

const actionButtonSx = {
  borderRadius: '10px',
  borderColor: 'rgba(128, 128, 128, 0.25)',
  color: 'text.primary',
  fontWeight: 500,
  textTransform: 'none',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(128, 128, 128, 0.06)',
    borderColor: 'rgba(128, 128, 128, 0.5)',
  }
};

const ROLE_COLORS = [
  '#8A0000', '#9E4700', '#616B00', '#00732A', '#007075',
  '#004DA3', '#2E148E', '#6B0099', '#99005C', '#424242'
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

export const RoleDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = useAuthStore((state) => state.permissions);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [activeTab, setActiveTab] = useState(0);

  const { data: role, isLoading, isError } = useRoleDetail(id);
  const { data: availablePermissions } = usePermissionsList();

  const { mutate: updateRole, isPending: isUpdating } = useUpdateRole();
  const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole();
  const { mutate: assignPermissions, isPending: isAssigning } = useAssignRolePermissions();
  const { mutateAsync: toggleActive } = useToggleRoleActive();

  const isOwnRole = currentUser?.roleId === id;

  const [formState, setFormState] = useState({
    name: '',
    description: '',
    color: ROLE_COLORS[0],
    isActive: true,
  });

  const [rolePermissions, setRolePermissions] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{ open: boolean; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success' }>({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (role) {
      setFormState({
        name: role.name || '',
        description: role.description || '',
        color: role.color || ROLE_COLORS[0],
        isActive: role.isActive ?? true,
      });
      setRolePermissions(role.permissionIds || []);
    }
  }, [role]);

  const handleSaveDetails = async () => {
    if (!id) return;
    
    if (role && role.isActive !== formState.isActive) {
      try {
        await toggleActive(id);
      } catch (err: any) {
        setDialogState({
          open: true,
          title: 'Error',
          message: err?.response?.data?.detail || 'An error occurred while toggling role active status.',
          type: 'error',
        });
        return;
      }
    }

    updateRole(
      {
        id,
        name: formState.name,
        description: formState.description,
        color: formState.color,
      },
      {
        onSuccess: () => {
          setDialogState({
            open: true,
            title: 'Success',
            message: 'Role details successfully updated.',
            type: 'success',
          });
        },
        onError: (err: any) => {
          setDialogState({
            open: true,
            title: 'Error',
            message: err?.response?.data?.detail || 'An error occurred during update.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleDeleteClick = () => {
    if (!role) return;
    
    if (role.isActive) {
      setDialogState({
        open: true,
        title: 'Cannot Delete Role',
        message: 'Active roles cannot be deleted. Please set the role to inactive first.',
        type: 'warning',
      });
      return;
    }

    if (role.userCount && role.userCount > 0) {
      setDialogState({
        open: true,
        title: 'Cannot Delete Role',
        message: `This role cannot be deleted because it is assigned to ${role.userCount} active user(s) (including yourself if this is your role).`,
        type: 'warning',
      });
      return;
    }

    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteRole(id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        navigate('/settings/roles');
      },
      onError: (err: any) => {
        setDeleteConfirmOpen(false);
        setDialogState({
          open: true,
          title: 'Error',
          message: err?.response?.data?.detail || 'An error occurred while deleting role.',
          type: 'error',
        });
      },
    });
  };

  const handlePermissionToggle = (permissionId: string) => {
    setRolePermissions((prev) => {
      if (prev.includes(permissionId)) {
        return prev.filter((id) => id !== permissionId);
      } else {
        return [...prev, permissionId];
      }
    });
  };

  const handleSavePermissions = () => {
    if (!id) return;
    assignPermissions(
      { id, permissionIds: rolePermissions },
      {
        onSuccess: () => {
          setDialogState({
            open: true,
            title: 'Success',
            message: 'Role permissions successfully updated.',
            type: 'success',
          });
        },
        onError: (err: any) => {
          setDialogState({
            open: true,
            title: 'Error',
            message: err?.response?.data?.detail || err?.response?.data?.message || 'An error occurred while updating permissions.',
            type: 'error',
          });
        },
      }
    );
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body1">Loading role details...</Typography>
      </Box>
    );
  }

  if (isError || !role) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">Failed to load role details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/settings/roles')} sx={{ mt: 2 }}>
          Back to Roles
        </Button>
      </Box>
    );
  }

  const roleInitials = role.name ? role.name.slice(0, 2).toUpperCase() : 'RL';

  return (
    <Box sx={{ width: '100%', pb: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <IconButton onClick={() => navigate(-1)} sx={{ bgcolor: 'action.hover' }}>
            <ArrowBackRounded />
          </IconButton>
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', color: 'text.primary' }}>
              Role Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Managing role parameters and system permissions.
            </Typography>
          </Box>
        </Stack>
      </Box>

      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar 
            sx={{ 
              width: 84, height: 84, 
              bgcolor: getAdaptedRoleColor(role.color, isDark), 
              fontSize: '2rem', fontWeight: 600,
              color: getAdaptedRoleColor(role.color, isDark) === 'text.primary' ? undefined : '#fff'
            }}
          >
            {roleInitials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{role.name}</Typography>
              <Chip 
                label={role.isActive ? 'Active' : 'Inactive'} 
                size="small" 
                color={role.isActive ? 'success' : 'error'}
                sx={{ 
                  fontWeight: 600, 
                }} 
              />
              {role.isSystemRole && (
                <Chip 
                  label="System Built-in"
                  size="small"
                  variant="outlined"
                  sx={{
                    fontWeight: 700,
                    borderColor: 'primary.main',
                    color: 'primary.main',
                  }}
                />
              )}
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {role.description || 'No description provided.'}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Role ID:</strong> {role.id}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' },
          }}
        >
          <Tab value={0} icon={<BadgeRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Role Details" />
          <Tab value={1} icon={<SecurityRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Permissions" />
        </Tabs>
      </Box>

      {/* ── TAB 0: ROLE DETAILS ────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Information & Styling
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField
              label="Role Name"
              value={formState.name}
              onChange={(e) => setFormState({ ...formState, name: e.target.value })}
              fullWidth
              size="small"
              sx={premiumInputSx}
              disabled={role.isSystemRole && role.name === 'SuperAdmin'}
            />

            <TextField
              label="Description"
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              fullWidth
              size="small"
              sx={premiumInputSx}
            />

            <FormControl fullWidth size="small" sx={premiumInputSx}>
              <InputLabel id="status-select-label">Status</InputLabel>
              <Select
                labelId="status-select-label"
                label="Status"
                value={formState.isActive ? 'true' : 'false'}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.value === 'true' })}
                disabled={role.isSystemRole || (role.userCount !== undefined && role.userCount > 0)}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 4, maxWidth: 600 }}>
            <Accordion 
              disableGutters 
              elevation={0} 
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px !important',
                '&:before': { display: 'none' },
                bgcolor: 'transparent'
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Role Color Preference
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {/* Color Preview */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#ffffff' }}>
                    <Typography variant="caption" sx={{ color: '#666', mb: 0.5, display: 'block' }}>Light Mode</Typography>
                    <Typography sx={{ fontWeight: 700, color: getAdaptedRoleColor(formState.color, false), fontSize: '0.85rem' }}>
                      {formState.name || 'Role Name'}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#121212' }}>
                    <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block' }}>Dark Mode</Typography>
                    <Typography sx={{ fontWeight: 700, color: getAdaptedRoleColor(formState.color, true), fontSize: '0.85rem' }}>
                      {formState.name || 'Role Name'}
                    </Typography>
                  </Box>
                </Box>

                {/* Color Palette */}
                <Box sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(10, 1fr)', 
                  gap: 1,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                  border: '1px solid',
                  borderColor: 'divider'
                }}>
                  {ROLE_COLORS.map(color => {
                    const isSelected = formState.color === color;
                    const lightColor = getAdaptedRoleColor(color, false);
                    const darkColor = getAdaptedRoleColor(color, true);
                    
                    return (
                      <Box
                        key={color}
                        onClick={() => setFormState({ ...formState, color })}
                        sx={{
                          aspectRatio: '1',
                          width: '100%',
                          borderRadius: 1,
                          cursor: 'pointer',
                          position: 'relative',
                          overflow: 'hidden',
                          boxShadow: isSelected ? `0 0 0 2px ${muiTheme.palette.background.paper}, 0 0 0 3px ${muiTheme.palette.primary.main}` : '0 1px 2px rgba(0,0,0,0.1)',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: isSelected ? `0 0 0 2px ${muiTheme.palette.background.paper}, 0 0 0 3px ${muiTheme.palette.primary.main}` : '0 2px 4px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, bgcolor: darkColor }} />
                        <Box 
                          sx={{ 
                            position: 'absolute', 
                            top: 0, left: 0, right: 0, bottom: 0, 
                            bgcolor: lightColor,
                            clipPath: 'polygon(0 0, 100% 0, 0 100%)'
                          }} 
                        />
                        {isSelected && (
                          <Box sx={{ 
                            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.2)'
                          }}>
                            <CheckRounded sx={{ color: '#fff', fontSize: '1rem', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' }} />
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              </AccordionDetails>
            </Accordion>
          </Box>

          <Box sx={{ mt: 3 }}>
            <Button 
              variant="contained" 
              onClick={handleSaveDetails} 
              disabled={isUpdating || !hasPermission('Roles.Update')}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              {isUpdating ? 'Saving...' : 'Save Role Details'}
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />

          {hasPermission('Roles.Delete') && (
            <Box>
              <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 1 }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently deleting the role from the system is an irreversible action.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteRounded />}
                onClick={handleDeleteClick}
                disabled={role.isSystemRole || role.name === 'SuperAdmin' || isOwnRole}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Delete Role
              </Button>
            </Box>
          )}
        </Box>
      </TabPanel>

      {/* ── TAB 1: PERMISSIONS ────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Role Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Manage the permissions assigned to this role. You can only assign or revoke permissions that you currently possess. Permissions you do not possess will appear disabled but retain their current state.
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <Box sx={{ mb: 4, maxHeight: 500, overflowY: 'auto', pr: 2 }}>
            {availablePermissions && availablePermissions.length > 0 ? (
              <FormGroup>
                {availablePermissions.map(permission => {
                  const currentUserHasPermission = permissions.includes(permission.name);
                  const isChecked = rolePermissions.includes(permission.id);
                  
                  return (
                    <FormControlLabel
                      key={permission.id}
                      control={
                        <Checkbox
                          size="small"
                          checked={isChecked}
                          onChange={() => handlePermissionToggle(permission.id)}
                          disabled={!currentUserHasPermission || !hasPermission('Roles.Update') || isOwnRole}
                        />
                      }
                      label={
                        <Box sx={{ opacity: currentUserHasPermission && !isOwnRole ? 1 : 0.6 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {permission.name} {isOwnRole ? '(Cannot edit your own role)' : !currentUserHasPermission && '(Requires Permission)'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {permission.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                    />
                  );
                })}
              </FormGroup>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Loading permissions...
              </Typography>
            )}
          </Box>

          <Box>
            <Button 
              variant="contained" 
              onClick={handleSavePermissions} 
              disabled={isAssigning || !hasPermission('Roles.Update') || isOwnRole}
              sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
            >
              {isAssigning ? 'Updating...' : 'Update Permissions'}
            </Button>
          </Box>
        </Box>
      </TabPanel>

      {/* ── DIALOGS ───────────────────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Role</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the role <strong>{role.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} sx={actionButtonSx}>
            Cancel
          </Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={isDeleting} sx={{ borderRadius: '10px' }}>
            {isDeleting ? 'Deleting...' : 'Permanently Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <PopupDialog
        open={dialogState.open}
        title={dialogState.title}
        content={dialogState.message}
        confirmColor={dialogState.type === 'error' ? 'error' : 'primary'}
        onConfirm={() => setDialogState({ ...dialogState, open: false })}
        hideCancel={true}
        onClose={() => setDialogState({ ...dialogState, open: false })}
      />
    </Box>
  );
};
