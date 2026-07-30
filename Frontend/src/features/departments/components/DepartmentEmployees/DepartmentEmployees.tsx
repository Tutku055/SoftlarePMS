import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  TextField,
  MenuItem,
  CircularProgress,
  InputAdornment,
  IconButton,
  Chip,
} from '@mui/material';
import { SearchRounded, CloseRounded } from '@mui/icons-material';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { DataTableColumnDef, CustomFilterValue } from '../../../../components/DataTable/DataTable';
import { useEmployees } from '../../../employees/hooks/useEmployees';
import { useDepartmentsLookup } from '../../hooks/useDepartmentsLookup';

const premiumInputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.6)' : 'background.paper',
    borderRadius: '10px',
    minWidth: '250px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    '&:hover': {
      boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(128, 128, 128, 0.1)',
    }
  },
};

export const DepartmentEmployees = () => {
  const navigate = useNavigate();
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>('');

  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });

  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  useEffect(() => {
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  }, [debouncedQuickSearch]);

  const [customFilters, setCustomFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = (field: string, value: string, operator: string) => {
    setCustomFilters(prev => ({
      ...prev,
      [field]: { value, operator }
    }));
    setPaginationModel(prev => ({ ...prev, page: 0 }));
  };

  const { data: departmentsLookup, isLoading: isDepartmentsLoading } = useDepartmentsLookup();

  // Create filters array
  const filters: any[] = [];
  if (selectedDepartmentId) {
    filters.push({ field: 'departmentId', operator: 'equals', value: selectedDepartmentId });
  }

  if (debouncedQuickSearch.trim()) {
    const qsParts = debouncedQuickSearch.trim().split(/\s+/);
    qsParts.forEach(part => {
      filters.push({ field: 'quickSearch', operator: 'contains', value: part });
    });
  }

  Object.entries(customFilters).forEach(([field, filterState]) => {
    if (filterState.value) {
      if (field === 'fullName') {
        if (filterState.operator === 'firstName') {
          filters.push({ field: 'firstName', operator: 'contains', value: filterState.value });
        } else if (filterState.operator === 'lastName') {
          filters.push({ field: 'lastName', operator: 'contains', value: filterState.value });
        } else {
          const parts = filterState.value.trim().split(/\s+/);
          parts.forEach(part => {
            filters.push({ field: 'quickSearch', operator: 'contains', value: part });
          });
        }
      } else {
        filters.push({
          field,
          operator: filterState.operator,
          value: filterState.value
        });
      }
    }
  });

  const { data: employeesData, isLoading: isEmployeesLoading, isFetching: isEmployeesFetching } = useEmployees({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters
  });

  const employeeColumns: DataTableColumnDef[] = [
    {
      field: 'employeeNo',
      headerName: 'Employee No',
      flex: 1,
      minWidth: 150,
      filterType: 'text',
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
      field: 'profession',
      headerName: 'Profession',
      flex: 1.5,
      minWidth: 200,
      filterType: 'text',
      valueGetter: (_, row: any) => row.professionName || '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'employmentStatus',
      headerName: 'Status',
      flex: 1,
      minWidth: 185,
      filterType: 'select',
      filterOptions: [
        { value: '1', label: 'Active' },
        { value: '2', label: 'On Leave' },
        { value: '3', label: 'Terminated' },
      ],
      renderCell: (params) => {
        const val = params.value as number;
        
        const getChipStyles = (status: number) => {
          switch(status) {
            case 1:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(46, 125, 50, 0.15)',
                label: 'Active'
              };
            case 2:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#ffb74d' : '#ed6c02',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 183, 77, 0.2)' : 'rgba(237, 108, 2, 0.15)',
                label: 'On Leave'
              };
            case 3:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(229, 115, 115, 0.2)' : 'rgba(211, 47, 47, 0.15)',
                label: 'Terminated'
              };
            default:
              return {
                bg: 'transparent',
                color: 'text.secondary',
                border: 'divider',
                label: 'Unknown'
              };
          }
        };

        const styles = getChipStyles(val);

        return (
          <Chip
            label={styles.label}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              backgroundColor: styles.bg,
              color: styles.color,
              border: '1px solid',
              borderColor: styles.border,
              borderRadius: '6px',
              height: '24px',
            }}
          />
        );
      },
    }
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
              textShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 1px 2px rgba(0,0,0,0.5)' 
                : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Department Employees
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            View and filter employees by their assigned departments.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          {isDepartmentsLoading ? (
            <CircularProgress size={24} />
          ) : (
            <TextField
              select
              label="Filter by Department"
              size="small"
              value={selectedDepartmentId}
              onChange={(e) => {
                setSelectedDepartmentId(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 })); // Reset page on filter
              }}
              sx={premiumInputSx}
            >
              <MenuItem value="">
                <em>All Departments</em>
              </MenuItem>
              {departmentsLookup?.map((dept) => (
                <MenuItem key={dept.id} value={dept.id}>
                  {dept.name}
                </MenuItem>
              ))}
            </TextField>
          )}
        </Stack>
      </Box>

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
            placeholder="Quick search by first name, last name…"
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
          data={employeesData?.items || []}
          totalCount={employeesData?.totalCount || 0}
          loading={isEmployeesLoading || isEmployeesFetching}
          columns={employeeColumns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          customFilters={customFilters}
          onCustomFilterChange={handleCustomFilterChange}
          onRowClick={(employeeId) => navigate(`/employees/${employeeId}`)}
        />
      </Box>
    </Box>
  );
};
