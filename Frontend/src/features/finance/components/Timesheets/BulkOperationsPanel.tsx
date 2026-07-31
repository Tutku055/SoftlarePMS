import React, { useState, useEffect } from 'react';
import {
  Box,
  Collapse,
  Typography,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Button,
  Divider,
  Alert,
  TextField,
  InputLabel,
  FormControl,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  AutoAwesomeRounded,
  CloseRounded,
  PlayArrowRounded,
  CalendarTodayRounded,
  DateRangeRounded,
  EventRounded,
} from '@mui/icons-material';
import {
  BulkTimesheetAction,
  BulkTimesheetScope,
  BulkTimesheetPeriodType,
} from '../../types';
import { useDepartmentsLookup } from '../../../departments/hooks/useDepartmentsLookup';
import { useBulkTimesheetOperation } from '../../hooks/useBulkTimesheetOperation';
import { useOvertimeTypes } from '../../hooks/useOvertimeTypes';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';

interface BulkOperationsPanelProps {
  open: boolean;
  onClose: () => void;
  selectedRowIds: Set<string>;
  onClearSelection: () => void;
  scope: BulkTimesheetScope;
  setScope: (scope: BulkTimesheetScope) => void;
  departmentId: string;
  setDepartmentId: (id: string) => void;
  totalCount: number;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  open,
  onClose,
  selectedRowIds,
  onClearSelection,
  scope,
  setScope,
  departmentId,
  setDepartmentId,
  totalCount,
}) => {
  const { data: departments } = useDepartmentsLookup();
  const { data: overtimeTypes } = useOvertimeTypes();
  const bulkMutation = useBulkTimesheetOperation();

  // Panel State
  const [periodType, setPeriodType] = useState<BulkTimesheetPeriodType>(BulkTimesheetPeriodType.Month);
  const [action, setAction] = useState<BulkTimesheetAction>(BulkTimesheetAction.GenerateTimesheet);

  // Period State
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();
  const todayStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;

  const [year, setYear] = useState<number>(currentYear);
  const [month, setMonth] = useState<number>(currentMonth);
  const [day, setDay] = useState<number>(currentDay);
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Action State
  const [status, setStatus] = useState<number | ''>(''); // TimesheetStatus enum values
  const [overtimeHours, setOvertimeHours] = useState<number | ''>('');
  const [overtimeTypeId, setOvertimeTypeId] = useState<string>('');
  const [paidLeaveHours, setPaidLeaveHours] = useState<number | ''>('');
  const [unpaidLeaveHours, setUnpaidLeaveHours] = useState<number | ''>('');

  useEffect(() => {
    setStatus('');
    setOvertimeHours('');
    setOvertimeTypeId('');
    setPaidLeaveHours('');
    setUnpaidLeaveHours('');
  }, [action]);
  
  // Result Dialog State
  const [resultDialogOpen, setResultDialogOpen] = useState(false);
  const [resultData, setResultData] = useState<{ processed: number; skipped: number; reasons: Record<string, string[]> } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleScopeChange = (newScope: BulkTimesheetScope) => {
    setScope(newScope);
    if (selectedRowIds.size > 0) {
      onClearSelection();
    }
  };

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Rule 5 Enforcer
  useEffect(() => {
    if (periodType === BulkTimesheetPeriodType.Month) {
      if (action === BulkTimesheetAction.ApplyStatus || action === BulkTimesheetAction.ApplyOvertime || action === BulkTimesheetAction.ApplyLeaveHours) {
        setAction(BulkTimesheetAction.GenerateTimesheet);
      }
    } else {
      if (action !== BulkTimesheetAction.ApplyStatus && action !== BulkTimesheetAction.ApplyOvertime && action !== BulkTimesheetAction.ApplyLeaveHours) {
        setAction(BulkTimesheetAction.ApplyStatus);
      }
    }
  }, [periodType, action]);

  const handleExecute = async () => {
    setErrorMsg(null);
    try {
      const res = await bulkMutation.mutateAsync({
        action,
        scope,
        periodType,
        year,
        month,
        day: periodType === BulkTimesheetPeriodType.Day ? day : undefined,
        startDate: periodType === BulkTimesheetPeriodType.DayInterval ? startDate : undefined,
        endDate: periodType === BulkTimesheetPeriodType.DayInterval ? endDate : undefined,
        departmentId: scope === BulkTimesheetScope.Department ? departmentId : undefined,
        employeeIds: scope === BulkTimesheetScope.Selected ? Array.from(selectedRowIds) : undefined,
        status: action === BulkTimesheetAction.ApplyStatus ? Number(status) : undefined,
        overtimeHours: action === BulkTimesheetAction.ApplyOvertime && overtimeHours !== '' ? Number(overtimeHours) : undefined,
        overtimeTypeId: action === BulkTimesheetAction.ApplyOvertime && overtimeTypeId ? overtimeTypeId : undefined,
        paidLeaveHours: action === BulkTimesheetAction.ApplyLeaveHours && paidLeaveHours !== '' ? Number(paidLeaveHours) : undefined,
        unpaidLeaveHours: action === BulkTimesheetAction.ApplyLeaveHours && unpaidLeaveHours !== '' ? Number(unpaidLeaveHours) : undefined,
      });

      if (res.skipped === 0) {
        setSnackbarMessage(`Successfully processed ${res.processed} records.`);
        setSnackbarOpen(true);
        onClearSelection();
      } else {
        setResultData({
          processed: res.processed,
          skipped: res.skipped,
          reasons: res.skippedReasons,
        });
        setResultDialogOpen(true);
      }
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || err.message || 'An error occurred during bulk operation.');
    }
  };

  const isExecuteDisabled = () => {
    if (bulkMutation.isPending) return true;
    if (scope === BulkTimesheetScope.Department && !departmentId) return true;
    if (scope === BulkTimesheetScope.Selected && selectedRowIds.size === 0) return true;
    if (action === BulkTimesheetAction.ApplyStatus && status === '') return true;
    if (action === BulkTimesheetAction.ApplyOvertime && (overtimeHours === '' || Number(overtimeHours) <= 0 || !overtimeTypeId)) return true;
    if (action === BulkTimesheetAction.ApplyLeaveHours && (
      (paidLeaveHours === '' || Number(paidLeaveHours) <= 0) && (unpaidLeaveHours === '' || Number(unpaidLeaveHours) <= 0)
    )) return true;
    if (periodType === BulkTimesheetPeriodType.DayInterval && (!startDate || !endDate)) return true;
    return false;
  };

  return (
    <>
      <Collapse in={open}>
        <Box
          sx={{
            mb: 3,
            p: 3,
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'primary.main',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)',
            boxShadow: '0 8px 32px rgba(25, 118, 210, 0.1)',
            position: 'relative',
          }}
        >
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <Button
              size="small"
              startIcon={<CloseRounded />}
              onClick={onClose}
              sx={{ color: 'text.secondary' }}
            >
              Close
            </Button>
          </Box>

          <Typography variant="h6" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1, color: 'primary.main', fontWeight: 600 }}>
            <AutoAwesomeRounded /> Bulk Operations Center
          </Typography>

          {errorMsg && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} divider={<Divider orientation="vertical" flexItem />}>
            
            {/* Section 1: Time Period */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>1. Time Period</Typography>
              <ToggleButtonGroup
                value={periodType}
                exclusive
                onChange={(_, val) => val && setPeriodType(val)}
                size="small"
                fullWidth
                sx={{ mb: 2 }}
              >
                <ToggleButton value={BulkTimesheetPeriodType.Month}><EventRounded sx={{ mr: 1, fontSize: 18 }}/> Month</ToggleButton>
                <ToggleButton value={BulkTimesheetPeriodType.Day}><CalendarTodayRounded sx={{ mr: 1, fontSize: 18 }}/> Day</ToggleButton>
                <ToggleButton value={BulkTimesheetPeriodType.DayInterval}><DateRangeRounded sx={{ mr: 1, fontSize: 18 }}/> Interval</ToggleButton>
              </ToggleButtonGroup>

              {/* Month Mode */}
              {periodType === BulkTimesheetPeriodType.Month && (
                <TextField
                  label="Select Month"
                  type="month"
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={`${year}-${String(month).padStart(2, '0')}`}
                  onChange={(e) => {
                    if (e.target.value) {
                      const [y, m] = e.target.value.split('-');
                      setYear(Number(y));
                      setMonth(Number(m));
                    }
                  }}
                />
              )}

              {/* Day Mode */}
              {periodType === BulkTimesheetPeriodType.Day && (
                <TextField
                  label="Select Date"
                  type="date"
                  size="small"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`}
                  onChange={(e) => {
                    if (e.target.value) {
                      const parts = e.target.value.split('-');
                      if (parts.length === 3) {
                        setYear(Number(parts[0]));
                        setMonth(Number(parts[1]));
                        setDay(Number(parts[2]));
                      }
                    }
                  }}
                />
              )}

              {/* Interval Mode */}
              {periodType === BulkTimesheetPeriodType.DayInterval && (
                <Stack direction="row" spacing={2}>
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value) {
                        const parts = e.target.value.split('-');
                        if (parts.length >= 2) {
                          setYear(Number(parts[0]));
                          setMonth(Number(parts[1]));
                        }
                      }
                    }}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    fullWidth
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Stack>
              )}

            </Box>

            {/* Section 2: Target Scope */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>2. Target Scope</Typography>
              <RadioGroup
                value={scope}
                onChange={(e) => handleScopeChange(Number(e.target.value) as BulkTimesheetScope)}
              >
                <FormControlLabel value={BulkTimesheetScope.AllActive} control={<Radio size="small" />} label={`All Active Employees (${totalCount})`} />
                <FormControlLabel 
                  value={BulkTimesheetScope.Department} 
                  control={<Radio size="small" />} 
                  label="By Department"
                />
                <FormControlLabel 
                  value={BulkTimesheetScope.Selected} 
                  control={<Radio size="small" />} 
                  label={`Selected Rows (${selectedRowIds.size})`} 
                />
              </RadioGroup>

              {scope === BulkTimesheetScope.Department && (
                <Stack direction="row" spacing={1.5} sx={{ mt: 2, alignItems: 'center' }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Department</InputLabel>
                    <Select
                      label="Department"
                      value={departmentId}
                      onChange={(e) => setDepartmentId(e.target.value)}
                      MenuProps={{ disableScrollLock: true }}
                    >
                      {departments?.map((dep) => (
                        <MenuItem key={dep.id} value={dep.id}>{dep.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              )}
            </Box>

            {/* Section 3: Action */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: 'text.secondary' }}>3. Action</Typography>
              <RadioGroup
                value={action}
                onChange={(e) => setAction(Number(e.target.value) as BulkTimesheetAction)}
              >
                <FormControlLabel 
                  value={BulkTimesheetAction.GenerateTimesheet} 
                  control={<Radio size="small" />} 
                  label="Generate Timesheet" 
                  disabled={periodType !== BulkTimesheetPeriodType.Month}
                />
                <FormControlLabel 
                  value={BulkTimesheetAction.ApplyStatus} 
                  control={<Radio size="small" />} 
                  label="Apply Status" 
                  disabled={periodType === BulkTimesheetPeriodType.Month}
                />
                <FormControlLabel 
                  value={BulkTimesheetAction.ApplyOvertime} 
                  control={<Radio size="small" />} 
                  label="Add Overtime" 
                  disabled={periodType === BulkTimesheetPeriodType.Month}
                />
                <FormControlLabel 
                  value={BulkTimesheetAction.ApplyLeaveHours} 
                  control={<Radio size="small" />} 
                  label="Add Leave Hours" 
                  disabled={periodType === BulkTimesheetPeriodType.Month}
                />
                <FormControlLabel 
                  value={BulkTimesheetAction.Lock} 
                  control={<Radio size="small" />} 
                  label="Lock Timesheets" 
                  disabled={periodType !== BulkTimesheetPeriodType.Month}
                />
                <FormControlLabel 
                  value={BulkTimesheetAction.Unlock} 
                  control={<Radio size="small" />} 
                  label="Unlock Timesheets" 
                  disabled={periodType !== BulkTimesheetPeriodType.Month}
                />
              </RadioGroup>

              {action === BulkTimesheetAction.ApplyStatus && (
                <FormControl size="small" fullWidth sx={{ mt: 2 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(Number(e.target.value))}
                  >
                    <MenuItem value={1}>Worked</MenuItem>
                    <MenuItem value={3}>Paid Leave</MenuItem>
                    <MenuItem value={4}>Unpaid Leave</MenuItem>
                    <MenuItem value={5}>Absent</MenuItem>
                  </Select>
                </FormControl>
              )}
              
              {action === BulkTimesheetAction.ApplyStatus && status === 3 && (
                <Alert severity="warning" sx={{ mt: 2, py: 0, '& .MuiAlert-message': { py: 1 } }}>
                  Paid leave can only be applied to monthly salaried employees. Hourly employees will be skipped.
                </Alert>
              )}

              {action === BulkTimesheetAction.ApplyOvertime && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <FormControl size="small" fullWidth>
                    <InputLabel>Overtime Type</InputLabel>
                    <Select
                      label="Overtime Type"
                      value={overtimeTypeId}
                      onChange={(e) => setOvertimeTypeId(e.target.value)}
                    >
                      {overtimeTypes?.map((t) => (
                        <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Overtime Hours"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                    value={overtimeHours}
                    onChange={(e) => setOvertimeHours(e.target.value ? Number(e.target.value) : '')}
                  />
                </Stack>
              )}

              {action === BulkTimesheetAction.ApplyLeaveHours && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <TextField
                    label="Paid Leave (Hours)"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                    value={paidLeaveHours}
                    onChange={(e) => setPaidLeaveHours(e.target.value ? Number(e.target.value) : '')}
                  />
                  <TextField
                    label="Unpaid Leave (Hours)"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                    value={unpaidLeaveHours}
                    onChange={(e) => setUnpaidLeaveHours(e.target.value ? Number(e.target.value) : '')}
                  />
                </Stack>
              )}

              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowRounded />}
                  onClick={handleExecute}
                  disabled={isExecuteDisabled()}
                  sx={{ borderRadius: '10px', px: 4 }}
                >
                  {bulkMutation.isPending ? 'Executing...' : 'Execute'}
                </Button>
              </Box>
            </Box>

          </Stack>
        </Box>
      </Collapse>

      {/* Result Dialog */}
      <PopupDialog
        open={resultDialogOpen}
        onClose={() => setResultDialogOpen(false)}
        title="Bulk Operation Result"
        maxWidth="sm"
        hideCancel
        confirmText="Done"
        onConfirm={() => setResultDialogOpen(false)}
        content={
          <Box>
            <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
              <Box sx={{ p: 2, bgcolor: 'success.main', color: 'success.contrastText', borderRadius: 3, flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{resultData?.processed || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Processed Successfully</Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: (resultData?.skipped || 0) > 0 ? 'warning.main' : 'background.paper', color: (resultData?.skipped || 0) > 0 ? 'warning.contrastText' : 'text.secondary', border: (resultData?.skipped || 0) === 0 ? '1px solid' : 'none', borderColor: 'divider', borderRadius: 3, flex: 1, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700 }}>{resultData?.skipped || 0}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>Skipped</Typography>
              </Box>
            </Stack>

            {(resultData?.skipped || 0) > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: 'text.primary' }}>Skipped Reasons Details:</Typography>
                <Stack spacing={1.5}>
                  {Object.entries(resultData?.reasons || {}).map(([reason, employees]) => (
                    <Box key={reason} sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 2 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'warning.main', mb: 0.5 }}>
                        {reason} ({employees.length} employees)
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem' }}>
                        {employees.join(', ')}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}
          </Box>
        }
      />
      
      {/* Success Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%', borderRadius: 2 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};
