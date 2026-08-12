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
  Chip
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
  BusinessRounded,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import type {
  GridPaginationModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../../../components/DataTable/DataTable';
import { useDepartmentsList } from '../../hooks/useDepartmentsList';
import { useCreateDepartment } from '../../hooks/useCreateDepartment';
import { HasPermission } from '../../../../components/HasPermission';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import ExcelJS from 'exceljs';

const COLUMN_NAMES: Record<string, string> = {
  name: 'Department Name',
  description: 'Description',
  employeeCount: 'Employee Count',
};

type QuickFilter = 'all' | 'empty';

export const DepartmentList = () => {
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [createFormState, setCreateFormState] = useState({ name: '', description: '' });
  const { mutate: createDepartment, isPending: isCreating } = useCreateDepartment();

  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });

    if (field === 'employeeCount') {
      if (value === '0' && operator === 'is') setActiveQuickFilter('empty');
      else setActiveQuickFilter('all');
    }
  }, []);

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
  }, []);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    name: true,
    description: true,
    employeeCount: true,
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
        filters.push({ field: 'quickSearch', operator: 'contains', value: qs.trim() });
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
      if (newCode === 'empty') {
        next['employeeCount'] = { operator: 'is', value: '0' };
      } else {
        if (next['employeeCount']) next['employeeCount'] = { ...next['employeeCount'], value: '' };
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

  const { data, isLoading, isFetching } = useDepartmentsList({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters: apiFilters,
  });

  const handleExport = async () => {
    if (!data?.items?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Departments');

    const allColumns = [
      { id: 'name', label: 'Department Name', getValue: (dep: any) => dep.name },
      { id: 'description', label: 'Description', getValue: (dep: any) => dep.description },
      { id: 'employeeCount', label: 'Employee Count', getValue: (dep: any) => dep.employeeCount || 0 },
    ];

    const visibleColumns = allColumns.filter(col => columnVisibility[col.id] !== false);

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

    data.items.forEach((dep, index) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.id] = col.getValue(dep);
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
    
    a.download = `SoftlarePMS_Departments_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value).length;
  const navigate = useNavigate();

  const columns: DataTableColumnDef[] = [
    {
      field: 'name',
      headerName: 'Department Name',
      flex: 1.5,
      minWidth: 250,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {params.value}
        </Typography>
      )
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
      field: 'employeeCount',
      headerName: 'Employee Count',
      flex: 1,
      minWidth: 150,
      filterType: 'number',
      renderCell: (params) => (
        <Chip
          label={`${params.value || 0} Employees`}
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
  ];

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Departments"
        subtitle="Manage company departments and view employee distribution."
        icon={<BusinessRounded />}
        actions={
          <Stack direction="row" spacing={1.5}>
            <HasPermission requiredPermission="Departments.Create">
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
                Add Department
              </Button>
            </HasPermission>

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
            placeholder="Quick search by name or description…"
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

            {(['all', 'empty'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Departments',
                empty: 'Empty Departments'
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
          onRowClick={(id) => navigate(`/departments/${id}`)}
        />
      </Box>

      <Dialog 
        open={isCreateDialogOpen} 
        onClose={() => !isCreating && setIsCreateDialogOpen(false)}
        sx={{ '& .MuiDialog-paper': { borderRadius: 3, width: '100%', maxWidth: 500, p: 1 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Add New Department</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Department Name"
            name="name"
            value={createFormState.name}
            onChange={(e) => setCreateFormState({ ...createFormState, name: e.target.value })}
            fullWidth
            required
            autoFocus
          />
          <TextField
            label="Description"
            name="description"
            value={createFormState.description}
            onChange={(e) => setCreateFormState({ ...createFormState, description: e.target.value })}
            fullWidth
            multiline
            rows={3}
          />
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
            onClick={() => {
              if (createFormState.name) {
                createDepartment(createFormState, {
                  onSuccess: (newDept) => {
                    setIsCreateDialogOpen(false);
                    setCreateFormState({ name: '', description: '' });
                    navigate(`/departments/${newDept.id}`);
                  }
                });
              }
            }}
            disabled={!createFormState.name || isCreating}
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
