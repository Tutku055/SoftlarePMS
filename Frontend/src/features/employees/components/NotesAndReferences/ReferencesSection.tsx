import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, TextField, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardActions, Chip, Divider, IconButton,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete, Email, Phone } from '@mui/icons-material';
import { useAuthStore } from '../../../../store/useAuthStore';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import { 
  getEmployeeReferences, createEmployeeReference, updateEmployeeReference, deleteEmployeeReference 
} from '../../api/referencesApi';
import type { EmployeeReferenceDto } from '../../types';
import { ReferenceRelationship } from '../../types';

interface ReferencesSectionProps {
  employeeId: string;
}

const getRelationshipLabel = (rel: ReferenceRelationship) => {
  switch (rel) {
    case ReferenceRelationship.FormerManager: return 'Former Manager / Supervisor';
    case ReferenceRelationship.Colleague: return 'Colleague / Peer';
    case ReferenceRelationship.DirectReport: return 'Direct Report';
    case ReferenceRelationship.Client: return 'Client / Business Partner';
    case ReferenceRelationship.Academic: return 'Academic / Advisor';
    case ReferenceRelationship.Other: return 'Other';
    default: return 'Other';
  }
};

export const ReferencesSection: React.FC<ReferencesSectionProps> = ({ employeeId }) => {
  const [references, setReferences] = useState<EmployeeReferenceDto[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRef, setEditingRef] = useState<EmployeeReferenceDto | null>(null);
  
  // Popup Dialog State
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    title: string;
    content: string;
    confirmColor: 'success' | 'error' | 'warning' | 'info' | 'primary';
    onConfirm?: () => void;
    hideCancel?: boolean;
  }>({ title: '', content: '', confirmColor: 'info' });

  // Form State
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [relationship, setRelationship] = useState<ReferenceRelationship>(ReferenceRelationship.Other);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const hasPermission = useAuthStore(state => state.hasPermission);
  const canCreate = hasPermission('EmployeeReferences.Create');
  const canUpdate = hasPermission('EmployeeReferences.Update');
  const canDelete = hasPermission('EmployeeReferences.Delete');

  const fetchReferences = async () => {
    try {
      const data = await getEmployeeReferences(employeeId);
      setReferences(data);
    } catch (error) {
      console.error("Failed to fetch references", error);
    }
  };

  useEffect(() => {
    fetchReferences();
  }, [employeeId]);

  const handleOpenDialog = (ref?: EmployeeReferenceDto) => {
    if (ref) {
      setEditingRef(ref);
      setFullName(ref.fullName);
      setCompany(ref.company);
      setTitle(ref.title);
      setRelationship(ref.relationship);
      setPhoneNumber(ref.phoneNumber);
      setEmail(ref.email);
      setNotes(ref.notes || '');
    } else {
      setEditingRef(null);
      setFullName('');
      setCompany('');
      setTitle('');
      setRelationship(ReferenceRelationship.Other);
      setPhoneNumber('');
      setEmail('');
      setNotes('');
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingRef) {
        await updateEmployeeReference(employeeId, editingRef.id, {
          fullName, company, title, relationship, phoneNumber, email, notes
        });
      } else {
        await createEmployeeReference(employeeId, {
          fullName, company, title, relationship, phoneNumber, email, notes
        });
      }
      setIsDialogOpen(false);
      fetchReferences();
      
      setPopupConfig({
        title: 'Success',
        content: 'Reference saved successfully.',
        confirmColor: 'primary',
        onConfirm: () => setPopupOpen(false),
        hideCancel: true
      });
      setPopupOpen(true);
    } catch (error) {
      console.error("Failed to save reference", error);
      setPopupConfig({
        title: 'Error',
        content: 'Failed to save reference. Please check your inputs.',
        confirmColor: 'primary',
        onConfirm: () => setPopupOpen(false),
        hideCancel: true
      });
      setPopupOpen(true);
    }
  };

  const handleDeletePrompt = (refId: string) => {
    setPopupConfig({
      title: 'Delete Reference',
      content: 'Are you sure you want to delete this reference? This action cannot be undone.',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await deleteEmployeeReference(employeeId, refId);
          fetchReferences();
          setPopupOpen(false);
        } catch (error) {
          console.error("Failed to delete reference", error);
          setPopupConfig({
            title: 'Error',
            content: 'An error occurred while deleting the reference.',
            confirmColor: 'primary',
            onConfirm: () => setPopupOpen(false),
            hideCancel: true
          });
        }
      }
    });
    setPopupOpen(true);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">References</Typography>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Add Reference
          </Button>
        )}
      </Box>

      {references.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.paper', borderRadius: 2, border: '1px dashed', borderColor: 'divider' }}>
          <Typography color="text.secondary">No references found.</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {references.map((row) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={row.id}>
              <Card sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 3,
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                border: '1px solid',
                borderColor: 'divider',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }
              }}>
                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>{row.fullName}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {row.title} {row.title && row.company && ' @ '} {row.company}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 2 }}>
                    <Chip 
                      label={getRelationshipLabel(row.relationship)} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                      sx={{ fontWeight: 500, borderRadius: 1.5 }}
                    />
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Email fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{row.email || 'N/A'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Phone fontSize="small" sx={{ color: 'text.secondary' }} />
                    <Typography variant="body2">{row.phoneNumber || 'N/A'}</Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2, pt: 0 }}>
                  {canUpdate && (
                    <IconButton size="small" onClick={() => handleOpenDialog(row)} color="primary">
                      <Edit fontSize="small" />
                    </IconButton>
                  )}
                  {canDelete && (
                    <IconButton size="small" color="error" onClick={() => handleDeletePrompt(row.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit/Add Dialog */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRef ? 'Edit Reference' : 'Add Reference'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Full Name" fullWidth required slotProps={{ htmlInput: { maxLength: 100 } }} value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Company" fullWidth required slotProps={{ htmlInput: { maxLength: 200 } }} value={company} onChange={(e) => setCompany(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Title" fullWidth slotProps={{ htmlInput: { maxLength: 100 } }} value={title} onChange={(e) => setTitle(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Relationship</InputLabel>
                <Select
                  value={relationship}
                  label="Relationship"
                  onChange={(e) => setRelationship(e.target.value as ReferenceRelationship)}
                >
                  <MenuItem value={ReferenceRelationship.FormerManager}>Former Manager / Supervisor</MenuItem>
                  <MenuItem value={ReferenceRelationship.Colleague}>Colleague / Peer</MenuItem>
                  <MenuItem value={ReferenceRelationship.DirectReport}>Direct Report</MenuItem>
                  <MenuItem value={ReferenceRelationship.Client}>Client / Business Partner</MenuItem>
                  <MenuItem value={ReferenceRelationship.Academic}>Academic / Advisor</MenuItem>
                  <MenuItem value={ReferenceRelationship.Other}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Email" type="email" fullWidth slotProps={{ htmlInput: { maxLength: 150 } }} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Phone Number" fullWidth slotProps={{ htmlInput: { maxLength: 50 } }} value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />
            </Grid>
            {editingRef && (
              <Grid size={{ xs: 12 }}>
                <TextField label="Notes" fullWidth multiline rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setIsDialogOpen(false)} color="inherit">Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!fullName || !company}>Save Reference</Button>
        </DialogActions>
      </Dialog>

      {/* Global Popup Dialog */}
      <PopupDialog
        open={popupOpen}
        title={popupConfig.title}
        content={popupConfig.content}
        confirmColor={popupConfig.confirmColor}
        onClose={() => setPopupOpen(false)}
        onConfirm={popupConfig.onConfirm}
        hideCancel={popupConfig.hideCancel}
      />
    </Box>
  );
};
