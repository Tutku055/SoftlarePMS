import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  FormHelperText
} from '@mui/material';
import { SaveRounded } from '@mui/icons-material';
import { useUpdateCompensation } from '../../../finance/hooks/useUpdateCompensation';
import * as z from 'zod';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';

const compensationSchema = z.object({
  baseSalary: z.number().positive("Base Salary must be greater than 0"),
  currency: z.number().int().min(1).max(4),
  salaryType: z.number().int().min(1).max(2),
  effectiveDate: z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" })
});

interface CompensationModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  currentBaseSalary: number;
  currentCurrency: number;
  currentSalaryType?: number;
}

export const CompensationModal = ({ 
  open, 
  onClose, 
  employeeId, 
  currentBaseSalary, 
  currentCurrency, 
  currentSalaryType 
}: CompensationModalProps) => {
  const [baseSalary, setBaseSalary] = useState(currentBaseSalary || 0);
  const [currency, setCurrency] = useState(currentCurrency || 1);
  const [salaryType, setSalaryType] = useState(currentSalaryType || 2);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const { mutate: updateCompensation, isPending } = useUpdateCompensation();

  useEffect(() => {
    if (open) {
      setBaseSalary(currentBaseSalary || 0);
      setCurrency(currentCurrency || 1);
      setSalaryType(currentSalaryType || 2);
      setEffectiveDate(new Date().toISOString().split('T')[0]);
      setErrors({});
    }
  }, [open, currentBaseSalary, currentCurrency, currentSalaryType]);

  const handleSave = () => {
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
      setErrors(fieldErrors);
      return;
    }

    setErrors({});

    const executeSave = () => {
      updateCompensation(
        {
          employeeId,
          command: {
            baseSalary: validation.data.baseSalary,
            currency: validation.data.currency,
            salaryType: validation.data.salaryType,
            effectiveDate: new Date(validation.data.effectiveDate).toISOString()
          }
        },
        {
          onSuccess: () => {
            onClose();
          }
        }
      );
    };

    if (currentSalaryType === 2 && salaryType === 1) {
      setConfirmHourlyDialogOpen(true);
    } else {
      executeSave();
    }
  };

  const [confirmHourlyDialogOpen, setConfirmHourlyDialogOpen] = useState(false);

  return (
    <>
    <Dialog open={open} onClose={() => !isPending && onClose()} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
        Update Compensation
      </DialogTitle>
      <DialogContent sx={{ pt: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Base Salary"
            type="number"
            size="small"
            fullWidth
            value={baseSalary}
            onChange={(e) => setBaseSalary(Number(e.target.value))}
            slotProps={{ htmlInput: { min: 0, step: 0.01 } }}
            error={!!errors.baseSalary}
            helperText={errors.baseSalary}
          />

          <FormControl fullWidth size="small" error={!!errors.salaryType}>
            <InputLabel>Salary Type</InputLabel>
            <Select value={salaryType} label="Salary Type" onChange={(e: any) => setSalaryType(Number(e.target.value))}>
              <MenuItem value={2}>Monthly (per 30 days)</MenuItem>
              <MenuItem value={1}>Hourly (per hour)</MenuItem>
            </Select>
            {errors.salaryType && <FormHelperText>{errors.salaryType}</FormHelperText>}
          </FormControl>

          <FormControl fullWidth size="small" error={!!errors.currency}>
            <InputLabel>Currency</InputLabel>
            <Select value={currency} label="Currency" onChange={(e: any) => setCurrency(Number(e.target.value))}>
              <MenuItem value={1}>TRY - Turkish Lira</MenuItem>
              <MenuItem value={2}>USD - US Dollar</MenuItem>
              <MenuItem value={3}>EUR - Euro</MenuItem>
              <MenuItem value={4}>GBP - British Pound</MenuItem>
            </Select>
            {errors.currency && <FormHelperText>{errors.currency}</FormHelperText>}
          </FormControl>

          <TextField
            label="Effective Date"
            type="date"
            size="small"
            fullWidth
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!errors.effectiveDate}
            helperText={errors.effectiveDate || "Date this salary takes effect"}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={isPending} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={isPending} startIcon={<SaveRounded />}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>

    <PopupDialog
      open={confirmHourlyDialogOpen}
      title="Confirm Contract Change"
      content="Changing compensation to Hourly mid-month is supported but can cause management complexity. It is healthier to do this at the beginning of the month. Proceeding will permanently reset the employee's earned and carried over vacation days to 0. Are you sure?"
      confirmText="Yes, Change to Hourly"
      cancelText="Cancel"
      onConfirm={() => {
        setConfirmHourlyDialogOpen(false);
        // re-run save bypass the check because state is tricky, we can just call updateCompensation directly
        updateCompensation({
          employeeId,
          command: {
            baseSalary: Number(baseSalary),
            currency,
            salaryType,
            effectiveDate: new Date(effectiveDate).toISOString()
          }
        }, { onSuccess: () => onClose() });
      }}
      onClose={() => setConfirmHourlyDialogOpen(false)}
    />
    </>
  );
};
