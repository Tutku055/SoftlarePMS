import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, Grid, 
  Chip, IconButton, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, MenuItem, Select, FormControl, 
  InputLabel, Switch, FormControlLabel, useTheme
} from '@mui/material';
import { Add, Edit, Delete, Lock, ChevronLeft, ChevronRight } from '@mui/icons-material';
import { useAuthStore } from '../../../../store/useAuthStore';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import { 
  createEmployeeNote, updateEmployeeNote, deleteEmployeeNote, getEmployeeNotes
} from '../../api/notesApi';
import type { EmployeeNoteDto } from '../../types';
import { NoteCategory } from '../../types';

interface NotesSectionProps {
  employeeId: string;
}

export const NotesSection: React.FC<NotesSectionProps> = ({ employeeId }) => {
  const theme = useTheme();
  const [notes, setNotes] = useState<EmployeeNoteDto[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<EmployeeNoteDto[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [confidentialFilter, setConfidentialFilter] = useState<string>('All');
  
  const [page, setPage] = useState(0);
  const notesPerPage = 4;

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<EmployeeNoteDto | null>(null);
  
  // Popup Dialog State
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupConfig, setPopupConfig] = useState<{
    title: string;
    content: string;
    confirmColor: 'success' | 'error' | 'warning' | 'info' | 'primary';
    onConfirm?: () => void;
    hideCancel?: boolean;
  }>({ title: '', content: '', confirmColor: 'info' });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<NoteCategory>(NoteCategory.General);
  const [isConfidential, setIsConfidential] = useState(false);

  const hasPermission = useAuthStore(state => state.hasPermission);
  const canReadConfidential = hasPermission('EmployeeNotes.ReadConfidential');
  const canManageConfidentiality = hasPermission('EmployeeNotes.ManageConfidentiality');
  const canCreate = hasPermission('EmployeeNotes.Create');
  const canUpdate = hasPermission('EmployeeNotes.Update');
  const canDelete = hasPermission('EmployeeNotes.Delete');

  const fetchNotes = async () => {
    try {
      const data = await getEmployeeNotes(employeeId);
      setNotes(data);
    } catch (error) {
      console.error("Failed to fetch notes", error);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [employeeId]);

  useEffect(() => {
    let result = [...notes];
    
    if (categoryFilter !== 'All') {
      result = result.filter(n => n.category.toString() === categoryFilter);
    }
    
    if (confidentialFilter === 'ConfidentialOnly') {
      result = result.filter(n => n.isConfidential);
    } else if (confidentialFilter === 'NormalOnly') {
      result = result.filter(n => !n.isConfidential);
    }
    
    setFilteredNotes(result);
    setPage(0);
  }, [notes, categoryFilter, confidentialFilter]);

  const handleOpenDialog = (note?: EmployeeNoteDto) => {
    if (note) {
      setEditingNote(note);
      setTitle(note.title);
      setContent(note.content);
      setCategory(note.category);
      setIsConfidential(note.isConfidential);
    } else {
      setEditingNote(null);
      setTitle('');
      setContent('');
      setCategory(NoteCategory.General);
      setIsConfidential(false);
    }
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editingNote) {
        await updateEmployeeNote(employeeId, editingNote.id, {
          title, content, category, isConfidential
        });
      } else {
        await createEmployeeNote(employeeId, {
          title, content, category, isConfidential
        });
      }
      setIsDialogOpen(false);
      fetchNotes();

      setPopupConfig({
        title: 'Success',
        content: 'Note saved successfully.',
        confirmColor: 'primary',
        onConfirm: () => setPopupOpen(false),
        hideCancel: true
      });
      setPopupOpen(true);
    } catch (error) {
      console.error("Failed to save note", error);
      setPopupConfig({
        title: 'Error',
        content: 'Failed to save note. Ensure you have the required permissions.',
        confirmColor: 'primary',
        onConfirm: () => setPopupOpen(false),
        hideCancel: true
      });
      setPopupOpen(true);
    }
  };

  const handleDelete = (noteId: string) => {
    setPopupConfig({
      title: 'Delete Note',
      content: 'Are you sure you want to delete this note? This action cannot be undone.',
      confirmColor: 'error',
      onConfirm: async () => {
        try {
          await deleteEmployeeNote(employeeId, noteId);
          fetchNotes();
          setPopupOpen(false);
        } catch (error) {
          console.error("Failed to delete note", error);
          setPopupConfig({
            title: 'Error',
            content: 'Failed to delete note. Ensure you have the required permissions.',
            confirmColor: 'primary',
            onConfirm: () => setPopupOpen(false),
            hideCancel: true
          });
        }
      }
    });
    setPopupOpen(true);
  };

  const pageNotes = filteredNotes.slice(page * notesPerPage, (page + 1) * notesPerPage);
  const totalPages = Math.ceil(filteredNotes.length / notesPerPage);

  const getCategoryColor = (cat: NoteCategory) => {
    switch (cat) {
      case NoteCategory.General: return 'default';
      case NoteCategory.HrInternal: return 'primary';
      case NoteCategory.Performance: return 'success';
      case NoteCategory.Disciplinary: return 'error';
      case NoteCategory.InterviewAndOnboarding: return 'info';
      default: return 'default';
    }
  };

  const getCategoryName = (cat: NoteCategory) => {
    switch (cat) {
      case NoteCategory.General: return 'General';
      case NoteCategory.HrInternal: return 'HR Internal';
      case NoteCategory.Performance: return 'Performance';
      case NoteCategory.Disciplinary: return 'Disciplinary';
      case NoteCategory.InterviewAndOnboarding: return 'Interview & Onboarding';
      default: return 'Unknown';
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Notebook ({filteredNotes.length})</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={categoryFilter}
              label="Category"
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <MenuItem value="All">All Categories</MenuItem>
              <MenuItem value={NoteCategory.General.toString()}>General</MenuItem>
              <MenuItem value={NoteCategory.HrInternal.toString()}>HR Internal</MenuItem>
              <MenuItem value={NoteCategory.Performance.toString()}>Performance</MenuItem>
              <MenuItem value={NoteCategory.Disciplinary.toString()}>Disciplinary</MenuItem>
              <MenuItem value={NoteCategory.InterviewAndOnboarding.toString()}>Interview & Onboarding</MenuItem>
            </Select>
          </FormControl>
          
          {canReadConfidential && (
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Confidentiality</InputLabel>
              <Select
                value={confidentialFilter}
                label="Confidentiality"
                onChange={(e) => setConfidentialFilter(e.target.value)}
              >
                <MenuItem value="All">All Notes</MenuItem>
                <MenuItem value="NormalOnly">Normal Only</MenuItem>
                <MenuItem value="ConfidentialOnly">Confidential Only</MenuItem>
              </Select>
            </FormControl>
          )}

          {canCreate && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
              Add Note
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ 
        p: 3, 
        bgcolor: theme.palette.mode === 'dark' ? 'background.paper' : '#fdfbf7', 
        borderRadius: 2, 
        border: '1px solid', 
        borderColor: theme.palette.mode === 'dark' ? 'divider' : '#e0dcd3', 
        boxShadow: 'inset 0 0 20px rgba(0,0,0,0.02)' 
      }}>
        {pageNotes.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No notes found.</Typography>
        ) : (
          <Grid container spacing={2}>
            {pageNotes.map(note => (
              <Grid size={{ xs: 12, md: 6 }} key={note.id}>
                <Card sx={{ 
                  height: '100%', 
                  bgcolor: note.isConfidential 
                    ? (theme.palette.mode === 'dark' ? '#331515' : '#fff0f0') 
                    : (theme.palette.mode === 'dark' ? '#1e1e1e' : '#ffffff'),
                  border: '1px solid',
                  borderColor: theme.palette.mode === 'dark' ? 'divider' : '#e0dcd3',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                  position: 'relative'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {note.isConfidential && <Lock color="error" fontSize="small" />}
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', wordBreak: 'break-word' }}>
                          {note.title}
                        </Typography>
                      </Box>
                      <Box>
                        {canUpdate && (
                          <IconButton size="small" onClick={() => handleOpenDialog(note)}>
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                        {canDelete && (
                          <IconButton size="small" onClick={() => handleDelete(note.id)}>
                            <Delete fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                      {note.content}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                      <Chip 
                        label={getCategoryName(note.category)} 
                        size="small" 
                        color={getCategoryColor(note.category) as any}
                        variant="outlined"
                      />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
        
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mt: 3, gap: 2 }}>
            <IconButton onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>
              <ChevronLeft />
            </IconButton>
            <Typography variant="body2">Page {page + 1} of {totalPages}</Typography>
            <IconButton onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page === totalPages - 1}>
              <ChevronRight />
            </IconButton>
          </Box>
        )}
      </Box>

      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingNote ? 'Edit Note' : 'Add Note'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              required
              slotProps={{ htmlInput: { maxLength: 200 } }}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <FormControl fullWidth required>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                label="Category"
                onChange={(e) => setCategory(Number(e.target.value) as NoteCategory)}
              >
                <MenuItem value={NoteCategory.General}>General</MenuItem>
                <MenuItem value={NoteCategory.HrInternal}>HR Internal</MenuItem>
                <MenuItem value={NoteCategory.Performance}>Performance</MenuItem>
                <MenuItem value={NoteCategory.Disciplinary}>Disciplinary</MenuItem>
                <MenuItem value={NoteCategory.InterviewAndOnboarding}>Interview & Onboarding</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Content"
              fullWidth
              required
              multiline
              rows={4}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            {canManageConfidentiality && (
              <FormControlLabel
                control={
                  <Switch 
                    checked={isConfidential} 
                    onChange={(e) => setIsConfidential(e.target.checked)} 
                    color="error"
                  />
                }
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><Lock fontSize="small" color="error"/> Confidential Note</Box>}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!title || !content}>Save</Button>
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
