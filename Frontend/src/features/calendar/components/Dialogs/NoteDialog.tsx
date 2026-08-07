import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  IconButton,
  Alert,
  RadioGroup,
  FormControlLabel,
  Radio,
  Tooltip,
} from '@mui/material';
import { Close, DeleteOutlined, StickyNote2, Lock, Public } from '@mui/icons-material';
import {
  VisibilityLevel,
  type CalendarNoteDto,
  type CreateCalendarNotePayload,
  type UpdateCalendarNotePayload,
} from '../../types/calendar.types';
import { useAuthStore } from '../../../../store/useAuthStore';

interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  noteToEdit?: CalendarNoteDto | null;
  defaultDate?: string; // YYYY-MM-DD
  onCreate: (payload: CreateCalendarNotePayload) => Promise<void>;
  onUpdate: (id: string, payload: UpdateCalendarNotePayload) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const COLOR_PALETTE = [
  { label: 'Amber', color: '#F59E0B' },
  { label: 'Indigo', color: '#4F46E5' },
  { label: 'Emerald', color: '#10B981' },
  { label: 'Rose', color: '#EC4899' },
  { label: 'Purple', color: '#8B5CF6' },
  { label: 'Cyan', color: '#06B6D4' },
  { label: 'Slate', color: '#64748B' },
];

