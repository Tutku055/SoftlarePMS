import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { Close, Celebration, Cake } from '@mui/icons-material';
import type { VirtualCalendarEventDto } from '../../types/calendar.types';

interface VirtualEventDialogProps {
  open: boolean;
  onClose: () => void;
  virtualEvent?: VirtualCalendarEventDto | null;
}

export const VirtualEventDialog: React.FC<VirtualEventDialogProps> = ({
  open,
  onClose,
  virtualEvent,
}) => {
  if (!virtualEvent) return null;

  const isHoliday = virtualEvent.type === 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, pt: 2.5, px: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isHoliday ? (
            <Celebration sx={{ color: '#10B981' }} />
          ) : (
            <Cake sx={{ color: '#EC4899' }} />
          )}
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {isHoliday ? 'Public Holiday' : 'Employee Birthday'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Close fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '20px !important', px: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          {virtualEvent.title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={virtualEvent.date}
            size="small"
            sx={{ fontWeight: 600, bgcolor: `${virtualEvent.colorCode}26`, color: virtualEvent.colorCode }}
          />
          <Chip
            label={isHoliday ? 'Official Holiday' : 'Team Celebration'}
            size="small"
            variant="outlined"
          />
        </Box>

        {virtualEvent.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {virtualEvent.description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
