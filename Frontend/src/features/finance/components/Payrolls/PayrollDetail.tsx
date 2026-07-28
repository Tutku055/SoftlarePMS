import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEmployeeDetail } from '../../../employees/hooks/useEmployeeDetail';
import { usePayrollList } from '../../hooks/usePayrollList';
import { useCalculatePayroll } from '../../hooks/useCalculatePayroll';
import { useUpdateCompensation } from '../../hooks/useUpdateCompensation';
import { useEditCompensation } from '../../hooks/useEditCompensation';
import { useDeleteCompensation } from '../../hooks/useDeleteCompensation';
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
  PrintRounded
} from '@mui/icons-material';
import * as z from 'zod';
import styles from './PayrollDetail.module.css';
import { CURRENCY_CONFIGS, getCurrencySymbol, formatCompensationAmount } from '../../constants/currencyConstants';

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

const extractErrorMessage = (error: any): string => {
  if (error?.response?.data?.errors) {
    const errs = error.response.data.errors;
    const firstKey = Object.keys(errs)[0];
    if (firstKey && Array.isArray(errs[firstKey]) && errs[firstKey].length > 0) {
      return errs[firstKey][0];
    }
  }
  if (typeof error?.response?.data?.detail === 'string') {
    return error.response.data.detail;
  }
  if (typeof error?.response?.data?.title === 'string') {
    return error.response.data.title;
  }
  if (typeof error?.response?.data === 'string') {
    return error.response.data;
  }
  if (typeof error?.message === 'string') {
    return error.message;
  }
  return 'An error occurred.';
};

