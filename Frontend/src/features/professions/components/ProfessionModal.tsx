import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Stack, FormHelperText, Box, Typography
} from '@mui/material';
import { SaveRounded, DeleteRounded, CheckCircleRounded } from '@mui/icons-material';
import * as z from 'zod';
import { useCreateProfession } from '../hooks/useCreateProfession';
import { useUpdateProfession } from '../hooks/useUpdateProfession';
import { useDeleteProfession } from '../hooks/useDeleteProfession';
import { PopupDialog } from '../../../components/PopupDialog/PopupDialog';
import type { Profession } from '../types';

const schema = z.object({
  name: z.string().min(1, "Name is required").max(150, "Name cannot exceed 150 characters"),
  description: z.string().max(500, "Description cannot exceed 500 characters").optional().or(z.literal(''))
});

interface ProfessionModalProps {
  open: boolean;
  onClose: () => void;
  profession?: Profession | null;
}

export const ProfessionModal = ({ open, onClose, profession }: ProfessionModalProps) => {
  const isEditing = !!profession;
  const isActive = profession?.isActive !== false;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { mutate: createProfession, isPending: isCreating } = useCreateProfession();
  const { mutate: updateProfession, isPending: isUpdating } = useUpdateProfession();
  const { mutate: deleteProfession, isPending: isDeleting } = useDeleteProfession();
  
  const isPending = isCreating || isUpdating || isDeleting;

  useEffect(() => {
    if (open) {
      if (profession) {
        setName(profession.name);
        setDescription(profession.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setErrors({});
      setActionDialogOpen(false);
      setErrorMessage(null);
    }
  }, [open, profession]);

  const extractApiError = (error: unknown): string => {
    if (error && typeof error === 'object' && 'response' in error) {
      const resp = (error as any).response;
      const msg = resp?.data?.errors?.message || resp?.data?.message || resp?.data?.title;
      if (msg) return msg;
    }
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSave = () => {
    const validation = schema.safeParse({ name, description });
    
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setErrors({});

    if (isEditing && profession) {
      updateProfession(
        { id: profession.id, command: { id: profession.id, name: validation.data.name, description: validation.data.description, isActive: profession.isActive } },
        { onSuccess: onClose }
      );
    } else {
      createProfession(
        { name: validation.data.name, description: validation.data.description },
        { onSuccess: onClose }
      );
    }
  };

  const handleStatusToggle = () => {
    if (!profession) return;
    
    if (isActive) {
      deleteProfession({ id: profession.id, hardDelete: false }, {
        onSuccess: () => {
          setActionDialogOpen(false);
          onClose();
        },
        onError: (error) => {
          setActionDialogOpen(false);
          setErrorMessage(extractApiError(error));
        },
      });
    } else {
      updateProfession({
        id: profession.id,
        command: { id: profession.id, name: profession.name, description: profession.description, isActive: true }
      }, {
        onSuccess: () => {
          setActionDialogOpen(false);
          onClose();
        },
        onError: (error) => {
          setActionDialogOpen(false);
          setErrorMessage(extractApiError(error));
        },
      });
    }
  };

  return (
    <>
      <Dialog open={open && !actionDialogOpen} onClose={() => !isPending && onClose()} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 1.5 }}>
          {isEditing ? 'Edit Profession' : 'Add Profession'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Box>
              <TextField
                label="Profession Name"
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
                label="Description"
                size="small"
                fullWidth
                multiline
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                error={!!errors.description}
              />
              {errors.description && <FormHelperText error>{errors.description}</FormHelperText>}
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
        title={isActive ? "Deactivate Profession" : "Activate Profession"}
        content={
          <Typography>
            Are you sure you want to {isActive ? 'deactivate' : 'activate'} <b>{profession?.name}</b>?
          </Typography>
        }
        icon={isActive ? <DeleteRounded fontSize="medium" /> : <CheckCircleRounded fontSize="medium" />}
        confirmText={isActive ? "Deactivate" : "Activate"}
        confirmColor={isActive ? "error" : "success"}
        onConfirm={handleStatusToggle}
        isProcessing={isPending}
      />

      <PopupDialog
        open={!!errorMessage}
        onClose={() => setErrorMessage(null)}
        title="Action Not Allowed"
        content={
          <Typography>{errorMessage}</Typography>
        }
        icon={<DeleteRounded fontSize="medium" />}
        confirmColor="error"
        confirmText="OK"
        onConfirm={() => setErrorMessage(null)}
        hideCancel
        maxWidth="xs"
      />
    </>
  );
};
