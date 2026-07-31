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
  TextField,
  Alert
} from '@mui/material';
import {
  ArrowBackRounded,
  AutoFixHighRounded,
  SaveRounded,
  PrintRounded,
  PictureAsPdfRounded,
  WarningRounded,
  LockRounded,
  LockOpenRounded
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useTimesheetDetail } from '../../hooks/useTimesheetDetail';
import { useGenerateTimesheet } from '../../hooks/useGenerateTimesheet';
import { useUpdateTimesheetEntry } from '../../hooks/useUpdateTimesheetEntry';
import { useEmployeeDetail } from '../../../employees/hooks/useEmployeeDetail';
import { useOvertimeTypes } from '../../hooks/useOvertimeTypes';
import { useYearClosureStatus } from '../../hooks/useYearClosureStatus';
import { useToggleTimesheetLock } from '../../hooks/useToggleTimesheetLock';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import type { TimesheetEntry } from '../../types';
import { useAuthStore } from '../../../../store/useAuthStore';

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
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [year, setYear] = useState(currentYear);
  const [month, setMonth] = useState(currentMonth);

  const { data: employee, isLoading: isLoadingEmp } = useEmployeeDetail(employeeId);
  const { data: timesheet, isLoading: isLoadingTs, isError: isErrorTs } = useTimesheetDetail(employeeId || '', year, month);
  const { data: closureStatus } = useYearClosureStatus(year);
  const { data: overtimeTypes } = useOvertimeTypes();
  const { mutate: generateTimesheet, isPending: isGenerating } = useGenerateTimesheet();
  const { mutate: updateEntry, isPending: isUpdating } = useUpdateTimesheetEntry();
  const { mutate: toggleLock, isPending: isTogglingLock } = useToggleTimesheetLock();

  const isPreviousYearPendingClosure = timesheet?.isPreviousYearPendingClosure || closureStatus?.isPending || false;
  const isLocked = timesheet?.isLocked || false;
  
  const hasHourlyEntries = useMemo(() => {
    return timesheet?.entries.some(e => e.salaryType === 1) ?? false;
  }, [timesheet?.entries]);

  const [editEntry, setEditEntry] = useState<TimesheetEntry | null>(null);
  const [errorDialog, setErrorDialog] = useState<{ open: boolean; message: string }>({ open: false, message: '' });
  const [editStatus, setEditStatus] = useState<number>(0);
  const [editOvertime, setEditOvertime] = useState<number>(0);
  const [editOvertimeTypeId, setEditOvertimeTypeId] = useState<string>('');
  const [editWorkedHours, setEditWorkedHours] = useState<number>(8);
  const [editPaidLeaveHours, setEditPaidLeaveHours] = useState<number>(0);
  const [editUnpaidLeaveHours, setEditUnpaidLeaveHours] = useState<number>(0);

  const daysInMonth = useMemo(() => new Date(year, month, 0).getDate(), [year, month]);
  
  const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  
  const firstDay = new Date(year, month - 1, 1).getDay();
  const startPadding = firstDay === 0 ? 6 : firstDay - 1;

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < startPadding; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  
  const totalCells = calendarCells.length;
  const remainder = totalCells % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) calendarCells.push(null);
  }

  const handleGenerate = () => {
    if (!employeeId) return;
    generateTimesheet({ employeeId, year, month });
  };

  const generatePdfDoc = () => {
    if (!employee || !timesheet) return null;
    const doc = new jsPDF('l'); // landscape
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("MONTHLY TIMESHEET", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee: ${employee.firstName} ${employee.lastName} (${employee.professionName || '-'})`, 14, 25);
    doc.text(`Period: ${new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 31);

    // Build Table Data
    const headRow = ["Employee"];
    for (let d = 1; d <= daysInMonth; d++) {
      headRow.push(d.toString());
    }

    const bodyRow = [`${employee.firstName} ${employee.lastName}`];
    for (let d = 1; d <= daysInMonth; d++) {
      const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const entry = timesheet.entries.find((e: any) => e.date.startsWith(dayStr));
      if (!entry) {
        bodyRow.push("-");
      } else {
        let txt = "";
        if (entry.status === 1) txt = "W";
        else if (entry.status === 2) txt = "WE";
        else if (entry.status === 3) txt = "PL";
        else if (entry.status === 4) txt = "UL";
        else if (entry.status === 5) txt = "A";
        else if (entry.status === 6) txt = "H";
        
        if (entry.overtimeHours > 0) {
          txt += `\n+${entry.overtimeHours}`;
        }
        bodyRow.push(txt);
      }
    }

    autoTable(doc, {
      startY: 40,
      head: [headRow],
      body: [bodyRow],
      theme: 'grid',
      styles: { fontSize: 7, halign: 'center', cellPadding: 1, minCellHeight: 15, valign: 'middle' },
      columnStyles: { 0: { halign: 'left', minCellWidth: 30 } },
      didParseCell: function(data: any) {
        if (data.section === 'head' && data.column.index > 0) {
          const d = data.column.index;
          const isWeekend = new Date(year, month - 1, d).getDay() === 0 || new Date(year, month - 1, d).getDay() === 6;
          if (isWeekend) {
            data.cell.styles.textColor = [211, 47, 47];
          }
        }
        if (data.section === 'body' && data.column.index > 0) {
          const txt = data.cell.raw;
          if (txt === '-') return;
          if (txt.includes('W\n') || txt === 'W') data.cell.styles.fillColor = [232, 245, 233]; // Worked
          else if (txt.includes('WE')) data.cell.styles.fillColor = [255, 243, 224]; // Weekend
          else if (txt.includes('PL')) data.cell.styles.fillColor = [227, 242, 253]; // Paid Leave
          else if (txt.includes('UL')) data.cell.styles.fillColor = [243, 229, 245]; // Unpaid Leave
          else if (txt.includes('A'))  data.cell.styles.fillColor = [255, 235, 238]; // Absent
          else if (txt.includes('H'))  data.cell.styles.fillColor = [225, 245, 254]; // Holiday
        }
      }
    });

    // Legend
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text("Legend: W = Worked, WE = Weekend, PL = Paid Leave, UL = Unpaid Leave, A = Absent, H = Holiday. +X = Overtime Hours", 14, finalY);

    return doc;
  };

  const handlePrint = () => {
    const doc = generatePdfDoc();
    if (doc) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    }
  };

  const handleDownloadPdf = () => {
    const doc = generatePdfDoc();
    if (doc) {
      doc.save(`Timesheet_${employee?.firstName}_${employee?.lastName}_${year}_${month}.pdf`);
    }
  };

  const handleOpenEdit = (entry: TimesheetEntry) => {
    setEditEntry(entry);
    setEditStatus(entry.status);
    setEditOvertime(entry.overtimeHours);
    setEditOvertimeTypeId(entry.overtimeTypeId || '');
    setEditWorkedHours(entry.workedHours);
    setEditPaidLeaveHours(entry.paidLeaveHours);
    setEditUnpaidLeaveHours(entry.unpaidLeaveHours);
  };

  const handleSaveEdit = () => {
    if (!employeeId || !editEntry || !employee) return;

    if (editStatus === 3 && editEntry.status !== 3) {
      const balance = (employee.annualVacationDays || 0) + (employee.carriedOverLeaves || 0) - (employee.usedLeaveDaysThisYear || 0);
      if (balance <= 0) {
        setErrorDialog({ open: true, message: 'You do not have enough vacation balance left to take a Paid Leave.' });
        return;
      }
    }

    if (editOvertime > 0 && !editOvertimeTypeId) {
      setErrorDialog({ open: true, message: 'An Overtime Type must be selected if Overtime Hours are greater than 0.' });
      return;
    }

    updateEntry({
      employeeId,
      entryId: editEntry.id,
      command: {
        entryId: editEntry.id,
        status: editStatus,
        overtimeHours: editOvertime,
        overtimeTypeId: editOvertime > 0 ? (editOvertimeTypeId || undefined) : undefined,
        workedHours: editWorkedHours,
        paidLeaveHours: editPaidLeaveHours,
        unpaidLeaveHours: editUnpaidLeaveHours
      }
    }, {
      onSuccess: () => {
        setEditEntry(null);
      },
      onError: (error: any) => {
        let msg = 'An error occurred while updating the entry.';
        if (error?.response?.data?.errors) {
            const errs = error.response.data.errors;
            if (typeof errs.message === 'string') msg = errs.message;
            else {
                const firstKey = Object.keys(errs)[0];
                if (firstKey) {
                    if (Array.isArray(errs[firstKey]) && errs[firstKey].length > 0) msg = errs[firstKey][0];
                    else if (typeof errs[firstKey] === 'string') msg = errs[firstKey];
                }
            }
        }
        else if (error?.response?.data?.message) msg = error.response.data.message;
        else if (error?.response?.data?.detail) msg = error.response.data.detail;
        else if (error?.response?.data?.title) msg = error.response.data.title;
        else if (typeof error?.response?.data === 'string') msg = error.response.data;
        else if (error?.message) msg = error.message;
        
        setErrorDialog({ open: true, message: msg });
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
          {timesheet && hasPermission('Timesheets.Lock') && (
            <Tooltip title={isLocked ? "Unlock Timesheet" : "Lock Timesheet"}>
              <IconButton 
                onClick={() => employeeId && toggleLock({ employeeId, year, month, lock: !isLocked })}
                disabled={isTogglingLock}
                sx={{ 
                  color: isLocked ? 'error.main' : 'success.main', 
                  bgcolor: isLocked ? 'error.50' : 'success.50' 
                }}
              >
                {isLocked ? <LockRounded /> : <LockOpenRounded />}
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Print">
            <IconButton onClick={handlePrint} sx={{ color: 'primary.main', bgcolor: 'primary.50' }}>
              <PrintRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download PDF">
            <IconButton onClick={handleDownloadPdf} sx={{ color: 'error.main', bgcolor: 'error.50' }}>
              <PictureAsPdfRounded />
            </IconButton>
          </Tooltip>
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

      {/* WARNING BANNER */}
      {isPreviousYearPendingClosure && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Year-End Period Closing Required:</strong> You cannot view, create, or update timesheets for {year} until {year - 1} has been officially closed.
        </Alert>
      )}
      {!isPreviousYearPendingClosure && isLocked && (
        <Alert severity="info" icon={<LockRounded />} sx={{ mb: 3, borderRadius: 2 }}>
          <strong>Timesheet Locked:</strong> This timesheet is locked for the selected period. Entries cannot be modified.
        </Alert>
      )}

      {/* LEAVE COUNTERS */}
      {employee && !hasHourlyEntries && (
        <Box sx={{ ...glassPanelSx, mb: 3, p: 2, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'space-between', bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.05)' : 'rgba(25, 118, 210, 0.02)' }}>
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Annual Leave Right</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>{employee.annualVacationDays || 0} Days</Typography>
          </Box>
          <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Carried Over</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'info.main' }}>+{employee.carriedOverLeaves || 0} Days</Typography>
          </Box>
          <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Total Right</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.main' }}>{(employee.annualVacationDays || 0) + (employee.carriedOverLeaves || 0)} Days</Typography>
          </Box>
          <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Used This Year</Typography>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'error.main' }}>-{employee.usedLeaveDaysThisYear || 0} Days</Typography>
          </Box>
          <Box sx={{ borderLeft: '1px solid', borderColor: 'divider', pl: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Remaining</Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, color: 'primary.main' }}>{((employee.annualVacationDays || 0) + (employee.carriedOverLeaves || 0)) - (employee.usedLeaveDaysThisYear || 0)} Days</Typography>
          </Box>
        </Box>
      )}

      {/* MATRIX CONTAINER */}
      <Box sx={{ ...glassPanelSx, p: 0, overflow: 'hidden' }}>
        {isLoadingTs ? (
          <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
        ) : (!timesheet || isErrorTs) ? (
          <Box sx={{ p: 6, textAlign: 'center' }}>
            {!isPreviousYearPendingClosure ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <PictureAsPdfRounded sx={{ fontSize: 64, color: 'text.secondary', mb: 2, opacity: 0.2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No Timesheet for this period</Typography>
                
                {(() => {
                  const periodDate = new Date(year, month - 1, 1);
                  const hireDate = employee?.hireDate ? new Date(employee.hireDate) : null;
                  const hireMonth = hireDate ? new Date(hireDate.getFullYear(), hireDate.getMonth(), 1) : null;
                  const isBeforeHireMonth = hireMonth && periodDate < hireMonth;
                  
                  if (isBeforeHireMonth) {
                    return (
                      <Typography variant="body2" color="error.main" sx={{ mt: 2, fontWeight: 600 }}>
                        Cannot generate timesheets for months prior to the employee's hire date.
                      </Typography>
                    );
                  }
                  
                  return hasPermission('Timesheets.Manage') && (
                    <Button
                      variant="contained"
                      startIcon={<AutoFixHighRounded />}
                      onClick={handleGenerate}
                      disabled={isGenerating || isPreviousYearPendingClosure}
                      sx={{
                        mt: 2,
                        px: 4,
                        py: 1.5,
                        borderRadius: 2,
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none'
                      }}
                    >
                      {isGenerating ? 'Generating...' : 'Generate Timesheet'}
                    </Button>
                  );
                })()}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary">Cannot generate timesheet.</Typography>
                <Typography variant="body2" color="text.secondary">Please close the previous year first.</Typography>
              </Box>
            )}
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

            {/* Calendar UI */}
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1, p: 2, minWidth: 700 }}>
              {WEEK_DAYS.map(day => (
                <Box key={day} sx={{ p: 1, textAlign: 'center', fontWeight: 800, borderBottom: '2px solid', borderColor: 'divider', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.85rem' }}>
                  {day}
                </Box>
              ))}
              
              {calendarCells.map((day, idx) => {
                if (!day) return <Box key={`empty-${idx}`} sx={{ p: 1, bgcolor: 'transparent', minHeight: 100 }} />;
                
                const isWeekend = new Date(year, month - 1, day).getDay() === 0 || new Date(year, month - 1, day).getDay() === 6;
                const currentDate = new Date(year, month - 1, day);
                const hireDate = employee?.hireDate ? new Date(employee.hireDate) : null;
                if (hireDate) {
                  hireDate.setHours(0, 0, 0, 0); // Normalize hire date time
                }
                const isBeforeHireDate = hireDate && currentDate < hireDate;

                const dayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const entry = timesheet.entries.find((e: any) => e.date.startsWith(dayStr));
                
                if (!entry || isBeforeHireDate) {
                  return (
                    <Tooltip title={isBeforeHireDate ? "Before Hire Date" : ""} placement="top" key={`day-${day}`}>
                      <Box 
                        sx={{ 
                          p: 1, 
                          border: '1px solid', 
                          borderColor: 'divider', 
                          borderRadius: 2, 
                          minHeight: 100, 
                          position: 'relative', 
                          bgcolor: isBeforeHireDate ? 'action.disabledBackground' : (isWeekend ? 'rgba(0,0,0,0.02)' : 'transparent'),
                          cursor: isBeforeHireDate ? 'not-allowed' : 'default',
                          opacity: isBeforeHireDate ? 0.6 : 1
                        }}
                      >
                        <Typography variant="caption" sx={{ position: 'absolute', top: 6, left: 8, fontWeight: 700, color: isWeekend ? 'error.main' : 'text.secondary', fontSize: '0.85rem' }}>
                          {day}
                        </Typography>
                      </Box>
                    </Tooltip>
                  );
                }

                const config = STATUS_CONFIG[entry.status];
                const otTypeName = entry.overtimeTypeId && overtimeTypes ? overtimeTypes.find(t => t.id === entry.overtimeTypeId)?.name : null;
                const tooltipText = `${config.label} ${entry.overtimeHours > 0 ? `(+${entry.overtimeHours}h OT${otTypeName ? ` - ${otTypeName}` : ''})` : ''}`;
                
                return (
                  <Tooltip title={tooltipText} arrow placement="top" key={`day-${day}`}>
                    <Box
                      onClick={() => {
                        if (!isPreviousYearPendingClosure && !isLocked) {
                          handleOpenEdit(entry);
                        }
                      }}
                      sx={{
                        p: 1.5,
                        border: '1px solid',
                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)',
                        borderRadius: 1,
                        minHeight: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 0.5,
                        position: 'relative',
                        bgcolor: config.bgLight,
                        cursor: (isPreviousYearPendingClosure || isLocked) ? 'not-allowed' : 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': (isPreviousYearPendingClosure || isLocked) ? {} : {
                          bgcolor: config.bgDark,
                          transform: 'translateY(-2px)',
                          boxShadow: (theme) => theme.palette.mode === 'dark' 
                            ? '0 4px 12px rgba(0,0,0,0.5)' 
                            : '0 4px 12px rgba(0,0,0,0.05)',
                          borderColor: config.color
                        }
                      }}
                    >
                      <Typography variant="caption" sx={{ position: 'absolute', top: 6, left: 8, fontWeight: 700, color: isWeekend ? 'error.main' : 'text.primary', fontSize: '0.85rem' }}>
                        {day}
                      </Typography>
                      <Box sx={{ mt: 3.5, display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'center' }}>
                        <Box sx={{ px: 1, py: 0.5, borderRadius: 1.5, width: '90%', textAlign: 'center', bgcolor: (theme) => theme.palette.mode === 'dark' ? config.bgDark : config.bgLight, border: '1px solid', borderColor: config.color, color: config.color, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                           <Typography variant="caption" sx={{ fontWeight: 800 }}>{config.label}</Typography>
                        </Box>
                        {entry.overtimeHours > 0 && (
                           <Typography variant="caption" sx={{ fontWeight: 700, color: '#f57c00', fontSize: '0.75rem' }}>
                             +{entry.overtimeHours}h OT
                           </Typography>
                        )}
                      </Box>
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            
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
              <Select value={editStatus} label="Status" onChange={(e) => {
                const val = Number(e.target.value);
                setEditStatus(val);
                if ([3, 4, 5, 6].includes(val)) {
                  setEditPaidLeaveHours(0);
                  setEditUnpaidLeaveHours(0);
                  setEditOvertime(0);
                  setEditOvertimeTypeId('');
                }
              }}>
                {Object.entries(STATUS_CONFIG).map(([val, config]) => {
                  const numVal = Number(val);
                  // Hide Paid Leave if ANY Hourly entry exists in the month
                  if (numVal === 3 && hasHourlyEntries) return null;
                  
                  return (
                    <MenuItem key={val} value={numVal}>{config.label}</MenuItem>
                  );
                })}
              </Select>
            </FormControl>

            <TextField 
              label="Overtime (Hours)" 
              type="number" 
              size="small" 
              fullWidth 
              value={editOvertime}
              onChange={(e) => {
                const val = Number(e.target.value);
                setEditOvertime(val);
                if (val > 0 && !editOvertimeTypeId && overtimeTypes && overtimeTypes.length > 0) {
                  setEditOvertimeTypeId(overtimeTypes[0].id);
                }
              }}
              slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
              disabled={(editStatus !== 1 && editStatus !== 2 && editStatus !== 6) || (overtimeTypes && overtimeTypes.length === 0)}
            />

            {editEntry?.salaryType === 1 && (
              <TextField 
                label="Worked Hours (Hourly Wage)" 
                type="number" 
                size="small" 
                fullWidth 
                value={editWorkedHours}
                onChange={(e) => setEditWorkedHours(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                disabled={editStatus !== 1 && editStatus !== 3 && editStatus !== 6}
              />
            )}
            
            {editEntry?.salaryType === 2 && (
              <Stack direction="row" spacing={2}>
                <TextField 
                  label="Paid Leave (Hrs)" 
                  type="number" 
                  size="small" 
                  fullWidth 
                  value={editPaidLeaveHours}
                  onChange={(e) => setEditPaidLeaveHours(Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                  disabled={[3, 4, 5, 6].includes(editStatus)}
                />
                <TextField 
                  label="Unpaid Leave (Hrs)" 
                  type="number" 
                  size="small" 
                  fullWidth 
                  value={editUnpaidLeaveHours}
                  onChange={(e) => setEditUnpaidLeaveHours(Number(e.target.value))}
                  slotProps={{ htmlInput: { min: 0, step: 0.5 } }}
                  disabled={[3, 4, 5, 6].includes(editStatus)}
                />
              </Stack>
            )}

            {overtimeTypes && overtimeTypes.length === 0 && (
              <Typography variant="caption" color="error" sx={{ fontWeight: 600 }}>
                There is no overtime type defined. You cannot enter overtime.
              </Typography>
            )}

            {editOvertime > 0 && overtimeTypes && overtimeTypes.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Overtime Type</InputLabel>
                <Select
                  value={editOvertimeTypeId}
                  label="Overtime Type"
                  onChange={(e) => setEditOvertimeTypeId(e.target.value)}
                >
                  {overtimeTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>{type.name} (x{type.multiplier})</MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEditEntry(null)} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
          {hasPermission('Timesheets.Manage') && (
            <Button 
              variant="contained" 
              onClick={handleSaveEdit} 
              disabled={isUpdating}
              startIcon={<SaveRounded />}
              sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              {isUpdating ? 'Saving...' : 'Save Entry'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <PopupDialog
        open={errorDialog.open}
        title="Action Denied"
        content={errorDialog.message}
        confirmText="Close"
        confirmColor="error"
        onConfirm={() => setErrorDialog({ open: false, message: '' })}
        hideCancel
        icon={<WarningRounded color="error" />}
        onClose={() => setErrorDialog({ open: false, message: '' })}
      />
    </Box>
  );
};
