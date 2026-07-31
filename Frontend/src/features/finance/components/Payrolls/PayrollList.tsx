import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
  CloseRounded
} from '@mui/icons-material';
import type { GridPaginationModel, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../../../components/DataTable/DataTable';
import { useEmployees } from '../../../employees/hooks/useEmployees';
import { useDepartments } from '../../../employees/hooks/useDepartments';
import { useProfessionsLookup } from '../../../professions/hooks/useProfessionsLookup';
import ExcelJS from 'exceljs';

const COLUMN_NAMES: Record<string, string> = {
  employeeNo: 'Employee No',
  fullName: 'Full Name',
  departmentId: 'Department',
  profession: 'Profession',
  hireDate: 'Hire Date',
};

type QuickFilter = 'all' | 'new_hires';

export const PayrollList = () => {
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');
  
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');
  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      if (!value || !value.trim()) {
        delete next[field];
      } else {
        next[field] = { value, operator };
      }
      return next;
    });

    if (field === 'hireDate' && (!value || !value.trim())) {
      setActiveQuickFilter(prev => prev === 'new_hires' ? 'all' : prev);
    }
  }, []);

  const handleClearAllFilters = useCallback(() => {
    setColumnFilters({});
    setQuickSearch('');
    setActiveQuickFilter('all');
  }, []);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    employeeNo: true,
    fullName: true,
    departmentId: true,
    profession: true,
    hireDate: true,
  });

  const buildFilters = useCallback(
    (cols: Record<string, CustomFilterValue>, qs: string) => {
      const filters: { field: string; operator: string; value: string }[] = [];

      Object.entries(cols).forEach(([field, filterData]) => {
        const { value, operator } = filterData;
        if (!value || !value.trim()) return;
        
        if (field === 'hireDate') {
          const d = new Date(value + 'T00:00:00');
          filters.push({ field, operator, value: d.toISOString() });
        } else if (field === 'fullName') {
          if (operator === 'firstName') {
            filters.push({ field: 'firstName', operator: 'contains', value });
          } else if (operator === 'lastName') {
            filters.push({ field: 'lastName', operator: 'contains', value });
          } else {
            const parts = value.trim().split(/\s+/);
            parts.forEach(part => {
              filters.push({ field: 'quickSearch', operator: 'contains', value: part });
            });
          }
        } else {
          filters.push({ field, operator, value });
        }
      });

      if (qs.trim()) {
        const parts = qs.trim().split(/\s+/);
        parts.forEach(part => {
          filters.push({ field: 'quickSearch', operator: 'contains', value: part });
        });
      }
      
      // HARDCODED REQUIREMENT: ONLY ACTIVE EMPLOYEES
      filters.push({ field: 'employmentStatus', operator: 'equals', value: '1' });

      return filters;
    },
    []
  );

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
  }, [columnFilters, debouncedQuickSearch, buildFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  const handleQuickFilterClick = (code: QuickFilter) => {
    const newCode = activeQuickFilter === code ? 'all' : code;
    setActiveQuickFilter(newCode);

    setColumnFilters((prev) => {
      const next = { ...prev };
      if (newCode === 'new_hires') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        next['hireDate'] = { operator: 'after', value: thirtyDaysAgo.toISOString().split('T')[0] };
      } else {
        delete next['hireDate'];
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

  const { data, isLoading, isFetching } = useEmployees({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters: apiFilters,
  });

  const { data: deptData } = useDepartments();
  const departmentOptions = deptData?.items.map((d: any) => ({ value: d.id, label: d.name })) || [];

  const { data: profData } = useProfessionsLookup();
  const professionOptions = profData?.map((p: any) => ({ value: p.name, label: p.name })) || [];

  const handleExport = async () => {
    if (!data?.items?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Payrolls (Active)');

    const allColumns = [
      { id: 'employeeNo', label: 'Employee No', getValue: (emp: any) => emp.employeeNo },
      { id: 'fullName', label: 'Full Name', getValue: (emp: any) => `${emp.firstName} ${emp.lastName}` },
      { id: 'departmentId', label: 'Department', getValue: (emp: any) => emp.department?.name || '' },
      { id: 'profession', label: 'Profession', getValue: (emp: any) => emp.professionName || '-' },
      { id: 'hireDate', label: 'Hire Date', getValue: (emp: any) => new Date(emp.hireDate).toLocaleDateString() },
    ];

    const visibleColumns = allColumns.filter(col => columnVisibility[col.id] !== false);
    worksheet.columns = visibleColumns.map(col => ({ header: col.label, key: col.id, width: 20 }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A1A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    data.items.forEach((emp, index) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => { rowData[col.id] = col.getValue(emp); });
      const row = worksheet.addRow(rowData);
      row.height = 22;
      row.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '333333' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = { bottom: { style: 'thin', color: { argb: 'EBF0F5' } } };
        if (index % 2 !== 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFC' } };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Payrolls_Active_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value && f.value.trim() !== '').length;
  const hasQuickSearch = !!quickSearch.trim();
  const totalActiveFilterCount = activeColumnFilterCount + (hasQuickSearch ? 1 : 0);

  const navigate = useNavigate();

  const columns: DataTableColumnDef[] = [
    {
      field: 'employeeNo',
      headerName: 'Employee No',
      flex: 1,
      minWidth: 150,
      filterType: 'text',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.5,
      minWidth: 200,
      filterType: 'fullName',
      valueGetter: (_, row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: 'departmentId',
      headerName: 'Department',
      flex: 1.5,
      minWidth: 180,
      filterType: 'multi-select',
      filterOptions: departmentOptions,
      valueGetter: (_, row: any) => row.department?.name || '',
    },
    {
      field: 'profession',
      headerName: 'Profession',
      flex: 1.5,
      minWidth: 150,
      filterType: 'multi-select',
      filterOptions: professionOptions,
      valueGetter: (_, row: any) => row.professionName || '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'hireDate',
      headerName: 'Hire Date',
      flex: 1,
      minWidth: 185,
      filterType: 'date',
      valueGetter: (value: string | null | undefined) => {
        if (!value) return null;
        return new Date(value);
      },
      valueFormatter: (value: Date | null | undefined) => {
        if (!value) return '';
        return new Date(value).toLocaleDateString();
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1536, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              textShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Payrolls
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage salary calculations and generate monthly payroll slips for active employees.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Tooltip title="Manage Columns" arrow>
            <Button
              variant="outlined"
              startIcon={<ViewColumnRounded />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              sx={{ borderRadius: '10px', borderColor: 'divider', color: 'text.primary', fontWeight: 600, textTransform: 'none' }}
            >
              Columns
            </Button>
          </Tooltip>

          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 220, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } } }}
          >
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>Visible Columns</Typography>
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

          <Tooltip title="Export to Excel" arrow>
            <Button
              variant="outlined"
              startIcon={<FileDownloadRounded />}
              onClick={handleExport}
              disabled={!data?.items?.length}
              sx={{ borderRadius: '10px', borderColor: 'divider', color: 'text.primary', fontWeight: 600, textTransform: 'none' }}
            >
              Export
            </Button>
          </Tooltip>
        </Stack>
      </Box>

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
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Quick search by name or employee no…"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><SearchRounded sx={{ color: 'text.secondary', fontSize: '1.1rem' }} /></InputAdornment>
                ),
                endAdornment: quickSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQuickSearch('')} edge="end"><CloseRounded fontSize="small" /></IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                borderRadius: '10px',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
              }
            }}
          />

          <Divider sx={{ opacity: 0.4 }} />

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.secondary' }}>
              <AutoAwesomeRounded fontSize="small" /> Quick Filters:
            </Typography>

            {(['all', 'new_hires'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = { all: 'All Active', new_hires: 'New Hires (30 Days)' };
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

            {totalActiveFilterCount > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Badge badgeContent={totalActiveFilterCount} color="primary">
                  <Chip
                    icon={<FilterAltRounded />}
                    label="Column Filters Active"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={handleClearAllFilters}
                    sx={{ fontWeight: 600 }}
                  />
                </Badge>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ borderRadius: 4, overflow: 'hidden', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)' }}>
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
          onRowClick={(id) => navigate(`/finance/payrolls/${id}`)}
        />
      </Box>
    </Box>
  );
};
