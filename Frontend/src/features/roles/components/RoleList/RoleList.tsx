import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Stack,
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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import {
  ViewColumnRounded,
  FileDownloadRounded,
  AutoAwesomeRounded,
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  AddRounded,
  SaveRounded,
  CheckRounded,
  ExpandMoreRounded,
  SecurityRounded,
} from '@mui/icons-material';
import type {
  GridPaginationModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../../../components/DataTable/DataTable';
import { useNavigate } from 'react-router-dom';
import { useRolesList } from '../../hooks/useRolesList';
import { useCreateRole } from '../../hooks/useCreateRole';
import { usePermissionsList } from '../../hooks/usePermissionsList';
import { useAuthStore } from '../../../../store/useAuthStore';
import ExcelJS from 'exceljs';
import { getAdaptedRoleColor } from '../../../../theme/colorUtils';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';

const COLUMN_NAMES: Record<string, string> = {
  name: 'Role Name',
  description: 'Description',
  userCount: 'User Count',
};

type QuickFilter = 'all' | 'active' | 'inactive' | 'unused';

const ROLE_COLORS = [
  '#8A0000',
  '#9E4700', 
  '#616B00', 
  '#00732A', 
  '#007075', 
  '#004DA3', 
  '#2E148E', 
  '#6B0099', 
  '#99005C', 
  '#424242'
];

export const RoleList = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState<{name: string, description: string, color: string, permissionIds: string[]}>({ name: '', description: '', color: ROLE_COLORS[0], permissionIds: [] });
  const [createFormErrors, setCreateFormErrors] = useState<Record<string, string>>({});
  const { mutate: createRole, isPending: isCreating } = useCreateRole();

  const { data: availablePermissions } = usePermissionsList();
  const currentUserPermissions = useAuthStore(state => state.permissions);
  const canAssignPermissions = currentUserPermissions.includes('Permissions.Assign');

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
    } else if (field === 'userCount') {
      if (value === '0' && operator === 'is') setActiveQuickFilter('unused');
      else setActiveQuickFilter('all');
    }
  }, []);

  const handlePermissionToggle = (permissionId: string) => {
    setCreateFormState(prev => {
      const current = prev.permissionIds;
      if (current.includes(permissionId)) {
        return { ...prev, permissionIds: current.filter(id => id !== permissionId) };
      } else {
        return { ...prev, permissionIds: [...current, permissionId] };
      }
    });
  };

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
    setActiveQuickFilter('all');
  }, []);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    name: true,
    description: true,
    userCount: true,
  });

  const buildFilters = useCallback(
    (_qf: QuickFilter, cols: Record<string, CustomFilterValue>, qs: string) => {
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

  const [apiFilters, setApiFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setApiFilters(buildFilters(activeQuickFilter, columnFilters, debouncedQuickSearch));
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
    
    setColumnFilters(prev => {
      const next = { ...prev };
      if (newCode === 'active') {
        next['isActive'] = { operator: 'is', value: 'true' };
        if (next['userCount']) next['userCount'] = { ...next['userCount'], value: '' };
      } else if (newCode === 'inactive') {
        next['isActive'] = { operator: 'is', value: 'false' };
        if (next['userCount']) next['userCount'] = { ...next['userCount'], value: '' };
      } else if (newCode === 'unused') {
        next['userCount'] = { operator: 'is', value: '0' };
        if (next['isActive']) next['isActive'] = { ...next['isActive'], value: '' };
      } else {
        if (next['isActive']) next['isActive'] = { ...next['isActive'], value: '' };
        if (next['userCount']) next['userCount'] = { ...next['userCount'], value: '' };
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

  const { data, isLoading, isFetching } = useRolesList({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters: apiFilters,
  });

  const handleExport = async () => {
    if (!data?.items?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Roles');

    const allColumns = [
      { id: 'name', label: 'Role Name', getValue: (r: any) => r.name },
      { id: 'description', label: 'Description', getValue: (r: any) => r.description },
      { id: 'userCount', label: 'User Count', getValue: (r: any) => r.userCount || 0 },
      { id: 'isActive', label: 'Status', getValue: (r: any) => r.isActive ? 'Active' : 'Inactive' },
    ];

    const visibleColumns = allColumns.filter(col => columnVisibility[col.id] !== false || col.id === 'isActive');

    worksheet.columns = visibleColumns.map(col => ({
      header: col.label,
      key: col.id,
      width: 25
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

    data.items.forEach((r, index) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.id] = col.getValue(r);
      });

      const row = worksheet.addRow(rowData);
      row.height = 22;

      const isEven = index % 2 === 0;

      row.eachCell((cell, _colNumber) => {
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
    
    a.download = `SoftlarePMS_Roles_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value).length;

  // Role list filters preparation
  const roleNames = data?.items?.map(r => r.name) || [];
  const uniqueRoleNames = Array.from(new Set(roleNames));

  const columns: DataTableColumnDef[] = [
    {
      field: 'name',
      headerName: 'Role Name',
      flex: 1.5,
      minWidth: 250,
      filterType: 'select',
      filterOptions: uniqueRoleNames.map(name => ({ value: name, label: name })),
      renderCell: (params) => {
        const roleColor = getAdaptedRoleColor(params.row.color, isDark);
        return (
          <Typography variant="body2" sx={{ fontWeight: 700, color: roleColor === 'text.primary' ? 'text.primary' : roleColor }}>
            {params.value}
            {params.row.isSystemRole && (
              <Chip 
                label="System" 
                size="small" 
                sx={{ ml: 1, height: 20, fontSize: '0.65rem', fontWeight: 600 }} 
              />
            )}
          </Typography>
        );
      }
    },
    {
      field: 'description',
      headerName: 'Description',
      flex: 2,
      minWidth: 350,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'userCount',
      headerName: 'User Count',
      flex: 1,
      minWidth: 150,
      filterType: 'number',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0} Users`}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)',
            color: (theme) => theme.palette.mode === 'dark' ? '#64b5f6' : '#1976d2',
            border: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(100, 181, 246, 0.2)' : 'rgba(33, 150, 243, 0.15)',
            borderRadius: '6px',
            height: '24px',
          }}
        />
      ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      flex: 1,
      minWidth: 120,
      filterType: 'select',
      filterOptions: [
        { value: 'true', label: 'Active' },
        { value: 'false', label: 'Inactive' }
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
                  ? theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)'
                  : theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
              color: (theme) =>
                isActive
                  ? theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32'
                  : theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f',
              border: '1px solid',
              borderColor: (theme) =>
                isActive
                  ? theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(46, 125, 50, 0.15)'
                  : theme.palette.mode === 'dark' ? 'rgba(229, 115, 115, 0.2)' : 'rgba(211, 47, 47, 0.15)',
              borderRadius: '6px',
              height: '24px',
            }}
          />
        );
      }
    }
  ];

  const validateCreateForm = () => {
    const errors: Record<string, string> = {};
    if (!createFormState.name.trim()) errors.name = 'Role name is required';
    else if (createFormState.name.length > 100) errors.name = 'Role name cannot exceed 100 characters';
    
    if (createFormState.description && createFormState.description.length > 500) {
      errors.description = 'Description cannot exceed 500 characters';
    }
    
    setCreateFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = () => {
    if (!validateCreateForm()) return;
    
    createRole(createFormState, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        setCreateFormState({ name: '', description: '', color: ROLE_COLORS[0], permissionIds: [] });
        setCreateFormErrors({});
      },
      onError: (error: any) => {
        const responseData = error.response?.data;
        const serverMsg = responseData?.errors?.message || (typeof responseData?.errors === 'string' ? responseData.errors : null) || responseData?.detail || responseData?.message;
        
        if (typeof serverMsg === 'string' && serverMsg.toLowerCase().includes('already exists')) {
          setCreateFormErrors({ name: 'A role with this name already exists' });
        } else {
          setCreateFormErrors({ name: serverMsg || 'Failed to create role' });
        }
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Roles & Permissions"
        subtitle="Manage system roles, permissions, and user assignments."
        icon={<SecurityRounded />}
        actions={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="contained"
              startIcon={<AddRounded />}
              onClick={() => setIsCreateDialogOpen(true)}
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none',
              }}
            >
              Create Role
            </Button>

            <Tooltip title="Manage Columns" arrow>
              <Button
                variant="outlined"
                startIcon={<ViewColumnRounded />}
                onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
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
                Columns
              </Button>
            </Tooltip>

            <Tooltip title="Export to Excel" arrow>
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
            placeholder="Quick search by role name or description…"
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

            {(['all', 'active', 'inactive', 'unused'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Roles',
                active: 'Active Roles',
                inactive: 'Inactive Roles',
                unused: 'Unused Roles'
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
          totalCount={data?.totalCount || 0}
          loading={isLoading || isFetching}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          customFilters={columnFilters}
          onCustomFilterChange={handleCustomFilterChange}
          onRowClick={(id) => navigate(`/settings/roles/${id}`)}
        />
      </Box>

      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => !isCreating && setIsCreateDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, width: '100%', maxWidth: 500, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Create New Role</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Role Name"
            name="name"
            value={createFormState.name}
            onChange={(e) => {
              setCreateFormState({ ...createFormState, name: e.target.value });
              if (createFormErrors.name) setCreateFormErrors({ ...createFormErrors, name: '' });
            }}
            error={!!createFormErrors.name}
            helperText={createFormErrors.name}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            name="description"
            value={createFormState.description}
            onChange={(e) => {
              setCreateFormState({ ...createFormState, description: e.target.value });
              if (createFormErrors.description) setCreateFormErrors({ ...createFormErrors, description: '' });
            }}
            error={!!createFormErrors.description}
            helperText={createFormErrors.description}
            fullWidth
            multiline
            rows={3}
          />

          <Accordion 
            disableGutters 
            elevation={0} 
            sx={{ 
              mt: 1,
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: '8px !important',
              '&:before': { display: 'none' } 
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
                  <Typography sx={{ fontWeight: 700, color: getAdaptedRoleColor(createFormState.color, false), fontSize: '0.85rem' }}>
                    {createFormState.name || 'Role Name'}
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, p: 1, borderRadius: 2, border: '1px solid', borderColor: 'divider', bgcolor: '#121212' }}>
                  <Typography variant="caption" sx={{ color: '#aaa', mb: 0.5, display: 'block' }}>Dark Mode</Typography>
                  <Typography sx={{ fontWeight: 700, color: getAdaptedRoleColor(createFormState.color, true), fontSize: '0.85rem' }}>
                    {createFormState.name || 'Role Name'}
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
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider'
              }}>
                {ROLE_COLORS.map(color => {
                  const isSelected = createFormState.color === color;
                  const lightColor = getAdaptedRoleColor(color, false);
                  const darkColor = getAdaptedRoleColor(color, true);
                  
                  return (
                    <Box
                      key={color}
                      onClick={() => setCreateFormState({ ...createFormState, color })}
                      sx={{
                        aspectRatio: '1',
                        width: '100%',
                        borderRadius: 1,
                        cursor: 'pointer',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: isSelected ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 3px ${theme.palette.primary.main}` : '0 1px 2px rgba(0,0,0,0.1)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          boxShadow: isSelected ? `0 0 0 2px ${theme.palette.background.paper}, 0 0 0 3px ${theme.palette.primary.main}` : '0 2px 4px rgba(0,0,0,0.15)'
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

          {canAssignPermissions && (
            <Accordion 
              disableGutters 
              elevation={0} 
              sx={{ 
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: '8px !important',
                '&:before': { display: 'none' } 
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRounded />}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  Assign Permissions (Optional)
                </Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0, maxHeight: 250, overflowY: 'auto' }}>
                {availablePermissions && availablePermissions.length > 0 ? (
                  <FormGroup>
                    {availablePermissions.map(permission => (
                      <FormControlLabel
                        key={permission.id}
                        control={
                          <Checkbox
                            size="small"
                            checked={createFormState.permissionIds.includes(permission.id)}
                            onChange={() => handlePermissionToggle(permission.id)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>{permission.name}</Typography>
                            <Typography variant="caption" color="text.secondary">{permission.description}</Typography>
                          </Box>
                        }
                        sx={{ mb: 1, alignItems: 'flex-start', '& .MuiCheckbox-root': { pt: 0.5 } }}
                      />
                    ))}
                  </FormGroup>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No assignable permissions found.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={() => setIsCreateDialogOpen(false)} 
            disabled={isCreating}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={handleCreateSubmit}
            disabled={isCreating}
            startIcon={<SaveRounded />}
            sx={{ textTransform: 'none', fontWeight: 600, borderRadius: '8px', boxShadow: 'none' }}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
