import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
  TextField,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Chip,
  Avatar,
  CircularProgress,
  Alert,
  Tooltip,
  useTheme
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import {
  CloseRounded,
  SearchRounded,
  ClearRounded,
  AccountBalanceWalletRounded,
  AccessTimeRounded,
  ReceiptLongRounded,
  ArrowForwardRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { financeApi } from '../../finance';;
import type { MissingFinanceRecordDto, PaginatedList } from '../../finance';;

export interface FinanceAlertMissingRecordsModalProps {
  open: boolean;
  onClose: () => void;
  year: number;
  month: number;
  missingType?: 'Timesheet' | 'Payroll' | 'Both';
  periodName?: string;
}

export const FinanceAlertMissingRecordsModal: React.FC<FinanceAlertMissingRecordsModalProps> = ({
  open,
  onClose,
  year,
  month,
  missingType = 'Both',
  periodName
}) => {
  const theme = useTheme();
  const navigate = useNavigate();

  const [searchInput, setSearchInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PaginatedList<MissingFinanceRecordDto> | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchTerm(searchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchRecords = useCallback(async () => {
    if (!open || !year || !month) return;
    setLoading(true);
    setError(null);
    try {
      const response = await financeApi.getMissingFinanceRecords({
        year,
        month,
        missingType,
        searchTerm: searchTerm.trim() || undefined,
        pageNumber: page + 1,
        pageSize: rowsPerPage
      });
      setData(response);
    } catch (err: any) {
      console.error('Failed to fetch missing finance records:', err);
      setError(err?.response?.data?.message || 'Failed to load missing finance records.');
    } finally {
      setLoading(false);
    }
  }, [open, year, month, missingType, searchTerm, page, rowsPerPage]);

  useEffect(() => {
    if (open) {
      fetchRecords();
    } else {
      setSearchInput('');
      setSearchTerm('');
      setPage(0);
      setData(null);
      setError(null);
    }
  }, [open, fetchRecords]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleGoToTimesheet = (employeeId: string) => {
    onClose();
    navigate(`/finance/timesheets/${employeeId}?year=${year}&month=${month}`);
  };

  const handleGoToPayroll = (employeeId: string) => {
    onClose();
    navigate(`/finance/payrolls/${employeeId}`);
  };

  // MissingType strictly controls button rendering (dumb client)
  const canShowTimesheetBtn = missingType === 'Timesheet' || missingType === 'Both';
  const canShowPayrollBtn = missingType === 'Payroll' || missingType === 'Both';

  const displayPeriod = periodName || `${year}-${String(month).padStart(2, '0')}`;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha('#000', 0.6),
        },
        '& .MuiDialog-paper': {
          borderRadius: '16px',
          backgroundImage: 'none',
          boxShadow: theme.palette.mode === 'dark'
            ? '0 24px 48px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            : '0 24px 48px -12px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh'
        }
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          p: 2.5,
          pb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.08 : 0.04)
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: alpha(theme.palette.warning.main, 0.15),
              color: theme.palette.warning.main,
              width: 42,
              height: 42
            }}
          >
            <AccountBalanceWalletRounded />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Missing Finance Records
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              Period: <strong>{displayPeriod}</strong> • Scope: <strong>{missingType}</strong>
            </Typography>
          </Box>
        </Box>
        <IconButton
          onClick={onClose}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              bgcolor: alpha(theme.palette.text.primary, 0.05),
              color: 'text.primary'
            }
          }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3, pt: 3.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Search & Stats Bar */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2
          }}
        >
          <TextField
            size="small"
            placeholder="Search by employee name or number..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(0);
            }}
            sx={{ width: { xs: '100%', sm: 360 } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded fontSize="small" sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => { setSearchInput(''); setSearchTerm(''); }}>
                      <ClearRounded fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            }}
          />

          {data && (
            <Chip
              label={`Total Missing: ${data.totalCount} employee(s)`}
              color="warning"
              variant="outlined"
              size="medium"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Table */}
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{
            flex: 1,
            borderRadius: '12px',
            borderColor: 'divider',
            maxHeight: 440,
            overflowY: 'auto'
          }}
        >
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Employee</TableCell>
                <TableCell sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Department / Role</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Timesheet</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Payroll Slip</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, bgcolor: 'background.paper' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody sx={{ opacity: loading && data ? 0.6 : 1, transition: 'opacity 0.2s', pointerEvents: loading ? 'none' : 'auto' }}>
              {loading && (!data || data.items.length === 0) ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <CircularProgress size={36} color="warning" />
                    <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1.5 }}>
                      Loading missing finance records...
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : !data || data.items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography variant="body1" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                      No missing records found
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.disabled', mt: 0.5 }}>
                      All active employees have completed records for this period.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data.items.map((row) => (
                  <TableRow
                    key={row.employeeId}
                    hover
                    sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
                  >
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            fontSize: '0.85rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.12),
                            color: 'primary.main',
                            fontWeight: 700
                          }}
                        >
                          {row.firstName?.[0]}
                          {row.lastName?.[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                            {row.fullName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>
                            {row.employeeNo}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ lineHeight: 1.2 }}>
                        {row.departmentName || '—'}
                      </Typography>
                      {row.professionName && (
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {row.professionName}
                        </Typography>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={row.hasTimesheet ? 'Entered' : 'Missing'}
                        color={row.hasTimesheet ? 'success' : 'error'}
                        size="small"
                        variant={row.hasTimesheet ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 600, minWidth: 70 }}
                      />
                    </TableCell>

                    <TableCell align="center">
                      <Chip
                        label={row.hasPayroll ? 'Generated' : 'Missing'}
                        color={row.hasPayroll ? 'success' : 'error'}
                        size="small"
                        variant={row.hasPayroll ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 600, minWidth: 70 }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        {canShowTimesheetBtn && (
                          <Tooltip title={`Open Timesheet Matrix for ${row.fullName}`}>
                            <Button
                              size="small"
                              variant="outlined"
                              color="primary"
                              startIcon={<AccessTimeRounded />}
                              onClick={() => handleGoToTimesheet(row.employeeId)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderRadius: '8px'
                              }}
                            >
                              Timesheet
                            </Button>
                          </Tooltip>
                        )}

                        {canShowPayrollBtn && (
                          <Tooltip title={`Open Payroll Slip for ${row.fullName}`}>
                            <Button
                              size="small"
                              variant="contained"
                              color="warning"
                              startIcon={<ReceiptLongRounded />}
                              endIcon={<ArrowForwardRounded fontSize="inherit" />}
                              onClick={() => handleGoToPayroll(row.employeeId)}
                              sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.75rem',
                                borderRadius: '8px'
                              }}
                            >
                              Payroll
                            </Button>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {data && data.totalCount > 0 && (
          <TablePagination
            component="div"
            count={data.totalCount}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{ borderTop: '1px solid', borderColor: 'divider' }}
          />
        )}
      </DialogContent>

      {/* Footer */}
      <DialogActions sx={{ p: 2, px: 2.5, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
