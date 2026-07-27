import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeDetail } from '../../../employees/hooks/useEmployeeDetail';
import { usePayrollList } from '../../hooks/usePayrollList';
import { useCalculatePayroll } from '../../hooks/useCalculatePayroll';
import { useUpdateCompensation } from '../../hooks/useUpdateCompensation';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';

import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Tabs,
  Tab,
  TextField
} from '@mui/material';
import {
  ArrowBackRounded,
  CalculateRounded,
  PictureAsPdfRounded,
  SettingsRounded,
  ReceiptLongRounded,
  SaveRounded
} from '@mui/icons-material';
import * as z from 'zod';
import styles from './PayrollDetail.module.css';

const glassPanelSx = {
  background: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid',
  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  borderRadius: '16px',
  p: 3,
  boxShadow: (theme: any) => theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  transition: 'box-shadow 0.3s ease',
};

const premiumInputSx = {
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(18, 18, 18, 0.6)' : 'background.paper',
    borderRadius: '10px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    '&:hover': {
      boxShadow: (theme: any) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(128, 128, 128, 0.1)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'rgba(128, 128, 128, 0.2) !important',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: 'primary.main !important',
    borderWidth: '1px !important',
  }
};



interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
};

const calculateSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  month: z.number().int().min(1).max(12)
});

const SALARY_TYPE_MAP: Record<number, string> = {
  1: 'Hourly',
  2: 'Monthly'
};

const CURRENCY_MAP: Record<number, string> = {
  1: 'TRY',
  2: 'USD',
  3: 'EUR',
  4: 'GBP'
};

const compensationSchema = z.object({
  baseSalary: z.number().positive("Base Salary must be greater than 0"),
  currency: z.number().int().min(1).max(4),
  salaryType: z.number().int().min(1).max(2),
  effectiveDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" })
});