export const NoteDialog: React.FC<NoteDialogProps> = ({
  open,
  onClose,
  noteToEdit,
  defaultDate,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUser = useAuthStore((state) => state.currentUser);

  const canCreateStandard = hasPermission('Calendar.CreateNote');
  const canCreateConfidential = hasPermission('Calendar.CreateConfidentialNotes');
  const canUpdateStandard = hasPermission('Calendar.UpdateNote');
  const canUpdateConfidential = hasPermission('Calendar.UpdateConfidentialNotes');
  const canDeleteStandard = hasPermission('Calendar.DeleteNote');
  const canDeleteConfidential = hasPermission('Calendar.DeleteConfidentialNotes');

  const isEditing = Boolean(noteToEdit);
  const isOwner = isEditing && noteToEdit ? currentUser?.id === noteToEdit.userId : true;

  const [noteDate, setNoteDate] = useState('');
  const [content, setContent] = useState('');
  const [colorCode, setColorCode] = useState('#F59E0B');
  const [visibilityLevel, setVisibilityLevel] = useState<VisibilityLevel>(VisibilityLevel.Standard);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const isConfidential = visibilityLevel === VisibilityLevel.Confidential;
  const canCreateActive = isConfidential ? canCreateConfidential : canCreateStandard;
  const canUpdateActive = isConfidential ? canUpdateConfidential : canUpdateStandard;
  const canDeleteActive = noteToEdit?.visibilityLevel === VisibilityLevel.Confidential
    ? canDeleteConfidential
    : canDeleteStandard;

  const canSaveActive = isEditing ? (canUpdateActive && isOwner) : canCreateActive;

  useEffect(() => {
    if (noteToEdit) {
      setNoteDate(noteToEdit.noteDate);
      setContent(noteToEdit.content);
      setColorCode(noteToEdit.colorCode || '#F59E0B');
      setVisibilityLevel(noteToEdit.visibilityLevel);
      setError(null);
    } else {
      const defaultVis = canCreateStandard ? VisibilityLevel.Standard : (canCreateConfidential ? VisibilityLevel.Confidential : VisibilityLevel.Standard);

      setNoteDate(defaultDate || new Date().toISOString().split('T')[0]);
      setContent('');
      setColorCode('#F59E0B');
      setVisibilityLevel(defaultVis);
      setError(null);
    }
  }, [noteToEdit, defaultDate, open, canCreateStandard, canCreateConfidential]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Note content is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditing && noteToEdit) {
        await onUpdate(noteToEdit.id, {
          id: noteToEdit.id,
          noteDate,
          content: content.trim(),
          colorCode,
          visibilityLevel,
        });
      } else {
        await onCreate({
          noteDate,
          content: content.trim(),
          colorCode,
          visibilityLevel,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'An error occurred while saving note.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToEdit) return;

    setIsSubmitting(true);
    try {
      await onDelete(noteToEdit.id);
      setDeleteConfirmOpen(false);
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to delete note.');
      setDeleteConfirmOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: 'background.paper',
            backgroundImage: 'none',
          },
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 2.5, px: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <StickyNote2 sx={{ color: colorCode }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {isEditing ? 'Edit Personal Note' : 'Create Personal Note'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: '20px !important', px: 3 }}>
          {error && <Alert severity="error" sx={{ mb: 0.5 }}>{error}</Alert>}

          {isEditing && noteToEdit?.authorName && (
            <Typography variant="caption" color="text.secondary">
              Author: <strong>{noteToEdit.authorName}</strong>
            </Typography>
          )}

          <TextField
            label="Date"
            type="date"
            required
            fullWidth
            value={noteDate}
            onChange={(e) => setNoteDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            disabled={isSubmitting || !canSaveActive}
            sx={{ mt: 0.5 }}
          />

          <TextField
            label="Note Content"
            multiline
            rows={4}
            required
            fullWidth
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your note, reminder, or thoughts here..."
            disabled={isSubmitting || !canSaveActive}
          />

          {/* Color Selector */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
              Color Tag
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {COLOR_PALETTE.map((item) => (
                <Tooltip key={item.color} title={item.label}>
                  <Box
                    onClick={() => {
                      if (canSaveActive) {
                        setColorCode(item.color);
                      }
                    }}
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      cursor: canSaveActive ? 'pointer' : 'default',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: (theme) =>
                        colorCode === item.color
                          ? `3px solid ${theme.palette.mode === 'dark' ? '#ffffff' : '#111827'}`
                          : '2px solid transparent',
                      boxShadow: (theme) =>
                        colorCode === item.color
                          ? `0 0 0 2px ${theme.palette.mode === 'dark' ? '#1F2937' : '#ffffff'}`
                          : 'none',
                      transition: 'transform 0.15s ease',
                      '&:hover': { transform: canSaveActive ? 'scale(1.1)' : 'none' },
                    }}
                  />
                </Tooltip>
              ))}
            </Box>
          </Box>

          {/* Visibility Level */}
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase', color: 'text.secondary', mb: 1, display: 'block' }}>
              Visibility Level
            </Typography>
            <RadioGroup
              row
              value={visibilityLevel}
              onChange={(e) => setVisibilityLevel(Number(e.target.value) as VisibilityLevel)}
            >
              <FormControlLabel
                value={VisibilityLevel.Standard}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Public fontSize="small" color="action" />
                    <Typography variant="body2">Standard (Visible to team)</Typography>
                  </Box>
                }
                disabled={isSubmitting || (isEditing ? (!canUpdateStandard || !isOwner) : !canCreateStandard)}
              />
              <FormControlLabel
                value={VisibilityLevel.Confidential}
                control={<Radio size="small" />}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Lock fontSize="small" color="warning" />
                    <Typography variant="body2">Confidential (Private)</Typography>
                  </Box>
                }
                disabled={isSubmitting || (isEditing ? (!canUpdateConfidential || !isOwner) : !canCreateConfidential)}
              />
            </RadioGroup>
            {visibilityLevel === VisibilityLevel.Confidential && (
              <Alert severity="warning" sx={{ mt: 1, py: 0.5, fontSize: '0.8rem' }}>
                Confidential notes are strictly hidden from users without confidential permissions.
              </Alert>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, justifyContent: 'space-between' }}>
          {isEditing && canDeleteActive && isOwner ? (
            <Button
              color="error"
              startIcon={<DeleteOutlined />}
              onClick={handleDeleteClick}
              disabled={isSubmitting}
            >
              Delete
            </Button>
          ) : (
            <Box />
          )}

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            {canSaveActive && (
              <Button type="submit" variant="contained" color="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Note'}
              </Button>
            )}
          </Box>
        </DialogActions>
      </form>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => !isSubmitting && setDeleteConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: { borderRadius: 3, p: 1 },
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <DeleteOutlined color="error" />
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            Delete Note
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete this note{noteToEdit?.content ? `: "${noteToEdit.content.slice(0, 40)}${noteToEdit.content.length > 40 ? '...' : ''}"` : ''}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteConfirmOpen(false)} disabled={isSubmitting} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDelete}
            color="error"
            variant="contained"
            disabled={isSubmitting}
            sx={{ fontWeight: 600 }}
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};
