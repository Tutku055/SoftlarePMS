import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  ViewColumnRounded,
  FileDownloadRounded,
  AutoAwesomeRounded,
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  PersonAddRounded,
  VisibilityOutlined,
  VisibilityOffOutlined,
  ManageAccountsRounded,
} from '@mui/icons-material';
import { validatePassword } from '../../utils/passwordValidation';
import { PasswordCriteriaChecklist } from '../../components/common/PasswordCriteriaChecklist';
import type {
  GridPaginationModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../components/DataTable/DataTable';
import { useUsers } from './hooks/useUsers';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/useAuthStore';
import { PageHeader } from '../../components/PageHeader/PageHeader';
import { apiClient } from '../../config/apiClient';
import type { RoleDto } from './types';
import { useCreateUser } from './hooks/useCreateUser';
import { getUsers } from './api/users';
import ExcelJS from 'exceljs';
import { getAdaptedRoleColor } from '../../theme/colorUtils';

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Switch,
  FormControlLabel
} from '@mui/material';

const COLUMN_NAMES: Record<string, string> = {
  employeeId: 'Employee ID',
  username: 'Username',
  email: 'Email',
  role: 'Role',
  isActive: 'Status',
};



type QuickFilter = 'all' | 'active' | 'inactive';

export const UsersPage = () => {
  // ─── QUICK TEXT SEARCH ───────────────────────────────────────────────────
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  // ─── SMART FILTER CHIPS ───────────────────────────────────────────────────
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');

  // ─── CUSTOM COLUMN FILTERS ────────────────────────────────────────────────
  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });

    if (field === 'isActive') {
      if (value === 'true' || value === '1') setActiveQuickFilter('active');
      else if (value === 'false' || value === '0') setActiveQuickFilter('inactive');
      else setActiveQuickFilter('all');
    }
  }, []);

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
    setActiveQuickFilter('all');
  }, []);

  // ─── PAGINATION ───────────────────────────────────────────────────────────
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // ─── COLUMN VISIBILITY ────────────────────────────────────────────────────
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    employeeId: true,
    username: true,
    email: true,
    role: true,
    isActive: true,
  });

  // ─── CREATE USER DIALOG ───────────────────────────────────────────────────
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: '',
    email: '',
    password: '',
    roleId: '',
    isActive: true,
  });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const createUserMutation = useCreateUser();

  const handleCreateUserChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.name;
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setCreateForm((prev) => ({ ...prev, [name]: value }));
    if (createFormErrors[name]) {
      setCreateFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!createForm.username.trim()) errors.username = 'Username is required';
    if (!createForm.email.trim()) errors.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(createForm.email)) errors.email = 'Invalid email address';
    
    if (!createForm.password) {
      errors.password = 'Password is required';
    } else {
      const { isValid, errorMessage } = validatePassword(createForm.password);
      if (!isValid) {
        errors.password = errorMessage || 'Password does not meet complexity requirements';
      }
    }

    if (!createForm.roleId) errors.roleId = 'Role is required';
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUserSubmit = async () => {
    if (!validateCreateForm()) return;

    const emailTrimmed = createForm.email.trim().toLowerCase();

    // Local check
    if (data?.items?.some((u) => u.email.trim().toLowerCase() === emailTrimmed)) {
      setCreateFormErrors((prev) => ({ ...prev, email: 'This email is already in use.' }));
      return;
    }

    try {
      const searchResult = await getUsers({
        pageNumber: 1,
        pageSize: 1,
        filters: [{ field: 'email', operator: 'equals', value: createForm.email.trim() }]
      });

      if (searchResult && searchResult.totalCount > 0) {
        setCreateFormErrors(prev => ({ ...prev, email: 'This email is already in use.' }));
        return;
      }
    } catch (err) {
      console.error('Failed to check email uniqueness:', err);
    }

    createUserMutation.mutate(createForm, {
      onSuccess: () => {
        setCreateDialogOpen(false);
        setCreateForm({ username: '', email: '', password: '', roleId: '', isActive: true });
        setCreateFormErrors({});
      },
      onError: (error: any) => {
        const responseData = error.response?.data;
        const serverMsg =
          responseData?.errors?.message ||
          (typeof responseData?.errors === 'string' ? responseData.errors : null) ||
          responseData?.detail ||
          responseData?.message;

        let userFriendlyMsg = 'This email is already in use.';

        if (typeof serverMsg === 'string' && serverMsg.trim()) {
          const lower = serverMsg.toLowerCase();
          if (lower.includes('username')) {
            userFriendlyMsg = 'This username is already in use.';
            setCreateFormErrors((prev) => ({ ...prev, username: userFriendlyMsg }));
            return;
          } else if (lower.includes('email')) {
            userFriendlyMsg = 'This email is already in use.';
          } else {
            userFriendlyMsg = serverMsg;
          }
        }

        setCreateFormErrors((prev) => ({ ...prev, email: userFriendlyMsg }));
      }
    });
  };

  // ─── BUILD API FILTER LIST ────────────────────────────────────────────────
  const buildFilters = useCallback(
    (cols: Record<string, CustomFilterValue>, qs: string) => {
      const filters: { field: string; operator: string; value: string }[] = [];

      Object.entries(cols).forEach(([field, filterData]) => {
        const { value, operator } = filterData;
        if (!value) return;
        filters.push({ field, operator, value });
      });

      if (qs.trim()) {
        const parts = qs.trim().split(/\s+/);
        parts.forEach(part => {
          filters.push({ field: 'quickSearch', operator: 'contains', value: part });
        });
      }

      return filters;
    },
    []
  );

  // ─── DEBOUNCED API FILTERS ────────────────────────────────────────────────
  const [apiFilters, setApiFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setApiFilters(buildFilters(columnFilters, debouncedQuickSearch));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [columnFilters, activeQuickFilter, debouncedQuickSearch, buildFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  const handleQuickFilterClick = (code: QuickFilter) => {
    const newCode = activeQuickFilter === code ? 'all' : code;
    setActiveQuickFilter(newCode);

    setColumnFilters(_prev => {
      const next: Record<string, CustomFilterValue> = {};
      if (newCode === 'active') {
        next['isActive'] = { operator: 'is', value: 'true' };
      } else if (newCode === 'inactive') {
        next['isActive'] = { operator: 'is', value: 'false' };
      }
      return next;
    });

    setQuickSearch('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleColumnToggle = (field: string) =>
    setColumnVisibility((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleShowAll = () =>
    setColumnVisibility(Object.keys(COLUMN_NAMES).reduce((a, k) => ({ ...a, [k]: true }), {}));

  const handleHideAll = () =>
    setColumnVisibility(Object.keys(COLUMN_NAMES).reduce((a, k) => ({ ...a, [k]: false }), {}));

  // ─── API DATA ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useUsers({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters: apiFilters,
  });

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUser = useAuthStore((state) => state.currentUser);
  const permissions = useAuthStore((state) => state.permissions);
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  const isPasswordChangeRequired = currentUser?.requiresPasswordChange || 
    (permissions.includes('Users.ChangePassword') && !permissions.includes('Dashboard.Read'));

  const { data: roles = [] } = useQuery<RoleDto[]>({
    queryKey: ['roles'],
    queryFn: async () => {
      const { data } = await apiClient.get('/Roles');
      return data;
    },
    enabled: hasPermission('Roles.Read') && !isPasswordChangeRequired,
  });

  // ─── PREMIUM EXPORT (REAL EXCEL & AUTO-DESIGN) ───────────────────────────
  const handleExport = async () => {
    if (!data?.items?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('User Records');

    const allColumns = [
      { id: 'employeeId', label: 'Employee ID', getValue: (user: any) => user.employeeId || 'N/A' },
      { id: 'username', label: 'Username', getValue: (user: any) => user.username },
      { id: 'email', label: 'Email', getValue: (user: any) => user.email },
      { id: 'role', label: 'Role', getValue: (user: any) => user.role?.name || 'No Role' },
      { id: 'isActive', label: 'Status', getValue: (user: any) => user.isActive ? 'Active' : 'Inactive' },
    ];

    const visibleColumns = allColumns.filter(col => columnVisibility[col.id] !== false);

    worksheet.columns = visibleColumns.map(col => ({
      header: col.label,
      key: col.id,
      width: 18
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A1A1A' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    data.items.forEach((user, index) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.id] = col.getValue(user);
      });

      const row = worksheet.addRow(rowData);
      row.height = 22;
      const isEven = index % 2 === 0;

      row.eachCell((cell, colNumber) => {
        const colId = visibleColumns[colNumber - 1].id;
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '333333' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'EBF0F5' } },
          right: { style: 'thin', color: { argb: 'F4F7F9' } }
        };

        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFC' }
          };
        }

        if (colId === 'isActive') {
          const statusVal = cell.value;
          if (statusVal === 'Active') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '2E7D32' } };
          } else {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } };
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'C62828' } };
          }
        }
      });
    });

    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valueLen = cell.value ? cell.value.toString().length : 0;
        if (valueLen > maxLen) {
          maxLen = valueLen;
        }
      });
      column.width = Math.max(maxLen + 4, 14);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SoftlarePMS_Users_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value).length;
  const navigate = useNavigate();

  const columns: DataTableColumnDef[] = [
    {
      field: 'employeeId',
      headerName: 'Employee ID',
      flex: 1.2,
      minWidth: 185,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: params.value ? 'text.primary' : 'text.disabled' }}>
          {params.value || 'Unassigned'}
        </Typography>
      )
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1.5,
      minWidth: 200,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.8,
      minWidth: 220,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'role',
      headerName: 'Role',
      flex: 1.5,
      minWidth: 160,
      filterType: 'select',
      filterOptions: roles.map(r => ({ value: r.name, label: r.name })),
      renderCell: (params) => {
        const userRole = params.row.role;
        if (!userRole) return <Typography variant="body2" sx={{ color: 'text.disabled' }}>No Role</Typography>;
        const roleColor = getAdaptedRoleColor(userRole.color, isDark);
        return (
          <Typography
            variant="body2"
            sx={{ fontWeight: 700, color: roleColor === 'text.primary' ? 'text.primary' : roleColor }}
          >
            {userRole.name}
          </Typography>
        );
      }
    },
    {
      field: 'isActive',
      headerName: 'Status',
      flex: 1,
      minWidth: 160,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' },
      ],
      renderCell: (params) => {
        const isActive = Boolean(params.value);

        return (
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              backgroundColor: (theme) =>
                isActive
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(46, 125, 50, 0.15)'
                    : 'rgba(46, 125, 50, 0.08)'
                  : theme.palette.mode === 'dark'
                  ? 'rgba(211, 47, 47, 0.15)'
                  : 'rgba(211, 47, 47, 0.08)',
              color: (theme) =>
                isActive
                  ? theme.palette.mode === 'dark'
                    ? '#81c784'
                    : '#2e7d32'
                  : theme.palette.mode === 'dark'
                  ? '#e57373'
                  : '#d32f2f',
              border: '1px solid',
              borderColor: (theme) =>
                isActive
                  ? theme.palette.mode === 'dark'
                    ? 'rgba(129, 199, 132, 0.2)'
                    : 'rgba(46, 125, 50, 0.15)'
                  : theme.palette.mode === 'dark'
                  ? 'rgba(229, 115, 115, 0.2)'
                  : 'rgba(211, 47, 47, 0.15)',
              borderRadius: '6px',
              height: '24px',
            }}
          />
        );
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="System Users Directory"
        subtitle="Manage user accounts, system access status, and profile links."
        icon={<ManageAccountsRounded />}
        actions={
          <Stack direction="row" spacing={1.5}>
            {hasPermission('Users.Create') && (
              <Button
                variant="contained"
                startIcon={<PersonAddRounded />}
                onClick={() => setCreateDialogOpen(true)}
                sx={{
                  borderRadius: '10px',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Create User
              </Button>
            )}

            <Tooltip title="Toggle Columns" arrow>
              <Button
                variant="outlined"
                startIcon={<ViewColumnRounded />}
                onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
                sx={{
                  borderRadius: '10px',
                  borderColor: 'divider',
                  color: 'text.primary',
                  fontWeight: 600,
                  textTransform: 'none'
                }}
              >
                Columns
              </Button>
            </Tooltip>

            <Tooltip title="Export Users to Excel" arrow>
              <span>
                <Button
                  variant="outlined"
                  startIcon={<FileDownloadRounded />}
                  onClick={handleExport}
                  disabled={!data?.items?.length}
                  sx={{
                    borderRadius: '10px',
                    borderColor: 'divider',
                    color: 'text.primary',
                    fontWeight: 600,
                    textTransform: 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderColor: 'text.primary',
                    }
                  }}
                >
                  Export
                </Button>
              </span>
            </Tooltip>
          </Stack>
        }
      />

      <Menu
        anchorEl={columnMenuAnchor}
        open={Boolean(columnMenuAnchor)}
        onClose={() => setColumnMenuAnchor(null)}
        slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 220, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } } }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Visible Columns
          </Typography>
        </Box>
        <Box sx={{ px: 1, pb: 1, display: 'flex', gap: 1 }}>
          <Button size="small" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleShowAll}>Show All</Button>
          <Button size="small" color="inherit" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleHideAll}>Hide All</Button>
        </Box>
        <Divider sx={{ mb: 0.5 }} />
        {Object.keys(COLUMN_NAMES).map((key) => (
          <MenuItem key={key} onClick={() => handleColumnToggle(key)} sx={{ py: 0.5 }}>
            <Checkbox checked={columnVisibility[key] !== false} size="small" sx={{ pointerEvents: 'none', py: 0 }} />
            <ListItemText primary={COLUMN_NAMES[key]} slotProps={{ primary: { variant: 'body2' } }} />
          </MenuItem>
        ))}
      </Menu>

      {/* ── FILTER PANEL (PREMIUM GLASS EFFECT) ──────────────────────────── */}
      <Box
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          p: 3,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
          mb: 3,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Quick search by username, email or employee ID…"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: quickSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQuickSearch('')} edge="end">
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                borderRadius: '10px',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                '&:hover': {
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                },
                '&.Mui-focused': {
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 0 3px rgba(255,255,255,0.05)' : '0 0 0 3px rgba(128,128,128,0.1)',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: '1px',
              }
            }}
          />

          <Divider sx={{ opacity: 0.4 }} />

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.secondary' }}>
              <AutoAwesomeRounded fontSize="small" /> Quick Filters:
            </Typography>

            {(['all', 'active', 'inactive'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Users',
                active: 'Active Users',
                inactive: 'Inactive Users',
              };
              const isActive = activeQuickFilter === code;
              
              return (
                <Chip
                  key={code}
                  label={labels[code]}
                  onClick={() => handleQuickFilterClick(code)}
                  sx={{
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'text.primary' : 'divider',
                    backgroundColor: isActive ? 'text.primary' : 'transparent',
                    color: isActive ? 'background.paper' : 'text.primary',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                       backgroundColor: isActive 
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'
                        : 'action.hover',
                    }
                  }}
                />
              );
            })}

            {activeColumnFilterCount > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Badge badgeContent={activeColumnFilterCount} color="primary">
                  <Chip
                    icon={<FilterAltRounded />}
                    label="Column Filters Active"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={handleClearColumnFilters}
                    sx={{ fontWeight: 600 }}
                  />
                </Badge>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* ── DATA TABLE ─────────────────────────────────────────────────────── */}
      <Box 
        sx={{
          borderRadius: 4,
          overflow: 'hidden',
          backgroundColor: 'background.paper',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
        }}
      >
        <DataTable
          data={data?.items || []}
          columns={columns}
          loading={isLoading || isFetching}
          totalCount={data?.totalCount || 0}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          customFilters={columnFilters}
          onCustomFilterChange={handleCustomFilterChange}
          onRowClick={(id) => navigate(`/users/${id}`)}
        />
      </Box>

      {/* ── CREATE USER DIALOG ──────────────────────────────────────────────── */}
      <Dialog 
        open={createDialogOpen} 
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 4,
            backgroundImage: 'none',
            boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle component="div" sx={{ pb: 1, pt: 3, px: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Create New User</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Fill in the details to create a new system user account.
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 3 }}>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <TextField
              label="Username"
              name="username"
              value={createForm.username}
              onChange={handleCreateUserChange}
              error={!!createFormErrors.username}
              helperText={createFormErrors.username}
              fullWidth
              variant="outlined"
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={createForm.email}
              onChange={handleCreateUserChange}
              error={!!createFormErrors.email}
              helperText={createFormErrors.email}
              fullWidth
              variant="outlined"
            />
            <Box>
              <TextField
                label="Temporary Password"
                name="password"
                type={showCreatePassword ? 'text' : 'password'}
                value={createForm.password}
                onChange={handleCreateUserChange}
                error={!!createFormErrors.password}
                helperText={createFormErrors.password}
                fullWidth
                variant="outlined"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowCreatePassword(!showCreatePassword)}
                          edge="end"
                          size="small"
                        >
                          {showCreatePassword ? <VisibilityOffOutlined fontSize="small" /> : <VisibilityOutlined fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
              <PasswordCriteriaChecklist password={createForm.password} isDark={isDark} />
            </Box>
            <FormControl fullWidth error={!!createFormErrors.roleId}>
              <InputLabel id="role-select-label">Assign Role</InputLabel>
              <Select
                labelId="role-select-label"
                name="roleId"
                value={createForm.roleId}
                label="Assign Role"
                onChange={(e) => handleCreateUserChange({ target: { name: 'roleId', value: e.target.value } } as any)}
              >
                {roles.map((role) => (
                  <MenuItem key={role.id} value={role.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ borderRadius: '50%', backgroundColor: getAdaptedRoleColor(role.color, isDark), width: 12, height: 12 }} />
                      {role.name}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
              {createFormErrors.roleId && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1 }}>
                  {createFormErrors.roleId}
                </Typography>
              )}
            </FormControl>
            <FormControlLabel
              control={
                <Switch 
                  checked={createForm.isActive}
                  onChange={handleCreateUserChange}
                  name="isActive"
                  color="primary"
                />
              }
              label="User is Active"
              sx={{ ml: 0 }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setCreateDialogOpen(false)} 
            color="inherit" 
            sx={{ borderRadius: 2, px: 3 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUserSubmit} 
            variant="contained" 
            disabled={createUserMutation.isPending}
            sx={{ borderRadius: 2, px: 3 }}
          >
            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
