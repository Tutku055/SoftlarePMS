import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentDetail } from '../../hooks/useDocumentDetail';
import { useUpdateDocument } from '../../hooks/useUpdateDocument';
import { useDeleteDocument } from '../../hooks/useDocuments';
import { documentsApi } from '../../api/documentsApi';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useBreadcrumbTitle } from '../../../../store/useBreadcrumbStore';
import { formatDateDisplay } from '../../../../utils/dateUtils';;


import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  Chip,
  Tabs,
  Tab,
  Divider,
  TextField,
  MenuItem,
  IconButton,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  ArrowBackRounded,
  SaveRounded,
  BadgeRounded,
  FolderSharedRounded,
  DownloadRounded,
  WarningRounded,
  DeleteForeverRounded,
} from '@mui/icons-material';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import styles from './DocumentDetail.module.css';

// Premium Theme Objects (Matching EmployeeDetail)
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

const actionButtonSx = {
  borderRadius: '10px',
  borderColor: 'rgba(128, 128, 128, 0.25)',
  color: 'text.primary',
  fontWeight: 500,
  textTransform: 'none',
  backgroundColor: 'transparent',
  transition: 'all 0.2s ease',
  '&:hover': {
    backgroundColor: 'rgba(128, 128, 128, 0.06)',
    borderColor: 'rgba(128, 128, 128, 0.5)',
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

export const DocumentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: document, isLoading, isError, refetch } = useDocumentDetail(id);
  useBreadcrumbTitle(document?.fileName || null);
  const { mutate: updateDocument, isPending: isUpdating } = useUpdateDocument();

  const [formState, setFormState] = useState({
    fileName: '',
    documentType: 0,
    issueDate: '',
    expiryDate: '',
  });

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canDelete = hasPermission('Documents.Delete');
  const { mutate: deleteDocument, isPending: isDeleting } = useDeleteDocument();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [missingFilePopupOpen, setMissingFilePopupOpen] = useState(false);
  const [missingFileName, setMissingFileName] = useState('');

  const ext = document?.fileName.split('.').pop() || '';

  const parseDateUTC = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString.endsWith('Z') ? dateString : dateString + 'Z');
  };

  useEffect(() => {
    if (document) {
      setFormState({
        fileName: document.fileName ? document.fileName.replace(`.${document.fileName.split('.').pop()}`, '') : '',
        documentType: document.documentType || 0,
        issueDate: document.issueDate ? document.issueDate.split('T')[0] : '',
        expiryDate: document.expiryDate ? document.expiryDate.split('T')[0] : '',
      });
    }
  }, [document]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!id) return;
    updateDocument({
      id,
      fileName: `${formState.fileName}.${ext}`,
      documentType: formState.documentType,
      issueDate: formState.issueDate || null,
      expiryDate: formState.expiryDate || null,
    });
  };

  const handleDownload = async () => {
    if (!id || !document) return;
    try {
      await documentsApi.downloadDocument(id, document.fileName);
    } catch (error: any) {
      if (error.message === 'FILE_NOT_FOUND') {
        setMissingFileName(document.fileName);
        setMissingFilePopupOpen(true);
      }
    } finally {
      refetch();
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !document) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" color="error">Failed to load document details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/documents/archive')}>Go Back</Button>
      </Box>
    );
  }

  const documentTypes = [
    { value: 0, label: 'Other' },
    { value: 1, label: 'Identification' },
    { value: 2, label: 'Contract' },
    { value: 3, label: 'Health Record' },
    { value: 4, label: 'Certificate' },
    { value: 5, label: 'Resume' },
    { value: 6, label: 'Background Check' },
    { value: 7, label: 'Performance Review' },
    { value: 8, label: 'Payroll & Tax' },
    { value: 9, label: 'Offboarding' },
    { value: 100, label: 'Policy' },
    { value: 101, label: 'Budget Report' },
    { value: 102, label: 'Org Structure' },
    { value: 103, label: 'Compliance & Audit' },
    { value: 104, label: 'Strategic Plan' },
  ];

  const getExtension = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'FILE';
    return ext.length > 4 ? ext.substring(0, 4) : ext;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box className={styles.pageContainer}>
      <Box className={styles.headerContainer}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Back to Archive">
            <IconButton onClick={() => navigate('/documents/archive')} sx={{ bgcolor: 'action.hover' }}>
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
              Document Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {document.id}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          {canDelete && (
            <Button
              onClick={() => setDeleteDialogOpen(true)}
              variant="outlined"
              color="error"
              startIcon={<DeleteForeverRounded />}
              disabled={isDeleting}
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: (theme) => theme.palette.error.main,
                color: (theme) => theme.palette.error.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(244, 67, 54, 0.12)' : 'rgba(244, 67, 54, 0.04)',
                  borderColor: (theme) => theme.palette.error.dark,
                }
              }}
            >
              Delete File
            </Button>
          )}
          <Button 
            onClick={handleDownload} 
            variant="outlined" 
            color="primary" 
            startIcon={<DownloadRounded />} 
            disabled={document.isAvailable === false}
            sx={actionButtonSx}
          >
            Download File
          </Button>
          <Button onClick={handleSave} disabled={isUpdating || !hasPermission('Documents.Update')} variant="contained" startIcon={<SaveRounded />} sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
            {isUpdating ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: 'secondary.main', fontSize: '1.5rem', fontWeight: 600 }}>
            {getExtension(document.fileName)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {document.fileName}
              </Typography>
              <Stack direction="row" spacing={1}>
                {document.isAvailable === false && (
                  <Chip 
                    label="Missing on Disk" 
                    size="small" 
                    color="error" 
                    variant="outlined"
                    icon={<WarningRounded fontSize="small" />}
                    sx={{ fontWeight: 600 }}
                  />
                )}
                <Chip 
                  label={formatBytes(document.fileSizeBytes)} 
                  size="small" 
                  sx={{ 
                    fontWeight: 600, 
                    bgcolor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  }} 
                />
              </Stack>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {documentTypes.find(t => t.value === document.documentType)?.label || 'Other'} Document
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Uploaded On:</strong> {formatDateDisplay(parseDateUTC(document.createdAt))}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Reference ID:</strong> {document.referenceId}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={(_, val) => setActiveTab(val)}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' },
          }}
        >
          <Tab icon={<BadgeRounded sx={{ mr: 1 }}/>} iconPosition="start" label="General Info" />
          <Tab icon={<FolderSharedRounded sx={{ mr: 1 }}/>} iconPosition="start" label="File Details" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Document Metadata
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField 
              label="File Name" 
              name="fileName" 
              value={formState.fileName} 
              onChange={handleChange} 
              size="small" 
              fullWidth 
              sx={premiumInputSx} 
              slotProps={{
                input: {
                  endAdornment: ext ? <Typography variant="body2" color="text.secondary" sx={{ ml: 1, userSelect: 'none' }}>.{ext}</Typography> : null
                }
              }}
            />
            <TextField select label="Document Type" name="documentType" value={formState.documentType} onChange={handleChange} size="small" fullWidth sx={premiumInputSx}>
              {documentTypes.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField label="Issue Date" name="issueDate" type="date" value={formState.issueDate} onChange={handleChange} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={premiumInputSx} />
            <TextField label="Expiry Date" name="expiryDate" type="date" value={formState.expiryDate} onChange={handleChange} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={premiumInputSx} />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box className={styles.actionCardsGrid}>
          <Box sx={{ ...glassPanelSx, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Storage Information</Typography>
              <Typography variant="body2" color="text.secondary">System storage path and metadata.</Typography>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Stack spacing={2}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Owner Module</Typography>
                <TextField 
                  value={document.ownerModule === 1 ? 'Employee' : document.ownerModule === 2 ? 'Department' : 'Other'} 
                  fullWidth 
                  size="small"
                  slotProps={{
                    input: {
                      readOnly: true,
                      startAdornment: <BadgeRounded color="action" sx={{ mr: 1 }} />
                    }
                  }}
                  sx={{ mt: 1, ...premiumInputSx }} 
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Last Checked</Typography>
                <TextField 
                  value={document.lastCheckedAt ? formatDateDisplay(parseDateUTC(document.lastCheckedAt)) : 'Not Checked'} 
                  fullWidth 
                  size="small"
                  slotProps={{
                    input: {
                      readOnly: true,
                      startAdornment: <WarningRounded color="action" sx={{ mr: 1 }} />
                    }
                  }}
                  sx={{ mt: 1, ...premiumInputSx }} 
                />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Associated Record</Typography>
                <Box sx={{ mt: 1 }}>
                  <Button 
                    variant="outlined" 
                    onClick={() => {
                      if (document.ownerModule === 1) navigate(`/employees/${document.referenceId}`);
                      if (document.ownerModule === 2) navigate(`/departments/${document.referenceId}`);
                    }} 
                    disabled={document.ownerModule !== 1 && document.ownerModule !== 2}
                    startIcon={<FolderSharedRounded />} 
                    sx={actionButtonSx}
                  >
                    Open Record
                  </Button>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>
      </TabPanel>

      <PopupDialog
        open={missingFilePopupOpen}
        title="File Not Found"
        content={`The file "${missingFileName}" could not be found on the disk. It may have been physically deleted or moved.`}
        onClose={() => setMissingFilePopupOpen(false)}
        onConfirm={() => setMissingFilePopupOpen(false)}
        confirmText="OK"
        cancelText="Close"
      />

      <PopupDialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete Document Permanently"
        icon={<DeleteForeverRounded />}
        confirmText="Permanently Delete"
        cancelText="Cancel"
        confirmColor="error"
        isProcessing={isDeleting}
        onConfirm={() => {
          if (!id) return;
          deleteDocument(id, {
            onSuccess: () => {
              setDeleteDialogOpen(false);
              navigate('/documents/archive');
            },
          });
        }}
        content={
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{document?.fileName}</strong>? This action will physically delete the file from storage disk and permanently remove its metadata record from the database. This operation cannot be undone.
          </Typography>
        }
      />
    </Box>
  );
};
