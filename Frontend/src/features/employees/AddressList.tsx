import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
} from '@mui/material';
import {
  ViewColumnRounded,
  FileDownloadRounded,
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  LocationOnRounded,
} from '@mui/icons-material';
import type { GridPaginationModel, GridColumnVisibilityModel } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../components/DataTable/DataTable';
import { useEmployees } from './hooks/useEmployees';
import { useDepartments } from './hooks/useDepartments';
import { useProfessionsLookup } from '../professions/hooks/useProfessionsLookup';
import ExcelJS from 'exceljs';
import { PageHeader } from '../../components/PageHeader/PageHeader';

const COLUMN_NAMES: Record<string, string> = {
  employeeNo: 'Employee No',
  fullName: 'Full Name',
  departmentId: 'Department',
  profession: 'Profession',
};

export const AddressList = () => {
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');
  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });
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
    employeeNo: true,
    fullName: true,
    departmentId: true,
    profession: true,
  });

  const buildFilters = useCallback(
    (cols: Record<string, CustomFilterValue>, qs: string) => {
      const filters: { field: string; operator: string; value: string }[] = [];

      Object.entries(cols).forEach(([field, filterData]) => {
        const { value, operator } = filterData;
        if (!value) return;

        if (field === 'fullName') {
          if (operator === 'firstName') {
            filters.push({ field: 'firstName', operator: 'contains', value });
          } else if (operator === 'lastName') {
            filters.push({ field: 'lastName', operator: 'contains', value });
          } else {
            const parts = value.trim().split(/\s+/);
            parts.forEach((part) => {
              filters.push({ field: 'quickSearch', operator: 'contains', value: part });
            });
          }
        } else {
          filters.push({ field, operator, value });
        }
      });

      if (qs.trim()) {
        const parts = qs.trim().split(/\s+/);
        parts.forEach((part) => {
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
  const departmentOptions = useMemo(
    () => deptData?.items.map((d: any) => ({ value: d.id, label: d.name })) || [],
    [deptData]
  );

  const { data: profData } = useProfessionsLookup();
  const professionOptions = useMemo(
    () => profData?.map((p: any) => ({ value: p.name, label: p.name })) || [],
    [profData]
  );

  const navigate = useNavigate();

  const handleExport = async () => {
    if (!data?.items?.length) return;
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Addresses');

    const allColumns = [
      { id: 'employeeNo', label: 'Employee No', getValue: (emp: any) => emp.employeeNo },
      { id: 'fullName', label: 'Full Name', getValue: (emp: any) => `${emp.firstName} ${emp.lastName}` },
      { id: 'departmentId', label: 'Department', getValue: (emp: any) => emp.department?.name || '' },
      { id: 'profession', label: 'Profession', getValue: (emp: any) => emp.professionName || '-' },
    ];

    const visibleColumns = allColumns.filter((col) => columnVisibility[col.id] !== false);

    worksheet.columns = visibleColumns.map((col) => ({
      header: col.label,
      key: col.id,
      width: 20,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1A1A1A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    data.items.forEach((emp: any, index: number) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach((col) => {
        rowData[col.id] = col.getValue(emp);
      });
      const row = worksheet.addRow(rowData);
      row.height = 22;
      const isEven = index % 2 === 0;

      row.eachCell((cell) => {
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '333333' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'EBF0F5' } },
          right: { style: 'thin', color: { argb: 'F4F7F9' } },
        };

        if (!isEven) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'F9FAFC' } };
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
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Employee_Addresses_${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter((f) => !!f.value).length;

  const columns: DataTableColumnDef[] = useMemo(
    () => [
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
        ),
      },
      {
        field: 'fullName',
        headerName: 'Full Name',
        flex: 1.5,
        minWidth: 200,
        filterType: 'fullName',
        valueGetter: (_, row: any) => `${row.firstName} ${row.lastName}`,
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'departmentId',
        headerName: 'Department',
        flex: 1.5,
        minWidth: 180,
        filterType: 'multi-select',
        filterOptions: departmentOptions,
        valueGetter: (_, row: any) => row.department?.name || 'N/A',
        renderCell: (params) => (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {params.value}
          </Typography>
        ),
      },
      {
        field: 'profession',
        headerName: 'Profession',
        flex: 1.5,
        minWidth: 180,
        filterType: 'multi-select',
        filterOptions: professionOptions,
        valueGetter: (_, row: any) => row.professionName || '-',
        renderCell: (params) => (
          <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
            {params.value}
          </Typography>
        ),
      },
    ],
    [departmentOptions, professionOptions]
  );

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Employee Addresses"
        subtitle="View and manage employee address records and history."
        icon={<LocationOnRounded />}
        actions={
          <Stack direction="row" spacing={1.5}>
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
                  },
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
                  },
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
        slotProps={{
          paper: {
            sx: { borderRadius: 3, minWidth: 220, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' },
          },
        }}
      >
        <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
            Visible Columns
          </Typography>
        </Box>
        <Box sx={{ px: 1, pb: 1, display: 'flex', gap: 1 }}>
          <Button size="small" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleShowAll}>
            Show All
          </Button>
          <Button size="small" color="inherit" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleHideAll}>
            Hide All
          </Button>
        </Box>
        <Divider sx={{ mb: 0.5 }} />
        {Object.keys(COLUMN_NAMES).map((key) => (
          <MenuItem key={key} onClick={() => handleColumnToggle(key)} sx={{ py: 0.5 }}>
            <Checkbox
              checked={columnVisibility[key] !== false}
              size="small"
              sx={{ pointerEvents: 'none', py: 0 }}
            />
            <ListItemText primary={COLUMN_NAMES[key]} slotProps={{ primary: { variant: 'body2' } }} />
          </MenuItem>
        ))}
      </Menu>

      <Box
        sx={{
          background: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) =>
            theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          p: 3,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
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
            placeholder="Quick search by name or employee no…"
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
                boxShadow: (theme) =>
                  theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                '&:hover': {
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                },
                '&.Mui-focused': {
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 0 0 3px rgba(255,255,255,0.05)'
                      : '0 0 0 3px rgba(128,128,128,0.1)',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: '1px',
              },
            }}
          />

          {activeColumnFilterCount > 0 && (
            <>
              <Divider sx={{ opacity: 0.4 }} />
              <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
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
              </Stack>
            </>
          )}
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
          onRowClick={(id) => navigate(`/employees/addresses/${id}`)}
        />
      </Box>
    </Box>
  );
};