export const PayrollDetail = () => {
  const { employeeId } = useParams<{ employeeId: string }>();
  const navigate = useNavigate();

  const { data: employee, isLoading: isEmployeeLoading, isError } = useEmployeeDetail(employeeId);
  const { data: payrolls, isLoading: isLoadingPayrolls } = usePayrollList(employeeId || '');
  const { mutate: calculatePayroll, isPending: isCalculating } = useCalculatePayroll();
  const { mutate: updateCompensation, isPending: isUpdatingCompensation } = useUpdateCompensation();

  const compensation = employee?.compensation || null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [calcYear, setCalcYear] = useState(currentYear);
  const [calcMonth, setCalcMonth] = useState(currentMonth);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Compensation Form State
  const [baseSalary, setBaseSalary] = useState(0);
  const [currency, setCurrency] = useState(1);
  const [salaryType, setSalaryType] = useState(2);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [compErrors, setCompErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (compensation) {
      setBaseSalary(compensation.baseSalary || 0);
      setCurrency(compensation.currency || 1);
      setSalaryType(compensation.salaryType || 2);
      if (compensation.effectiveDate) {
        setEffectiveDate(compensation.effectiveDate.split('T')[0]);
      }
    }
  }, [compensation]);

  const handleCalculateConfirm = () => {
    if (!employeeId) return;
    const validation = calculateSchema.safeParse({ year: calcYear, month: calcMonth });
    if (!validation.success) {
      setCalcError("Invalid year or month selection.");
      return;
    }
    setCalcError(null);
    calculatePayroll({ employeeId, year: calcYear, month: calcMonth }, {
      onSuccess: () => setConfirmOpen(false)
    });
  };

  const handleSaveCompensation = () => {
    if (!employeeId) return;

    const data = {
      baseSalary: Number(baseSalary),
      currency,
      salaryType,
      effectiveDate
    };

    const validation = compensationSchema.safeParse(data);
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setCompErrors(fieldErrors);
      return;
    }

    setCompErrors({});
    updateCompensation({
      employeeId,
      command: {
        baseSalary: validation.data.baseSalary,
        currency: validation.data.currency,
        salaryType: validation.data.salaryType,
        effectiveDate: new Date(validation.data.effectiveDate).toISOString()
      }
    });
  };

  if (isEmployeeLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><CircularProgress /></Box>;
  }

  if (isError || !employee) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" color="error">Failed to load employee details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/finance/payrolls')}>Go Back</Button>
      </Box>
    );
  }

  return (
    <Box className={styles.pageContainer}>
      
      {/* ── TOP ACTION BAR ────────────────────────────────────────────────── */}
      <Box className={styles.headerContainer}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Back to Payrolls">
            <IconButton onClick={() => navigate('/finance/payrolls')} sx={{ bgcolor: 'action.hover' }}>
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
              Payroll Details
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {employee.id}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          <Button 
            variant="contained" 
            onClick={handleSaveCompensation} 
            disabled={isUpdatingCompensation}
            startIcon={<SaveRounded />} 
            sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
          >
            {isUpdatingCompensation ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {/* ── PROFILE SUMMARY CARD ────────────────────────────────────────── */}
      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 600 }}>
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{employee.firstName} {employee.lastName}</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {employee.profession} • {employee.employeeNo} {employee.department ? `• ${employee.department.name}` : ''}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Base Salary:</strong> {compensation 
                  ? `${compensation.baseSalary} ${CURRENCY_MAP[compensation.currency] || ''}` 
                  : 'Not Set'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Salary Type:</strong> {compensation 
                  ? SALARY_TYPE_MAP[compensation.salaryType] || 'N/A'
                  : 'N/A'}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ── NAVIGATION TABS ───────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, newValue) => setActiveTab(newValue)}
          sx={{ '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' } }}
        >
          <Tab icon={<ReceiptLongRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Payroll Generation & Slips" />
          <Tab icon={<SettingsRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Compensation Settings" />
        </Tabs>
      </Box>

      {/* ── TAB 1: PAYROLL MANAGEMENT ─────────────────────────────────────── */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Calculate Payroll
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 4, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Year</InputLabel>
              <Select value={calcYear} label="Year" onChange={(e: any) => setCalcYear(Number(e.target.value))}>
                {[currentYear - 1, currentYear, currentYear + 1].map(y => <MenuItem key={y} value={y}>{y}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Month</InputLabel>
              <Select value={calcMonth} label="Month" onChange={(e: any) => setCalcMonth(Number(e.target.value))}>
                {Array.from({length: 12}, (_, i) => i + 1).map(m => (
                  <MenuItem key={m} value={m}>{new Date(2000, m - 1).toLocaleString('default', { month: 'long' })}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button 
              variant="contained" 
              color="secondary"
              startIcon={<CalculateRounded />}
              onClick={() => { setCalcError(null); setConfirmOpen(true); }}
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, boxShadow: 'none' }}
            >
              Calculate Payroll
            </Button>
            {calcError && <Typography variant="caption" color="error">{calcError}</Typography>}
          </Box>

          <Typography variant="h6" className={styles.sectionTitle}>
            Generated Payroll Slips
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          {isLoadingPayrolls ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          ) : !payrolls?.length ? (
            <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">No payroll slips found for this employee.</Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {payrolls.map(slip => (
                <Box key={slip.id} sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {new Date(slip.year, slip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Issued: {new Date(slip.issueDate).toLocaleDateString()}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right', mr: 4 }}>
                    <Typography variant="caption" color="text.secondary">Net Salary</Typography>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY_MAP[compensation?.currency || 1] || 'TRY' }).format(slip.netSalary)}
                    </Typography>
                  </Box>
                  <Button variant="outlined" startIcon={<PictureAsPdfRounded />} size="small" sx={{ textTransform: 'none', borderRadius: 2 }}>
                    View Slip
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ ...glassPanelSx, maxWidth: 600 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" className={styles.sectionTitle}>
              Update Compensation Settings
            </Typography>
          </Box>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField
              label="Base Salary"
              type="number"
              size="small"
              fullWidth
              value={baseSalary}
              onChange={(e) => setBaseSalary(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
              error={!!compErrors.baseSalary}
              helperText={compErrors.baseSalary}
              sx={premiumInputSx}
            />

            <FormControl fullWidth size="small" error={!!compErrors.salaryType} sx={premiumInputSx}>
              <InputLabel>Salary Type</InputLabel>
              <Select value={salaryType} label="Salary Type" onChange={(e: any) => setSalaryType(Number(e.target.value))}>
                <MenuItem value={2}>Monthly (per 30 days)</MenuItem>
                <MenuItem value={1}>Hourly (per hour)</MenuItem>
              </Select>
              {compErrors.salaryType && <FormHelperText>{compErrors.salaryType}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth size="small" error={!!compErrors.currency} sx={premiumInputSx}>
              <InputLabel>Currency</InputLabel>
              <Select value={currency} label="Currency" onChange={(e: any) => setCurrency(Number(e.target.value))}>
                <MenuItem value={1}>TRY - Turkish Lira</MenuItem>
                <MenuItem value={2}>USD - US Dollar</MenuItem>
                <MenuItem value={3}>EUR - Euro</MenuItem>
                <MenuItem value={4}>GBP - British Pound</MenuItem>
              </Select>
              {compErrors.currency && <FormHelperText>{compErrors.currency}</FormHelperText>}
            </FormControl>

            <TextField
              label="Effective Date"
              type="date"
              size="small"
              fullWidth
              value={effectiveDate}
              onChange={(e) => setEffectiveDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              error={!!compErrors.effectiveDate}
              helperText={compErrors.effectiveDate || "Date this salary takes effect"}
              sx={premiumInputSx}
            />
          </Box>
        </Box>
      </TabPanel>

      <PopupDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Calculate Payroll"
        content="Are you sure you want to calculate/recalculate the payroll for this month? If a payroll already exists for this month, it will be recalculated and overwritten based on current timesheet data."
        confirmColor="warning"
        onConfirm={handleCalculateConfirm}
        confirmText={isCalculating ? "Calculating..." : "Calculate"}
      />

    </Box>
  );
};
