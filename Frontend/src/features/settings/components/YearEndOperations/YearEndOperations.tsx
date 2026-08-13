import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Card,
  CardContent,
  Divider,
  Badge,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  WarningRounded,
  CheckCircleRounded,
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
  EventBusyRounded,
  DateRangeRounded,
  AutoAwesomeRounded,
} from '@mui/icons-material';
import { useYearEndStats } from '../../../finance';;
import { useCloseYearRollover } from '../../../finance';;
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { DataTableColumnDef, CustomFilterValue } from '../../../../components/DataTable/DataTable';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import type { GridPaginationModel, GridColumnVisibilityModel } from '@mui/x-data-grid';

type QuickFilter = 'all' | 'missing' | 'complete';

export const YearEndOperations = () => {
  const currentYear = new Date().getFullYear();
  const { data: stats, isLoading, refetch, isFetching } = useYearEndStats(currentYear);
  const closeYearMutation = useCloseYearRollover();

  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });

  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    fullName: true,
    departmentName: true,
    expectedTimesheets: true,
    timesheetsCount: true,
    missingTimesheetsCount: true,
  });

  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const activeQuickFilter = useMemo(() => {
    const filter = columnFilters['missingTimesheetsCount'];
    if (!filter || (!filter.value && filter.value !== '0')) return 'all';
    if (filter.value === '0' && filter.operator === 'morethan') return 'missing';
    if (filter.value === '0' && (filter.operator === 'equals' || filter.operator === 'is')) return 'complete';
    return 'all';
  }, [columnFilters]);

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  }, []);

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
  }, []);

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 350);
    return () => { if (debounceTimer.current) clearTimeout(debounceTimer.current); };
  }, [columnFilters, debouncedQuickSearch]);

  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [resultPopup, setResultPopup] = useState<{ open: boolean; message: string; title: string }>({ open: false, message: '', title: '' });

  const columns: DataTableColumnDef[] = [
    {
      field: 'fullName',
      headerName: 'Employee',
      flex: 0.7,
      minWidth: 150,
      filterType: 'text',
      renderCell: (params: any) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'departmentName',
      headerName: 'Department',
      flex: 1,
      minWidth: 160,
      filterType: 'text',
      renderCell: (params: any) => (
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'expectedTimesheets',
      headerName: 'Expected',
      filterType: 'number',
      width: 170,
    },
    {
      field: 'timesheetsCount',
      headerName: 'Submitted',
      filterType: 'number',
      width: 170,
    },
    {
      field: 'missingTimesheetsCount',
      headerName: 'Missing',
      filterType: 'number',
      width: 170,
      renderCell: (params: any) => (
        params.value > 0 ? (
          <Chip
            label={params.value}
            size="small"
            sx={{
              fontWeight: 700,
              fontSize: '0.75rem',
              backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
              color: 'error.main',
              border: '1px solid',
              borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.3)' : 'rgba(211, 47, 47, 0.2)',
              borderRadius: '6px',
              height: '24px',
            }}
          />
        ) : (
          <Typography variant="body2" color="text.secondary">0</Typography>
        )
      ),
    },
  ];

  const allRows = useMemo(() => {
    if (!stats?.employees) return [];
    return stats.employees.map((emp: any) => ({ ...emp, id: emp.employeeId }));
  }, [stats]);

  const filteredRows = useMemo(() => {
    let items = [...allRows];

    // Quick search: fullName + departmentName (AND logic for parts)
    if (debouncedQuickSearch.trim()) {
      const qsParts = debouncedQuickSearch.trim().toLowerCase().split(/\s+/);
      items = items.filter((row) => 
        qsParts.every(part => 
          row.fullName?.toLowerCase().includes(part) ||
          row.departmentName?.toLowerCase().includes(part)
        )
      );
    }

    // Column filters
    Object.entries(columnFilters).forEach(([field, filter]) => {
      if (!filter.value && filter.value !== '0') return;
      const val = filter.value;
      items = items.filter((row) => {
        const cellVal = row[field as keyof typeof row];
        if (filter.operator === 'contains') return String(cellVal ?? '').toLowerCase().includes(val.toLowerCase());
        if (filter.operator === 'equals') return String(cellVal) === val;
        if (filter.operator === 'startswith') return String(cellVal ?? '').toLowerCase().startsWith(val.toLowerCase());
        if (filter.operator === 'endswith') return String(cellVal ?? '').toLowerCase().endsWith(val.toLowerCase());
        if (filter.operator === 'is') return String(cellVal) === val;
        if (filter.operator === 'morethan') return Number(cellVal) > Number(val);
        if (filter.operator === 'lessthan') return Number(cellVal) < Number(val);
        return true;
      });
    });

    return items;
  }, [allRows, debouncedQuickSearch, columnFilters]);

  const pagedRows = useMemo(() => {
    const start = paginationModel.page * paginationModel.pageSize;
    return filteredRows.slice(start, start + paginationModel.pageSize);
  }, [filteredRows, paginationModel]);

  const activeColumnFilterCount = Object.values(columnFilters).filter((f) => !!f.value).length;
  const isYearClosed = !!stats?.isYearClosed;
  const isYearActuallyOver = useMemo(() => {
    return new Date().getFullYear() > currentYear;
  }, [currentYear]);

  // Summary numbers
  const employeesWithMissing = allRows.filter((e: any) => e.missingTimesheetsCount > 0).length;
  const totalMissing = stats?.totalMissingTimesheets || 0;
  const totalAffected = stats?.totalAffectedEmployees || 0;

  const handleConfirmClose = () => {
    closeYearMutation.mutate(currentYear, {
      onSuccess: () => {
        setIsConfirmOpen(false);
        setResultPopup({ open: true, title: 'Success', message: `Year ${currentYear} closed successfully. Leave balances have been rolled over for ${totalAffected} employees.` });
        refetch();
      },
      onError: (error: any) => {
        setIsConfirmOpen(false);
        setResultPopup({ open: true, title: 'Error', message: error.response?.data?.message || error.message || 'Failed to close year.' });
      },
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Year-End Operations"
        subtitle={`Review missing timesheets and process year-end leave rollovers for ${currentYear}.`}
        icon={<DateRangeRounded />}
        actions={
          <Button
            variant="contained"
            size="large"
            disabled={isYearClosed || isLoading || closeYearMutation.isPending}
            onClick={() => setIsConfirmOpen(true)}
            startIcon={isYearClosed ? <CheckCircleRounded /> : <EventBusyRounded />}
            color={isYearClosed ? 'inherit' : 'error'}
            sx={{
              fontWeight: 700,
              px: 3,
              py: 1.2,
              borderRadius: '10px',
              boxShadow: 'none',
              textTransform: 'none',
              minWidth: 200,
            }}
          >
            {closeYearMutation.isPending
              ? 'Processing…'
              : isYearClosed
              ? `${currentYear} Already Closed`
              : `Close Year ${currentYear}`}
          </Button>
        }
      />



      {isYearClosed && (
        <Card
          sx={{
            mb: 3,
            border: '1px solid',
            borderColor: 'success.main',
            borderRadius: 3,
            background: (theme) =>
              theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(46, 125, 50, 0.05)',
          }}
        >
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
              <CheckCircleRounded color="success" sx={{ fontSize: 28 }} />
              <Box>
                <Typography color="success.main" sx={{ fontWeight: 700 }}>
                  {currentYear} Already Closed on{' '}
                  {stats?.closedAt
                    ? new Date(stats.closedAt).toLocaleDateString('en-US', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '—'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Leave balances have already been rolled over. No further actions required.
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }} gutterBottom>
              Monthly Employees
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }}>{isLoading ? '—' : totalAffected}</Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid', borderColor: employeesWithMissing > 0 ? 'warning.main' : 'divider', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }} gutterBottom>
              Employees with Missing Timesheets
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }} color={employeesWithMissing > 0 ? 'warning.main' : 'text.primary'}>
              {isLoading ? '—' : employeesWithMissing}
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: 3, border: '1px solid', borderColor: totalMissing > 0 ? 'error.main' : 'divider', boxShadow: 'none' }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }} gutterBottom>
              Total Missing Timesheets
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800 }} color={totalMissing > 0 ? 'error.main' : 'text.primary'}>
              {isLoading ? '—' : totalMissing}
            </Typography>
          </CardContent>
        </Card>
      </Stack>

      <Box
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
          borderRadius: 4,
          p: 3,
          boxShadow: (theme) =>
            theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.4)'
              : '0 8px 32px rgba(0,0,0,0.04)',
          mb: 3,
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Quick search by name or department…"
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
                transition: 'box-shadow 0.2s ease',
                '&.Mui-focused': {
                  boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                      ? '0 0 0 3px rgba(255,255,255,0.05)'
                      : '0 0 0 3px rgba(128,128,128,0.1)',
                },
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' },
            }}
          />

          <Divider sx={{ opacity: 0.4 }} />

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.secondary' }}>
              <AutoAwesomeRounded fontSize="small" /> Quick Filters:
            </Typography>

            {(['all', 'missing', 'complete'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Operations',
                missing: 'Missing Timesheets',
                complete: 'Complete'
              };
              const isActive = activeQuickFilter === code;
              
              return (
                <Chip
                  key={code}
                  label={labels[code]}
                  onClick={() => {
                    const newCode = activeQuickFilter === code ? 'all' : code;
                    if (newCode === 'missing') {
                      handleCustomFilterChange('missingTimesheetsCount', '0', 'morethan');
                    } else if (newCode === 'complete') {
                      handleCustomFilterChange('missingTimesheetsCount', '0', 'is');
                    } else {
                      handleCustomFilterChange('missingTimesheetsCount', '', 'is');
                    }
                  }}
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
          </Stack>

          {activeColumnFilterCount > 0 && (
            <>
              <Divider sx={{ opacity: 0.4 }} />
              <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
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
          boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        }}
      >
        <DataTable
          data={pagedRows}
          totalCount={filteredRows.length}
          loading={isLoading || isFetching}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          customFilters={columnFilters}
          onCustomFilterChange={handleCustomFilterChange}
        />
      </Box>

      <PopupDialog
        open={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title={`Close Year ${currentYear}`}
        icon={<WarningRounded color="error" sx={{ fontSize: 40 }} />}
        content={
          <Box sx={{ mt: 1 }}>
            <Typography gutterBottom>
              This is an <strong>irreversible action</strong>. Once confirmed, the year will be locked and carried-over leave balances will be calculated for all monthly employees.
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 1 }}>
              <Box sx={{ flex: 1, p: 1.5, borderRadius: 2, border: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 800 }}>{totalAffected}</Typography>
                <Typography variant="caption" color="text.secondary">Employees Affected</Typography>
              </Box>
              <Box
                sx={{
                  flex: 1, p: 1.5, borderRadius: 2, border: '1px solid',
                  borderColor: totalMissing > 0 ? 'error.main' : 'divider',
                  textAlign: 'center',
                  background: totalMissing > 0
                    ? (theme) => theme.palette.mode === 'dark' ? 'rgba(211,47,47,0.08)' : 'rgba(211,47,47,0.04)'
                    : 'transparent',
                }}
              >
                <Typography variant="h4" sx={{ fontWeight: 800 }} color={totalMissing > 0 ? 'error.main' : 'text.primary'}>{totalMissing}</Typography>
                <Typography variant="caption" color={totalMissing > 0 ? 'error.main' : 'text.secondary'}>Missing Timesheets</Typography>
              </Box>
            </Stack>

            {!isYearActuallyOver && (
              <Box
                sx={{
                  mt: 2, p: 2, borderRadius: 2,
                  border: '1px solid', borderColor: 'warning.main',
                  background: (theme) => theme.palette.mode === 'dark' ? 'rgba(237,108,2,0.1)' : 'rgba(237,108,2,0.05)',
                }}
              >
                <Typography color="warning.main" sx={{ fontWeight: 700 }} variant="body2">
                  ⚠ The year {currentYear} hasn't ended yet!
                </Typography>
                <Typography color="warning.dark" variant="body2" sx={{ mt: 0.5 }}>
                  You are attempting an early closure. Are you absolutely sure all operations for {currentYear} are finalized?
                </Typography>
              </Box>
            )}
          </Box>
        }
        confirmText="Yes, Close Year"
        cancelText="Cancel"
        onConfirm={handleConfirmClose}
        confirmColor="error"
      />

      <PopupDialog
        open={resultPopup.open}
        onClose={() => setResultPopup({ ...resultPopup, open: false })}
        title={resultPopup.title}
        icon={
          resultPopup.title === 'Success'
            ? <CheckCircleRounded color="success" sx={{ fontSize: 40 }} />
            : <WarningRounded color="error" sx={{ fontSize: 40 }} />
        }
        content={resultPopup.message}
        confirmText="OK"
        onConfirm={() => setResultPopup({ ...resultPopup, open: false })}
        hideCancel
      />
    </Box>
  );
};
