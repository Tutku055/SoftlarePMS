import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { CloseRounded } from '@mui/icons-material';

export interface PopupDialogProps {
  open: boolean;
  onClose: () => void;
  title: React.ReactNode;
  content: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  headerActions?: React.ReactNode;
  
  // Default action props (if 'actions' is not provided)
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  isProcessing?: boolean;
  hideCancel?: boolean;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const PopupDialog: React.FC<PopupDialogProps> = ({
  open,
  onClose,
  title,
  content,
  icon,
  actions,
  headerActions,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = 'primary',
  isProcessing = false,
  hideCancel = false,
  maxWidth = 'sm',
}) => {
  return (
    <Dialog
      open={open}
      onClose={(_e, reason) => {
        if (reason !== 'backdropClick' && !isProcessing) {
          onClose();
        }
      }}
      maxWidth={maxWidth}
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          borderRadius: 4,
          p: 1.5,
          boxShadow: (theme: any) => theme.palette.mode === 'dark' 
            ? '0 24px 48px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)' 
            : '0 24px 48px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          background: (theme: any) => theme.palette.mode === 'dark' 
            ? 'linear-gradient(145deg, rgba(30, 30, 30, 0.95), rgba(20, 20, 20, 0.98))' 
            : 'linear-gradient(145deg, #ffffff, #fcfcfc)',
          backdropFilter: 'blur(12px)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1.5, 
        pb: 2, 
        pr: 6 // make room for close button
      }}>
        {icon && (
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 1.2, 
            borderRadius: 3, 
            bgcolor: (theme) => alpha(theme.palette[confirmColor].main, theme.palette.mode === 'dark' ? 0.2 : 0.1),
            color: `${confirmColor}.main`,
          }}>
            {icon}
          </Box>
        )}
        <Typography component="span" variant="h6" sx={{ fontWeight: 700, letterSpacing: '-0.01em', flexGrow: 1 }}>
          {title}
        </Typography>

        {headerActions && (
          <Box sx={{ mr: 4 }}>
            {headerActions}
          </Box>
        )}
        
        <IconButton 
          onClick={onClose}
          disabled={isProcessing}
          sx={{ 
            position: 'absolute', 
            right: 16, 
            top: 16,
            bgcolor: 'action.hover',
            '&:hover': { bgcolor: 'action.selected' }
          }}
        >
          <CloseRounded fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ pb: 3, pt: '0 !important' }}>
        <Box sx={{ color: 'text.secondary', lineHeight: 1.6, fontSize: '0.95rem' }}>
          {content}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        {actions ? actions : (
          <>
            {!hideCancel && (
              <Button 
                onClick={onClose} 
                disabled={isProcessing} 
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 600, 
                  color: 'text.secondary',
                  borderRadius: '10px',
                  px: 3,
                  py: 1,
                }}
              >
                {cancelText}
              </Button>
            )}
            <Button 
              onClick={onConfirm} 
              color={confirmColor} 
              variant="contained" 
              disabled={isProcessing}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 600, 
                borderRadius: '10px', 
                boxShadow: 'none',
                px: 3,
                py: 1,
              }}
            >
              {isProcessing ? 'Processing...' : confirmText}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};
