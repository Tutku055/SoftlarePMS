import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  FormHelperText,
  Box,
  Typography
} from '@mui/material';
import { SaveRounded, DeleteRounded, CheckCircleRounded } from '@mui/icons-material';
import * as z from 'zod';
import { useCreateOvertimeType } from '../../hooks/useCreateOvertimeType';
import { useUpdateOvertimeType } from '../../hooks/useUpdateOvertimeType';
import { useDeleteOvertimeType } from '../../hooks/useDeleteOvertimeType';
import { useRestoreOvertimeType } from '../../hooks/useRestoreOvertimeType';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import type { OvertimeType } from '../../types';

const schema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name cannot exceed 100 characters"),
  multiplier: z.number().positive("Multiplier must be greater than 0")
});

interface OvertimeTypeModalProps {
  open: boolean;
  onClose: () => void;
  overtimeType?: OvertimeType | null;
}

export const OvertimeTypeModal = ({ open, onClose, overtimeType }: OvertimeTypeModalProps) => {
  const isEditing = !!overtimeType;
  const isActive = overtimeType?.isActive !== false; // true if null or true
  
  const [name, setName] = useState('');
  const [multiplier, setMultiplier] = useState(1.5);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);

  const { mutate: createType, isPending: isCreating } = useCreateOvertimeType();
  const { mutate: updateType, isPending: isUpdating } = useUpdateOvertimeType();
  const { mutate: deleteType, isPending: isDeleting } = useDeleteOvertimeType();
  const { mutate: restoreType, isPending: isRestoring } = useRestoreOvertimeType();

  const isPending = isCreating || isUpdating || isDeleting || isRestoring;

  useEffect(() => {
    if (open) {
      if (overtimeType) {
        setName(overtimeType.name);
        setMultiplier(overtimeType.multiplier);
      } else {
        setName('');
        setMultiplier(1.5);
      }
      setErrors({});
      setActionDialogOpen(false);
    }
  }, [open, overtimeType]);

  const handleSave = () => {
    const validation = schema.safeParse({ name, multiplier: Number(multiplier) });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (isEditing && overtimeType) {
      updateType(
        { id: overtimeType.id, command: { id: overtimeType.id, name: validation.data.name, multiplier: validation.data.multiplier } },
        { onSuccess: onClose }
      );
    } else {
      createType(
        { name: validation.data.name, multiplier: validation.data.multiplier },
        { onSuccess: onClose }
      );
    }
  };

  const handleStatusToggle = () => {
    if (!overtimeType) return;
    
    if (isActive) {
      deleteType(overtimeType.id, { onSuccess: () => {
        setActionDialogOpen(false);
        onClose();
      }});
    } else {
      restoreType(overtimeType.id, { onSuccess: () => {
        setActionDialogOpen(false);
        onClose();
      }});
    }
  };

  return (
    <>
      <Dialog open={open && !actionDialogOpen} onClose={() => !isPending && onClose()} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
          {isEditing ? 'Edit Overtime Type' : 'Add Overtime Type'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <TextField
                label="Overtime Name"
                size="small"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={!!errors.name}
              />
              {errors.name && <FormHelperText error>{errors.name}</FormHelperText>}
            </Box>

            <Box>
              <TextField
                label="Multiplier"
                type="number"
                size="small"
                fullWidth
                value={multiplier}
                onChange={(e) => setMultiplier(Number(e.target.value))}
                slotProps={{ htmlInput: { min: 0.1, step: 0.1 } }}
                error={!!errors.multiplier}
              />
              {errors.multiplier && <FormHelperText error>{errors.multiplier}</FormHelperText>}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: isEditing ? 'space-between' : 'flex-end' }}>
          {isEditing && (
            <Button
              color={isActive ? "error" : "success"}
              onClick={() => setActionDialogOpen(true)}
              disabled={isPending}
              startIcon={isActive ? <DeleteRounded /> : <CheckCircleRounded />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {isActive ? 'Deactivate' : 'Activate'}
            </Button>
          )}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={isPending} sx={{ textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
            <Button 
              variant="contained" 
              onClick={handleSave} 
              disabled={isPending}
              startIcon={<SaveRounded />}
              sx={{ textTransform: 'none', fontWeight: 600, boxShadow: 'none' }}
            >
              {isPending ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      <PopupDialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        title={isActive ? "Deactivate Overtime Type" : "Activate Overtime Type"}
        content={
          <Typography>
            Are you sure you want to {isActive ? 'deactivate' : 'activate'} <b>{overtimeType?.name}</b>?
            {isActive 
              ? ' This action will hide it from new selections but past entries will remain intact.'
              : ' This will make it available for new timesheet entries.'}
          </Typography>
        }
        icon={isActive ? <DeleteRounded fontSize="medium" /> : <CheckCircleRounded fontSize="medium" />}
        confirmText={isActive ? "Deactivate" : "Activate"}
        confirmColor={isActive ? "error" : "success"}
        onConfirm={handleStatusToggle}
        isProcessing={isActive ? isDeleting : isRestoring}
      />
    </>
  );
};
