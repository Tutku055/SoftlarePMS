import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField
} from '@mui/material';
import {
  ArrowBackRounded,
  AutoFixHighRounded,
  SaveRounded,
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { useTimesheetDetail } from '../../hooks/useTimesheetDetail';
import { useGenerateTimesheet } from '../../hooks/useGenerateTimesheet';
import { useUpdateTimesheetEntry } from '../../hooks/useUpdateTimesheetEntry';
import { useEmployeeDetail } from '../../../employees/hooks/useEmployeeDetail';
import { useOvertimeTypes } from '../../hooks/useOvertimeTypes';
import type { TimesheetEntry } from '../../types';

// Status values match backend TimesheetStatus enum (1-based)
const STATUS_CONFIG: Record<number, { label: string, color: string, bgDark: string, bgLight: string }> = {
  1: { label: 'Worked',       color: '#388e3c', bgDark: 'rgba(56, 142, 60, 0.15)',   bgLight: 'rgba(56, 142, 60, 0.1)' },
  2: { label: 'Weekend',      color: '#f57c00', bgDark: 'rgba(245, 124, 0, 0.15)',  bgLight: 'rgba(245, 124, 0, 0.1)' },
  3: { label: 'Paid Leave',   color: '#1976d2', bgDark: 'rgba(25, 118, 210, 0.15)', bgLight: 'rgba(25, 118, 210, 0.1)' },
  4: { label: 'Unpaid Leave', color: '#7b1fa2', bgDark: 'rgba(123, 31, 162, 0.15)', bgLight: 'rgba(123, 31, 162, 0.1)' },
  5: { label: 'Absent',       color: '#d32f2f', bgDark: 'rgba(211, 47, 47, 0.15)',  bgLight: 'rgba(211, 47, 47, 0.1)' },
  6: { label: 'Holiday',      color: '#0288d1', bgDark: 'rgba(2, 136, 209, 0.15)',  bgLight: 'rgba(2, 136, 209, 0.1)' },
};

export const TimesheetDetailMatrix = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const { data: employee, isLoading: isLoadingEmp } = useEmployeeDetail(employeeId);
  const { data: timesheet, isLoading: isLoadingTs, isError: isErrorTs } = useTimesheetDetail(employeeId || '', year, month);
  const { data: overtimeTypes } = useOvertimeTypes();
  const { mutate: generateTimesheet, isPending: isGenerating } = useGenerateTimesheet();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateTimesheetEntry();

  const [editEntry, setEditEntry] = useState<TimesheetEntry | null>(null);
  const [editStatus, setEditStatus] = useState<number>(0);
  const [editOvertime, setEditOvertime] = useState<number>(0);
  const [editOvertimeTypeId, setEditOvertimeTypeId] = useState<string>('');

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  
  const matrixDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleGenerate = () => {
    if (!employeeId) return;
    generateTimesheet({ employeeId, year, month });
  };

  const handleOpenEdit = (entry: TimesheetEntry) => {
    setEditEntry(entry);
    setEditStatus(entry.status);
    setEditOvertime(entry.overtimeHours);
    setEditOvertimeTypeId(entry.overtimeTypeId || '');
  };

  const handleSaveEdit = () => {
    if (!employeeId || !editEntry) return;
    updateEntry({
      employeeId,
      entryId: editEntry.id,
      command: {
        entryId: editEntry.id,
        status: editStatus,
        overtimeHours: editOvertime,
        overtimeTypeId: editOvertimeTypeId || undefined
      }
    }, {
      onSuccess: () => {
        setEditEntry(null);
      }
    });
  };

  const glassPanelSx = {
    background: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
    backdropFilter: 'blur(12px)',
    border: '1px solid',
    borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderRadius: 2,
    p: 3,
    boxShadow: (theme: any) => theme.palette.mode === 'dark'
      ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
      : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  };

  if (isLoadingEmp) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: '100%', margin: '0 auto', overflowX: 'hidden' }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Back to Timesheets">
            <IconButton onClick={() => navigate('/finance/timesheets')} sx={{ bgcolor: 'action.hover' }}>
              <ArrowBackRounded />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'text.primary',
                textShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Timesheet Matrix
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {employee?.firstName} {employee?.lastName} - {employee?.employeeNo}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <Select value={year} onChange={(e: any) => setYear(Number(e.target.value))}>
              {[currentYear - 1, currentYear, currentYear + 1].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select value={month} onChange={(e: any) => setMonth(Number(e.target.value))}>
              {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                <MenuItem key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Box>

      {/* MATRIX CONTAINER */}
      <Box sx={{ ...glassPanelSx, p: 0, overflow: 'hidden' }}>
        {isLoadingTs ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (!timesheet || isErrorTs) ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>No timesheet generated for this month.</Typography>
            <Button
              variant="contained"
              startIcon={<AutoFixHighRounded />}
              onClick={handleGenerate}
              disabled={isGenerating}
              sx={{ borderRadius: 1, textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              {isGenerating ? 'Generating...' : 'Generate Timesheet'}
            </Button>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            {/* Legend */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <Stack direction="row" sx={{ alignItems: 'center' }} spacing={1} key={key}>
                  <Box sx={{ width: 12, height: 12, backgroundColor: config.color, border: '1px solid', borderColor: 'divider' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600 }}>{config.label}</Typography>
                </Stack>
              ))}
            </Box>

            {/* Matrix Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr>
                  <th style={{ width: 200, padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid var(--mui-palette-divider)', borderRight: '2px solid var(--mui-palette-divider)', backgroundColor: 'var(--mui-palette-action-hover)' }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Employee</Typography>
                  </th>
                  {matrixDays.map(day => {
                    const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;
                    return (
                      <th key={day} style={{ width: 45, padding: '8px 0', textAlign: 'center', borderBottom: '1px solid var(--mui-palette-divider)', borderRight: '1px solid var(--mui-palette-divider)', backgroundColor: isWeekend ? 'var(--mui-palette-action-hover)' : 'transparent' }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: isWeekend ? 'error.main' : 'text.primary' }}>{day}</Typography>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--mui-palette-divider)', borderRight: '2px solid var(--mui-palette-divider)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{employee?.firstName} {employee?.lastName}</Typography>
                    <Typography variant="caption" color="text.secondary">{employee?.profession}</Typography>
                  </td>
                  {matrixDays.map(day => {
                    const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const entry = timesheet.entries.find(e => e.date.startsWith(dayStr));
                    
                    if (!entry) {
                      return <td key={day} style={{ borderBottom: '1px solid var(--mui-palette-divider)', borderRight: '1px solid var(--mui-palette-divider)' }}></td>;
                    }

                    const config = STATUS_CONFIG[entry.status];
                    
                    return (
                      <td 
                        key={day} 
                        style={{ 
                          borderBottom: '1px solid var(--mui-palette-divider)', 
                          borderRight: '1px solid var(--mui-palette-divider)',
                          padding: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => handleOpenEdit(entry)}
                      >
                        <Tooltip title={`${config.label} ${entry.overtimeHours > 0 ? `(+${entry.overtimeHours}h OT)` : ''}`} arrow placement="top">
                          <Box 
                            sx={{ 
                              width: '100%', 
                              height: 36, 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: (theme) => theme.palette.mode === 'dark' ? config.bgDark : config.bgLight,
                              border: '1px solid',
                              borderColor: config.color,
                              color: config.color,
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                filter: 'brightness(0.9)',
                              }
                            }}
                          >
                            {entry.status === 1 ? 'W' : entry.status === 2 ? 'WE' : entry.status === 3 ? 'PL' : entry.status === 4 ? 'UL' : entry.status === 5 ? 'A' : 'H'}
                            {entry.overtimeHours > 0 && <span style={{ fontSize: '10px', marginLeft: '2px' }}>+{entry.overtimeHours}</span>}
                          </Box>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
            
            <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', gap: 4, bgcolor: 'action.hover' }}>
              <Typography variant="body2"><strong>Worked Days:</strong> {timesheet.totalWorkedDays}</Typography>
              <Typography variant="body2"><strong>Absent Days:</strong> {timesheet.totalAbsentDays}</Typography>
              <Typography variant="body2"><strong>Overtime:</strong> {timesheet.totalOvertimeHours} hrs</Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* EDIT MODAL */}
      <Dialog open={!!editEntry} onClose={() => setEditEntry(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
          Edit Daily Entry
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Date: <strong>{editEntry?.date ? new Date(editEntry.date).toLocaleDateString() : ''}</strong>
            </Typography>
            
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select value={editStatus} label="Status" onChange={(e) => setEditStatus(Number(e.target.value))}>
                {Object.entries(STATUS_CONFIG).map(([val, config]) => (
                  <MenuItem key={val} value={Number(val)}>{config.label}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              label="Overtime (Hours)" 
              type="number" 
              size="small" 
              fullWidth 
              value={editOvertime}
              onChange={(e) => setEditOvertime(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              disabled={editStatus !== 1 && editStatus !== 2 && editStatus !== 6} // overtime only for Worked, Weekend, or Holiday
            />

            {editOvertime > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Overtime Type</InputLabel>
                <Select
                  value={editOvertimeTypeId}
                  label="Overtime Type"
                  onChange={(e) => setEditOvertimeTypeId(e.target.value)}
                >
                  <MenuItem value=""><em>None</em></MenuItem>
                  {overtimeTypes?.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.name} (x{type.multiplier})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEditEntry(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleSaveEdit} 
            disabled={isUpdating}
            startIcon={<SaveRounded />}
            sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
          >
            {isUpdating ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