const compensationSchema = z.object({
  baseSalary: z.number().positive("Base Salary must be greater than 0"),
  currency: z.number().int().min(1),
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
  const { mutate: editCompensation, isPending: isEditingCompensation } = useEditCompensation();
  const { mutate: deleteCompensation } = useDeleteCompensation();

  const compensation = employee?.compensation || null;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [calcYear, setCalcYear] = useState(currentYear);
  const [calcMonth, setCalcMonth] = useState(currentMonth);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const slipRef = useRef<HTMLDivElement>(null);

  const generatePdfDoc = () => {
    if (!selectedSlip) return null;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("PAYROLL SLIP", pageWidth / 2, 22, { align: "center" });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(`Employee: ${employee?.firstName} ${employee?.lastName}`, 14, 35);
    doc.text(`Period: ${new Date(selectedSlip.year, selectedSlip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`, 14, 42);
    doc.text(`Issue Date: ${new Date(selectedSlip.issueDate).toLocaleDateString()}`, 14, 49);
    doc.text(`Calculation Type: ${selectedSlip.salaryTypes}`, 14, 56);
    
    // Earnings Table
    const earnings = selectedSlip.lineItems?.filter((li: any) => li.itemType === 1) || [];
    const earningsData = earnings.map((li: any) => [li.description, `${li.amount.toFixed(2)} ${getCurrencySymbol(li.currency)}`]);
    earningsData.push(["Total Earnings", selectedSlip.totalEarnings]);

    autoTable(doc, {
      startY: 65,
      head: [['Earnings', 'Amount']],
      body: earningsData,
      theme: 'grid',
      headStyles: { fillColor: [46, 125, 50], fontSize: 11 },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: function(data) {
        if (data.row.index === earningsData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [46, 125, 50];
        }
      }
    });

    // Deductions Table
    const deductions = selectedSlip.lineItems?.filter((li: any) => li.itemType === 2) || [];
    const deductionsData = deductions.map((li: any) => [li.description, `-${li.amount.toFixed(2)} ${getCurrencySymbol(li.currency)}`]);
    deductionsData.push(["Total Deductions", selectedSlip.totalDeductions]);

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      head: [['Deductions', 'Amount']],
      body: deductionsData,
      theme: 'grid',
      headStyles: { fillColor: [211, 47, 47], fontSize: 11 },
      columnStyles: { 1: { halign: 'right' } },
      didParseCell: function(data) {
        if (data.row.index === deductionsData.length - 1) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = [211, 47, 47];
        }
      }
    });

    // Net Salary
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    
    // Draw Net Salary Box
    doc.setFillColor(245, 245, 245);
    doc.roundedRect(14, finalY - 8, pageWidth - 28, 16, 2, 2, 'F');

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("NET SALARY", 18, finalY + 3);
    
    doc.setTextColor(25, 118, 210);
    doc.text(selectedSlip.netSalary, pageWidth - 18, finalY + 3, { align: "right" });

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
      doc.save(`Payroll_Slip_${selectedSlip?.year}_${selectedSlip?.month}.pdf`);
    }
  };

  // Tabs
  const [activeTab, setActiveTab] = useState(0);

  // Slip Details Modal
  const [selectedSlip, setSelectedSlip] = useState<any | null>(null);

  // Compensation Form State
  const [editingCompId, setEditingCompId] = useState<string | null>(null);
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
      onSuccess: () => setConfirmOpen(false),
      onError: (error: any) => {
        setConfirmOpen(false);
        setErrorMessage(extractErrorMessage(error));
        setErrorDialogOpen(true);
      }
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
    
    const commandData = {
        baseSalary: validation.data.baseSalary,
        currency: validation.data.currency,
        salaryType: validation.data.salaryType,
        effectiveDate: new Date(validation.data.effectiveDate).toISOString()
    };

    if (editingCompId) {
      editCompensation(
        { employeeId, id: editingCompId, command: commandData },
        { 
          onSuccess: () => {
            setEditingCompId(null);
            // Optionally reset to current active compensation
            if (compensation) {
              setBaseSalary(compensation.baseSalary || 0);
              setCurrency(compensation.currency || 1);
              setSalaryType(compensation.salaryType || 2);
              if (compensation.effectiveDate) {
                setEffectiveDate(compensation.effectiveDate.split('T')[0]);
              }
            }
          },
          onError: (error: any) => {
            setErrorMessage(extractErrorMessage(error));
            setErrorDialogOpen(true);
          }
        }
      );
    } else {
      updateCompensation(
        { employeeId, command: commandData },
        {
          onError: (error: any) => {
            setErrorMessage(extractErrorMessage(error));
            setErrorDialogOpen(true);
          }
        }
      );
    }
  };

  const handleEditClick = (comp: any) => {
    setEditingCompId(comp.id);
    setBaseSalary(comp.baseSalary);
    setCurrency(comp.currency);
    setSalaryType(comp.salaryType);
    setEffectiveDate(comp.effectiveDate.split('T')[0]);
    setCompErrors({});
  };

  const handleCancelEdit = () => {
    setEditingCompId(null);
    setCompErrors({});
    if (compensation) {
      setBaseSalary(compensation.baseSalary || 0);
      setCurrency(compensation.currency || 1);
      setSalaryType(compensation.salaryType || 2);
      if (compensation.effectiveDate) {
        setEffectiveDate(compensation.effectiveDate.split('T')[0]);
      }
    }
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
                  ? `${compensation.baseSalary}${getCurrencySymbol(compensation.currency)}` 
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
          <Tab icon={<SettingsRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Compensation History & Settings" />
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
                      {slip.netSalary}
                    </Typography>
                  </Box>
                  <Button 
                    variant="outlined" 
                    startIcon={<PictureAsPdfRounded />} 
                    size="small" 
                    sx={{ textTransform: 'none', borderRadius: 2 }}
                    onClick={() => setSelectedSlip(slip)}
                  >
                    View Slip
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ ...glassPanelSx }}>
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
                {Object.values(CURRENCY_CONFIGS).map((curr) => (
                  <MenuItem key={curr.id} value={curr.id}>
                    {curr.label}
                  </MenuItem>
                ))}
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
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleSaveCompensation} 
              disabled={isUpdatingCompensation || isEditingCompensation}
              sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}
            >
              {editingCompId 
                ? (isEditingCompensation ? 'Updating...' : 'Update Record') 
                : (isUpdatingCompensation ? 'Adding...' : 'Add New Compensation')}
            </Button>
            {editingCompId && (
              <Button 
                variant="outlined" 
                onClick={handleCancelEdit}
                disabled={isEditingCompensation}
                sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
              >
                Cancel Edit
              </Button>
            )}
          </Box>

          <Box sx={{ mt: 5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>History</Typography>
              <Typography variant="caption" color="text.secondary">
                Total Records: {employee.compensations?.length || 0}
              </Typography>
            </Box>
            <Box sx={{ borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead style={{ backgroundColor: 'rgba(128, 128, 128, 0.05)' }}>
                  <tr>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>Base Salary</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>Pay Grade</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>Effective Date</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)' }}>End Date</th>
                    <th style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...(employee.compensations || [])].sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime()).map((comp: any) => (
                    <tr key={comp.id}>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                        {formatCompensationAmount(comp.baseSalary, comp.currency, comp.salaryType)}
                      </td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>{comp.payGrade}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>{new Date(comp.effectiveDate).toLocaleDateString()}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>{comp.endDate ? new Date(comp.endDate).toLocaleDateString() : 'Active'}</td>
                      <td style={{ padding: '12px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)', textAlign: 'right' }}>
                        <Button 
                          size="small" 
                          color="primary" 
                          onClick={() => handleEditClick(comp)}
                          sx={{ mr: 1 }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="small" 
                          color="error" 
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this historical record?')) {
                              deleteCompensation({ employeeId: employee.id, id: comp.id });
                            }
                          }}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!(employee.compensations?.length) && (
                    <tr><td colSpan={5} style={{ padding: '12px', textAlign: 'center' }}>No history found.</td></tr>
                  )}
                </tbody>
              </table>
            </Box>
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

      <PopupDialog
        open={errorDialogOpen}
        onClose={() => setErrorDialogOpen(false)}
        title={errorMessage.includes("Timesheet not found") ? "Timesheet Required" : "Error"}
        content={
          errorMessage.includes("Timesheet not found") 
            ? "There is no timesheet for this month. You need to generate the timesheet before calculating payroll." 
            : errorMessage
        }
        confirmColor={errorMessage.includes("Timesheet not found") ? "primary" : "error"}
        onConfirm={() => {
          setErrorDialogOpen(false);
          if (errorMessage.includes("Timesheet not found")) {
            navigate(`/finance/timesheets/${employeeId}`);
          }
        }}
        confirmText={errorMessage.includes("Timesheet not found") ? "Go to Timesheet Matrix" : "OK"}
        showCancel={errorMessage.includes("Timesheet not found")}
      />

      {/* SLIP DETAILS DIALOG */}
      {selectedSlip && (
        <PopupDialog
          open={!!selectedSlip}
          onClose={() => setSelectedSlip(null)}
          title={`Payroll Slip - ${new Date(selectedSlip.year, selectedSlip.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}`}
          headerActions={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Print">
                <IconButton onClick={() => handlePrint()} sx={{ color: 'primary.main', bgcolor: 'primary.50' }}>
                  <PrintRounded />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download PDF">
                <IconButton onClick={handleDownloadPdf} sx={{ color: 'error.main', bgcolor: 'error.50' }}>
                  <PictureAsPdfRounded />
                </IconButton>
              </Tooltip>
            </Box>
          }
          content={
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              {/* SLIP CONTENT TO PRINT */}
              <div ref={slipRef} style={{ padding: '32px', backgroundColor: '#fff', color: '#000', borderRadius: '12px', width: '100%', maxWidth: '600px', margin: '0 auto', border: '1px solid #e0e0e0' }}>
                <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 800, mb: 4, color: '#1a1a1a' }}>
                  PAYROLL SLIP
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 4, pb: 3, borderBottom: '2px solid #eee' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ color: '#555', fontWeight: 500 }}>Employee:</Typography>
                    <Typography variant="body1" sx={{ color: '#000', fontWeight: 700 }}>{employee?.firstName} {employee?.lastName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ color: '#555', fontWeight: 500 }}>Issue Date:</Typography>
                    <Typography variant="body1" sx={{ color: '#000', fontWeight: 700 }}>{new Date(selectedSlip.issueDate).toLocaleDateString()}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body1" sx={{ color: '#555', fontWeight: 500 }}>Calculation Type:</Typography>
                    <Typography variant="body1" sx={{ color: '#000', fontWeight: 700 }}>{selectedSlip.salaryTypes}</Typography>
                  </Box>
                </Box>
                  
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#2e7d32', textTransform: 'uppercase', letterSpacing: '1px' }}>Earnings</Typography>
              <table style={{ width: '100%', fontSize: '0.875rem', marginBottom: '16px' }}>
                <tbody>
                  {selectedSlip.lineItems?.filter((li: any) => li.itemType === 1).map((li: any) => (
                    <tr key={li.id}>
                      <td style={{ padding: '4px 0' }}>{li.description}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600 }}>{li.amount.toFixed(2)} {getCurrencySymbol(li.currency)}</td>
                    </tr>
                  ))}
                  {(!selectedSlip.lineItems || selectedSlip.lineItems.filter((li: any) => li.itemType === 1).length === 0) && (
                     <tr><td colSpan={2} style={{ padding: '4px 0', color: 'gray' }}>No earnings</td></tr>
                  )}
                  <tr>
                    <td style={{ padding: '8px 0', borderTop: '1px solid var(--mui-palette-divider)' }}><strong>Total Earnings</strong></td>
                    <td style={{ padding: '8px 0', textAlign: 'right', borderTop: '1px solid var(--mui-palette-divider)', fontWeight: 700, color: 'success.main' }}>{selectedSlip.totalEarnings}</td>
                  </tr>
                </tbody>
              </table>

                <Typography variant="subtitle1" sx={{ fontWeight: 700, mt: 4, mb: 2, color: '#d32f2f', textTransform: 'uppercase', letterSpacing: '1px' }}>Deductions</Typography>
              <table style={{ width: '100%', fontSize: '0.875rem', marginBottom: '16px' }}>
                <tbody>
                  {selectedSlip.lineItems?.filter((li: any) => li.itemType === 2).map((li: any) => (
                    <tr key={li.id}>
                      <td style={{ padding: '4px 0' }}>{li.description}</td>
                      <td style={{ padding: '4px 0', textAlign: 'right', fontWeight: 600, color: 'error.main' }}>-{li.amount.toFixed(2)} {getCurrencySymbol(li.currency)}</td>
                    </tr>
                  ))}
                  {(!selectedSlip.lineItems || selectedSlip.lineItems.filter((li: any) => li.itemType === 2).length === 0) && (
                     <tr><td colSpan={2} style={{ padding: '4px 0', color: 'gray' }}>No deductions</td></tr>
                  )}
                  <tr>
                    <td style={{ padding: '8px 0', borderTop: '1px solid var(--mui-palette-divider)' }}><strong>Total Deductions</strong></td>
                    <td style={{ padding: '8px 0', textAlign: 'right', borderTop: '1px solid var(--mui-palette-divider)', fontWeight: 700, color: 'error.main' }}>{selectedSlip.totalDeductions}</td>
                  </tr>
                </tbody>
              </table>

              <Box sx={{ mt: 3, p: 2, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#000' }}>NET SALARY</Typography>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1976d2' }}>{selectedSlip.netSalary}</Typography>
              </Box>
            </div>
            </Box>
          }
          confirmText="Close"
          showCancel={false}
          onConfirm={() => setSelectedSlip(null)}
        />
      )}

    </Box>
  );
};
