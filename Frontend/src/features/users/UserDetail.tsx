import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUserDetail } from './hooks/useUserDetail';
import { useUpdateUser } from './hooks/useUpdateUser';
import { useDeleteUser } from './hooks/useDeleteUser';
import { useChangePassword } from './hooks/useChangePassword';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { useBreadcrumbTitle } from '../../store/useBreadcrumbStore';
import { apiClient } from '../../config/apiClient';
import type { RoleDto } from './types';
import { PopupDialog } from '../../components/PopupDialog/PopupDialog';
import { getAdaptedRoleColor } from '../../theme/colorUtils';


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
  InputAdornment,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  ArrowBackRounded,
  PersonRemoveRounded,
  BadgeRounded,
  SecurityRounded,
  PersonRounded,
  OpenInNewRounded,
  CheckCircleRounded,
  CancelRounded,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ManageAccountsRounded,
  VpnKeyRounded,
} from '@mui/icons-material';
import { validatePassword } from '../../utils/passwordValidation';
import { PasswordCriteriaChecklist } from '../../components/common/PasswordCriteriaChecklist';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import styles from './UserDetail.module.css';

// ─── PREMIUM THEME STYLES (Matching EmployeeDetail.tsx) ───────────────────
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

export const UserDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = useAuthStore((state) => state.permissions);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const muiTheme = useTheme();
  const isDark = muiTheme.palette.mode === 'dark';

  const isPasswordChangeRequired = currentUser?.requiresPasswordChange || 
    (permissions.includes('Users.ChangePassword') && !permissions.includes('Dashboard.Read'));

  const [activeTab, setActiveTab] = useState(isPasswordChangeRequired ? 2 : 0);

  const { data: user, isLoading, isError } = useUserDetail(id);
  useBreadcrumbTitle(user?.username || user?.email || null);
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const { data: roles = [] } = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/Roles');
      return data;
    },
    enabled: hasPermission('Roles.Read') && !isPasswordChangeRequired,
  });

  const [formState, setFormState] = useState({
    username: '',
    email: '',
    isActive: true,
    roleId: '',
    employeeId: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    newPasswordConfirm: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordConfirm, setShowNewPasswordConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [dialogState, setDialogState] = useState<{ open: boolean; title: string; message: string; type?: 'info' | 'warning' | 'error' | 'success' }>({
    open: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    if (isPasswordChangeRequired && currentUser?.id) {
      if (id !== currentUser.id) {
        navigate(`/users/${currentUser.id}`, { replace: true });
      } else {
        setActiveTab(2);
      }
    }
  }, [isPasswordChangeRequired, currentUser, id, navigate]);

  useEffect(() => {
    if (user) {
      setFormState({
        username: user.username || '',
        email: user.email || '',
        isActive: user.isActive ?? true,
        roleId: user.role?.id || '',
        employeeId: user.employeeId || '',
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!id) return;
    const roleIdToUpdate = formState.roleId !== user?.role?.id && currentUser?.id !== user?.id ? formState.roleId : undefined;
    updateUser(
      {
        id,
        dto: {
          username: formState.username,
          email: formState.email,
          isActive: formState.isActive,
          employeeId: formState.employeeId || null,
        },
        roleId: roleIdToUpdate,
      },
      {
        onSuccess: () => {
          setDialogState({
            open: true,
            title: 'Success',
            message: 'User details and role successfully updated.',
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
    if (!user) return;
    
    if (user.isActive) {
      setDialogState({
        open: true,
        title: 'Cannot Delete User',
        message: 'Active users cannot be deleted. Please set the user to inactive first.',
        type: 'warning',
      });
      return;
    }

    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (!id) return;
    deleteUser(id, {
      onSuccess: () => {
        setDeleteConfirmOpen(false);
        navigate('/users');
      },
      onError: (err: any) => {
        setDeleteConfirmOpen(false);
        setDialogState({
          open: true,
          title: 'Error',
          message: err?.response?.data?.detail || 'An error occurred while deleting user.',
          type: 'error',
        });
      },
    });
  };

  const handleChangePassword = () => {
    if (!id) return;
    if (passwordForm.newPassword !== passwordForm.newPasswordConfirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    const { isValid, errorMessage } = validatePassword(passwordForm.newPassword);
    if (!isValid) {
      setPasswordError(errorMessage || 'Password does not meet all complexity requirements.');
      return;
    }
    setPasswordError('');
    
    changePassword({
      userId: id,
      data: {
        oldPassword: passwordForm.oldPassword,
        newPassword: passwordForm.newPassword,
      }
    }, {
      onSuccess: () => {
        setPasswordForm({ oldPassword: '', newPassword: '', newPasswordConfirm: '' });
        
        const currentUser = useAuthStore.getState().currentUser;
        if (currentUser?.requiresPasswordChange) {
          setDialogState({
            open: true,
            title: 'Password Changed',
            message: 'Your password was successfully updated. You will now be logged out. Please log in again to receive your full system permissions.',
            type: 'success',
          });
        } else {
          setDialogState({
            open: true,
            title: 'Success',
            message: 'Password successfully changed.',
            type: 'success',
          });
        }
      },
      onError: (err: any) => {
        setPasswordError(err?.response?.data?.errors?.message || err?.response?.data?.message || err?.response?.data?.detail || 'An error occurred while changing password.');
      }
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Typography variant="body1">Loading user details...</Typography>
      </Box>
    );
  }

  if (isError || !user) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h6" color="error">Failed to load user details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/users')} sx={{ mt: 2 }}>
          Back to Users
        </Button>
      </Box>
    );
  }

  const userInitials = user.username ? user.username.slice(0, 2).toUpperCase() : 'US';

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="User Profile"
        subtitle={`Username: ${user.username} | Email: ${user.email}`}
        icon={<ManageAccountsRounded />}
        actions={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Tooltip title="Back to Users">
              <IconButton onClick={() => navigate('/settings/users')} sx={{ bgcolor: 'action.hover' }}>
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
          </Stack>
        }
      />

      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 600 }}>
            {userInitials}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{user.username}</Typography>
              <Chip 
                label={user.isActive ? 'Active' : 'Inactive'} 
                size="small" 
                color={user.isActive ? 'success' : 'error'}
                sx={{ 
                  fontWeight: 600, 
                }} 
              />
              <Chip 
                label={user.role?.name || 'SuperAdmin'}
                size="small"
                variant="outlined"
                sx={{
                  fontWeight: 700,
                  borderColor: getAdaptedRoleColor(user.role?.color, isDark),
                  color: getAdaptedRoleColor(user.role?.color, isDark),
                }}
              />
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {user.email}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>User ID:</strong> {user.id}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Linked Employee ID:</strong> {user.employeeId ? user.employeeId : 'None'}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={isPasswordChangeRequired ? 2 : activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' },
          }}
        >
          {!isPasswordChangeRequired && (
            <Tab value={0} icon={<BadgeRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Account Details" />
          )}
          {!isPasswordChangeRequired && (
            <Tab value={1} icon={<PersonRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Linked Employee" />
          )}
          <Tab value={2} icon={<VpnKeyRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Change Password" />
          {!isPasswordChangeRequired && (
            <Tab value={3} icon={<SecurityRounded sx={{ mr: 1 }}/>} iconPosition="start" label="System & Security" />
          )}
        </Tabs>
      </Box>

      {!isPasswordChangeRequired && (
      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Account Information
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField
              label="Username"
              value={formState.username}
              onChange={(e) => setFormState({ ...formState, username: e.target.value })}
              fullWidth
              size="small"
              sx={premiumInputSx}
            />

            <TextField
              label="Email Address"
              value={formState.email}
              onChange={(e) => setFormState({ ...formState, email: e.target.value })}
              fullWidth
              size="small"
              sx={premiumInputSx}
            />

            <FormControl fullWidth size="small" sx={premiumInputSx}>
              <InputLabel id="role-select-label">System Role</InputLabel>
              <Select
                labelId="role-select-label"
                label="System Role"
                value={formState.roleId || user?.role?.id || ''}
                onChange={(e) => setFormState({ ...formState, roleId: e.target.value as string })}
                disabled={currentUser?.id === user?.id}
              >
                <MenuItem value="">
                  <em>No Role Assigned</em>
                </MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 600, color: getAdaptedRoleColor(role.color, isDark) }}>
                        {role.name}
                      </Typography>
                      {role.description && (
                        <Typography variant="caption" color="text.secondary">
                          ({role.description})
                        </Typography>
                      )}
                    </Stack>
                  </MenuItem>
                ))}
                {(formState.roleId || user?.role?.id) && !roles.some(r => r.id === (formState.roleId || user?.role?.id)) && (
                  <MenuItem key={formState.roleId || user?.role?.id} value={formState.roleId || user?.role?.id}>
                    {user?.role?.name || 'SuperAdmin'}
                  </MenuItem>
                )}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small" sx={premiumInputSx}>
              <InputLabel id="status-select-label">Account Status</InputLabel>
              <Select
                labelId="status-select-label"
                label="Account Status"
                value={formState.isActive ? 'true' : 'false'}
                onChange={(e) => setFormState({ ...formState, isActive: e.target.value === 'true' })}
              >
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ mt: 3 }}>
            {hasPermission('Users.Update') && (
              <Button 
                variant="contained" 
                onClick={handleSave} 
                disabled={isUpdating}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                {isUpdating ? 'Saving...' : 'Save Account Details'}
              </Button>
            )}
          </Box>
        </Box>
      </TabPanel>
      )}

      {!isPasswordChangeRequired && (
      <TabPanel value={activeTab} index={1}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Linked Employee Profile
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          {user.employeeId ? (
            <Stack spacing={3}>
              <Typography variant="body1" color="text.secondary">
                This user account is associated with an employee record.
              </Typography>

              <Box sx={{ p: 3, borderRadius: '12px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" spacing={3} sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary">
                      Employee ID:
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      {user.employeeId}
                    </Typography>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<OpenInNewRounded />}
                    onClick={() => navigate(`/employees/${user.employeeId}`)}
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    Go to Employee Details
                  </Button>
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2} sx={{ alignItems: 'flex-start' }}>
              <Typography variant="body1" color="text.secondary">
                There is no employee record assigned to this user account.
              </Typography>

              <TextField
                label="Employee ID (Optional Binding)"
                placeholder="Enter employee ID in Guid format"
                value={formState.employeeId}
                onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                fullWidth
                size="small"
                sx={{ maxWidth: 480, ...premiumInputSx }}
              />
            </Stack>
          )}
        </Box>
      </TabPanel>
      )}

      {/* ── TAB 3: CHANGE PASSWORD ────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Change Password
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            <Stack spacing={2.5} sx={{ maxWidth: 480 }}>
              {passwordError && (
                <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>
                  {passwordError}
                </Typography>
              )}
              {currentUser?.id === id && (
                <TextField
                  label="Old Password"
                  type={showOldPassword ? 'text' : 'password'}
                  autoComplete="off"
                  value={passwordForm.oldPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  fullWidth
                  size="small"
                  sx={premiumInputSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowOldPassword(!showOldPassword)}
                            edge="end"
                            size="small"
                          >
                            {showOldPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              )}
              <Box>
                <TextField
                  label="New Password"
                  type={showNewPassword ? 'text' : 'password'}
                  autoComplete="off"
                  value={passwordForm.newPassword}
                  onChange={(e) => {
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                    if (passwordError) setPasswordError('');
                  }}
                  fullWidth
                  size="small"
                  sx={premiumInputSx}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            edge="end"
                            size="small"
                          >
                            {showNewPassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
                <PasswordCriteriaChecklist 
                  password={passwordForm.newPassword} 
                  isDark={useTheme().palette.mode === 'dark'} 
                />
              </Box>
              <TextField
                label="Confirm New Password"
                type={showNewPasswordConfirm ? 'text' : 'password'}
                autoComplete="off"
                value={passwordForm.newPasswordConfirm}
                onChange={(e) => {
                  setPasswordForm({ ...passwordForm, newPasswordConfirm: e.target.value });
                  if (passwordError) setPasswordError('');
                }}
                fullWidth
                size="small"
                sx={premiumInputSx}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowNewPasswordConfirm(!showNewPasswordConfirm)}
                          edge="end"
                          size="small"
                        >
                          {showNewPasswordConfirm ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <Box sx={{ pt: 1 }}>
                {(hasPermission('Users.ChangePassword') || currentUser?.id === id) && (
                  <Button 
                    type="submit"
                    variant="contained" 
                    disabled={
                      isChangingPassword || 
                      !passwordForm.newPassword || 
                      (currentUser?.id === id && !passwordForm.oldPassword)
                    }
                    sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
                  >
                    {isChangingPassword ? 'Changing...' : 'Update Password'}
                  </Button>
                )}
              </Box>
            </Stack>
          </form>
        </Box>
      </TabPanel>

      {/* ── TAB 4: SYSTEM AND SECURITY ────────────────────────────────────── */}
      {(!useAuthStore.getState().currentUser?.requiresPasswordChange || useAuthStore.getState().currentUser?.id !== id) && (
      <TabPanel value={activeTab} index={3}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            System Metadata & Security
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <Box className={styles.actionCardsGrid} sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
            <Box sx={{ p: 3, borderRadius: '12px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <VpnKeyRounded fontSize="small" /> System User ID
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, fontFamily: 'monospace' }}>
                  {user.id}
                </Typography>
              </Stack>
            </Box>

            <Box sx={{ p: 3, borderRadius: '12px', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', border: '1px solid', borderColor: 'divider' }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {user.isActive ? <CheckCircleRounded color="success" fontSize="small" /> : <CancelRounded color="error" fontSize="small" />} Status
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {user.isActive ? 'Account Active in Use' : 'Account Frozen / Inactive'}
                </Typography>
              </Stack>
            </Box>
          </Box>

          <Divider sx={{ my: 4 }} />

          {hasPermission('Users.Delete') && (
            <Box>
              <Typography variant="h6" color="error" sx={{ fontWeight: 700, mb: 1 }}>
                Danger Zone
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Permanently deleting the user account from the system is an irreversible action.
              </Typography>
              <Button
                variant="outlined"
                color="error"
                startIcon={<PersonRemoveRounded />}
                onClick={handleDeleteClick}
                disabled={currentUser?.id === user.id || user.isSystemUser || user.role?.name === 'SuperAdmin'}
                sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}
              >
                Delete User Account
              </Button>
            </Box>
          )}
        </Box>
      </TabPanel>
      )}

      {/* ── DIALOGS ───────────────────────────────────────────────────────── */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete the user <strong>{user.username}</strong>? This action cannot be undone.
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
        onConfirm={() => {
          setDialogState({ ...dialogState, open: false });
          if (dialogState.title === 'Password Changed') {
            useAuthStore.getState().logout();
            window.location.href = '/login';
          }
        }}
        hideCancel={true}
        onClose={() => setDialogState({ ...dialogState, open: false })}
      />
    </Box>
  );
};
