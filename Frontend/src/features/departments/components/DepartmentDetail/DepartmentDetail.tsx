import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDepartmentDetail } from '../../hooks/useDepartmentDetail';
import { useUpdateDepartment } from '../../hooks/useUpdateDepartment';
import { useDeleteDepartment } from '../../hooks/useDeleteDepartment';
import { useAuthStore } from '../../../../store/useAuthStore';
import { useEmployees } from '../../../employees/hooks/useEmployees';
import { useDocuments, useUploadDocument } from '../../../documents/hooks/useDocuments';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { DataTableColumnDef } from '../../../../components/DataTable/DataTable';
import { parseDocumentFilters } from '../../../documents/utils/filterUtils';
import { formatDateDisplay } from '../../../finance/constants/currencyConstants';
import {
  Box,
  Typography,
  Stack,
  Button,
  Avatar,
  Tabs,
  Tab,
  Divider,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  ArrowBackRounded,
  SaveRounded,
  BadgeRounded,
  PeopleAltRounded,
  FolderSharedRounded,
  BusinessRounded,
  DeleteRounded,
  WarningRounded,
  UploadFileRounded,
  CheckCircleRounded
} from '@mui/icons-material';
import { PopupDialog } from '../../../../components/PopupDialog/PopupDialog';
import styles from './DepartmentDetail.module.css';

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

export const DepartmentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);

  const { data: department, isLoading, isError } = useDepartmentDetail(id);
  const { mutate: updateDepartment, isPending: isUpdatingDepartment } = useUpdateDepartment();
  const { mutate: deleteDepartment, isPending: isDeleting } = useDeleteDepartment();

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [formState, setFormState] = useState({
    name: '',
    description: '',
  });

  const [employeePage, setEmployeePage] = useState({
    page: 0,
    pageSize: 10,
  });
  const [employeeCustomFilters, setEmployeeCustomFilters] = useState<Record<string, any>>({});

  const { data: employeesData, isLoading: isEmployeesLoading, isFetching: isEmployeesFetching } = useEmployees({
    pageNumber: employeePage.page + 1,
    pageSize: employeePage.pageSize,
    filters: [
      ...(id ? [{ field: 'departmentId', operator: 'equals', value: id }, { field: 'employmentStatus', operator: 'is', value: '1' }] : []),
      ...Object.entries(employeeCustomFilters).filter(([_, f]) => f.value).map(([field, f]) => ({
        field: field === 'fullName' ? 'firstName' : field, // Or some special handling if needed
        operator: f.operator,
        value: f.value
      }))
    ]
  });

  const [docPaginationModel, setDocPaginationModel] = useState({ page: 0, pageSize: 10 });
  const [docCustomFilters, setDocCustomFilters] = useState<Record<string, any>>({});
  
  const parsedFilters = parseDocumentFilters(docCustomFilters);

  const { data: documentData, isLoading: documentsLoading } = useDocuments({
    pageNumber: docPaginationModel.page + 1,
    pageSize: docPaginationModel.pageSize,
    referenceId: id,
    ownerModule: 2, // Department
    ...parsedFilters,
  });

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('100'); // Default: Policy

  const uploadMutation = useUploadDocument();

  const handleUploadSubmit = async () => {
    if (!selectedFile || !id) return;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('ownerModule', '2'); // 2 = Department
    formData.append('referenceId', id);
    formData.append('documentType', uploadDocType);
    await uploadMutation.mutateAsync(formData);
    setUploadOpen(false);
    setSelectedFile(null);
    setUploadDocType('100');
  };

  useEffect(() => {
    if (department) {
      setFormState({
        name: department.name || '',
        description: department.description || '',
      });
    }
  }, [department]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!id) return;
    updateDepartment({
      id: id,
      ...formState,
    });
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !department) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" color="error">Failed to load department details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/departments/list')}>Go Back</Button>
      </Box>
    );
  }

  const employeeColumns: DataTableColumnDef[] = [
    {
      field: 'employeeNo',
      headerName: 'Employee No',
      flex: 1,
      minWidth: 150,
      filterType: 'text',
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.5,
      minWidth: 200,
      filterType: 'text',
      valueGetter: (_, row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: 'profession',
      headerName: 'Profession',
      flex: 1.5,
      minWidth: 200,
      filterType: 'text',
      valueGetter: (_, row: any) => row.professionName || '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    }
  ];

  return (
    <Box className={styles.pageContainer}>
      
      {/* ── TOP ACTION BAR ────────────────────────────────────────────────── */}
      <Box className={styles.headerContainer}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Back to Departments">
            <IconButton onClick={() => navigate('/departments/list')} sx={{ bgcolor: 'action.hover' }}>
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
              Department Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
              ID: {department.id}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={1.5}>
          {hasPermission('Departments.Delete') && (
            <Button 
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="outlined" 
              color="error"
              startIcon={<DeleteRounded />} 
              sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none' }}
            >
              Delete
            </Button>
          )}
          {hasPermission('Departments.Update') && (
            <Button onClick={handleSave} disabled={isUpdatingDepartment} variant="contained" startIcon={<SaveRounded />} sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
              {isUpdatingDepartment ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </Stack>
      </Box>

      {/* ── PROFILE SUMMARY CARD ────────────────────────────────────────── */}
      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 600 }}>
            <BusinessRounded fontSize="large" />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{department.name}</Typography>
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {department.description}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Total Employees:</strong> {department.employeeCount || 0}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* ── NAVIGATION TABS ───────────────────────────────────────────────── */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' },
          }}
        >
          <Tab icon={<BadgeRounded sx={{ mr: 1 }}/>} iconPosition="start" label="General Info" />
          <Tab icon={<PeopleAltRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Employees" />
          <Tab icon={<FolderSharedRounded sx={{ mr: 1 }}/>} iconPosition="start" label={`Documents (${documentData?.totalCount || 0})`} />
        </Tabs>
      </Box>

      {/* ── TAB 1: GENERAL INFO ────────────────────── */}
      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Department Details
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField label="Department Name" name="name" value={formState.name} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField label="Description" name="description" value={formState.description} onChange={handleChange} size="small" fullWidth sx={{ ...premiumInputSx, gridColumn: '1 / -1' }} multiline rows={3} />
          </Box>
        </Box>
      </TabPanel>

      {/* ── TAB 2: EMPLOYEES ───────────────────────────────── */}
      <TabPanel value={activeTab} index={1}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Active Employees
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            This list is read-only. To manage assignments, go to the Employee module.
          </Typography>
          
          <Box 
            sx={{
              borderRadius: 4,
              overflow: 'hidden',
              backgroundColor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)',
            }}
          >
            <DataTable
              data={employeesData?.items || []}
              totalCount={employeesData?.totalCount || 0}
              loading={isEmployeesLoading || isEmployeesFetching}
              columns={employeeColumns}
              paginationModel={employeePage}
              onPaginationModelChange={setEmployeePage}
              customFilters={employeeCustomFilters}
              onCustomFilterChange={(field: string, value: string, operator: string) => {
                setEmployeeCustomFilters((prev) => ({ ...prev, [field]: { value, operator } }));
              }}
              onRowClick={(employeeId) => navigate(`/employees/${employeeId}`)}
            />
          </Box>
        </Box>
      </TabPanel>

      {/* ── TAB 3: DOCUMENTS ──────────────────────────────────────────────── */}
      <TabPanel value={activeTab} index={2}>
        <Box sx={glassPanelSx}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Department Documents</Typography>
            {hasPermission('Documents.Create') && (
              <Button variant="contained" startIcon={<UploadFileRounded />} onClick={() => setUploadOpen(true)} sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600 }}>
                Upload Document
              </Button>
            )}
          </Stack>
          <Box sx={{ borderRadius: 4, overflow: 'hidden', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)' }}>
            <DataTable
              data={documentData?.items || []}
              totalCount={documentData?.totalCount || 0}
              loading={documentsLoading}
              columns={[
                {
                  field: 'fileName',
                  headerName: 'Original File Name',
                  flex: 1.5,
                  minWidth: 200,
                  filterType: 'text',
                  renderCell: (params) => (
                    <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
                      {params.value}
                    </Typography>
                  )
                },
                {
                  field: 'extension',
                  headerName: 'Extension',
                  flex: 1,
                  minWidth: 120,
                  filterType: 'select',
                  filterOptions: [
                    { value: 'pdf', label: 'PDF' },
                    { value: 'docx', label: 'Word (.docx)' },
                    { value: 'xlsx', label: 'Excel (.xlsx)' },
                    { value: 'png', label: 'PNG' },
                    { value: 'jpeg', label: 'JPEG' },
                    { value: 'jpg', label: 'JPG' },
                    { value: 'txt', label: 'Text (.txt)' },
                  ],
                  valueGetter: (_, row: any) => {
                    if (!row?.fileName) return '';
                    const parts = row.fileName.split('.');
                    return parts.length > 1 ? parts.pop() : '';
                  },
                  renderCell: (params) => (
                    <Chip label={(params.value as string)?.toUpperCase() || 'N/A'} size="small" variant="outlined" sx={{ fontWeight: 600, maxWidth: '100%' }} />
                  )
                },
                {
                  field: 'documentType',
                  headerName: 'Type',
                  flex: 1,
                  minWidth: 150,
                  filterType: 'select',
                  filterOptions: [
                    { value: '0', label: 'Other' },
                    { value: '100', label: 'Policy' },
                    { value: '101', label: 'Budget Report' },
                    { value: '102', label: 'Org Structure' },
                    { value: '103', label: 'Compliance & Audit' },
                    { value: '104', label: 'Strategic Plan' },
                  ],
                  valueGetter: (_, row: any) => row.documentType,
                  renderCell: (params: any) => {
                    const typeLabels: Record<number, string> = {
                      100: 'Policy', 101: 'Budget Report', 102: 'Org Structure', 103: 'Compliance & Audit', 104: 'Strategic Plan', 0: 'Other'
                    };
                    return <Chip label={typeLabels[params.value as number] || 'Other'} size="small" />;
                  }
                },
                {
                  field: 'fileSizeBytes',
                  headerName: 'File Size',
                  flex: 1,
                  minWidth: 120,
                  filterType: 'fileSize',
                  filterOptions: [
                    { value: '1024', label: '1 KB' },
                    { value: '10240', label: '10 KB' },
                    { value: '102400', label: '100 KB' },
                    { value: '1048576', label: '1 MB' },
                    { value: '10485760', label: '10 MB' },
                    { value: '104857600', label: '100 MB' },
                    { value: '1073741824', label: '1 GB' },
                    { value: '10737418240', label: '10 GB' },
                    { value: '107374182400', label: '100 GB' },
                  ],
                  valueGetter: (_, row: any) => row.fileSizeBytes,
                  renderCell: (params) => {
                    const bytes = params.value as number;
                    if (!+bytes) return <Typography variant="body2" color="text.secondary">0 Bytes</Typography>;
                    const k = 1024;
                    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
                    const i = Math.floor(Math.log(bytes) / Math.log(k));
                    return (
                      <Typography variant="body2" color="text.secondary">
                        {`${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`}
                      </Typography>
                    );
                  }
                },
                {
                  field: 'createdAt',
                  headerName: 'Upload Date',
                  flex: 1,
                  minWidth: 150,
                  filterType: 'date',
                  valueGetter: (value: string | null | undefined) => value ? new Date(value) : null,
                  valueFormatter: (value: Date | null | undefined) => value ? formatDateDisplay(value) : '',
                },
                {
                  field: 'expiryDate',
                  headerName: 'Expiry Date',
                  flex: 1,
                  minWidth: 150,
                  filterType: 'date',
                  valueGetter: (_, row: any) => row.expiryDate ? new Date(row.expiryDate) : null,
                  valueFormatter: (value: Date | null | undefined) => value ? formatDateDisplay(value) : '-',
                },
                {
                  field: 'isAvailable',
                  headerName: 'Availability',
                  flex: 1,
                  minWidth: 160,
                  filterType: 'select',
                  filterOptions: [
                    { value: 'available', label: 'Available' },
                    { value: 'missing', label: 'Missing' },
                  ],
                  renderCell: (params) => {
                    const isMissing = params.value === false;
                    
                    return (
                      <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                        {isMissing ? (
                          <Tooltip title="Missing on Disk" placement="top">
                            <Chip 
                              label="Missing" 
                              size="small" 
                              color="error" 
                              variant="outlined" 
                              icon={<WarningRounded fontSize="small" />} 
                            />
                          </Tooltip>
                        ) : (
                          <Tooltip title="Available" placement="top">
                            <Chip 
                              label="Available" 
                              size="small" 
                              color="success" 
                              variant="outlined" 
                              icon={<CheckCircleRounded fontSize="small" />} 
                            />
                          </Tooltip>
                        )}
                      </Stack>
                    );
                  }
                }
              ]}
              paginationModel={docPaginationModel}
              onPaginationModelChange={setDocPaginationModel}
              customFilters={docCustomFilters}
              onCustomFilterChange={(field: string, value: string, operator: string) => {
                setDocCustomFilters((prev) => ({ ...prev, [field]: { value, operator } }));
              }}
              onRowClick={(docId: string) => navigate(`/documents/${docId}`)}
            />
          </Box>
        </Box>
      </TabPanel>

      <PopupDialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        title="Delete Department"
        icon={<WarningRounded color="error" />}
        confirmColor="error"
        confirmText="Delete"
        isProcessing={isDeleting}
        onConfirm={() => {
          if (id) {
            deleteDepartment(id, {
              onSuccess: () => {
                setIsDeleteDialogOpen(false);
                navigate('/departments/list');
              },
              onError: (_error: any) => {
                setIsDeleteDialogOpen(false);
                setSnackbarMessage(`You can't delete ${department.name} Department`);
                setSnackbarSeverity('error');
                setSnackbarOpen(true);
              }
            });
          }
        }}
        content={
          <>
            Are you sure you want to delete the <strong>{department.name}</strong> department? 
            This action cannot be undone. If there are any employees assigned to this department, the deletion will be rejected.
          </>
        }
      />

      <Snackbar 
        open={snackbarOpen} 
        autoHideDuration={6000} 
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%', fontWeight: 500 }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Department Document</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select value={uploadDocType} label="Document Type" onChange={(e) => setUploadDocType(e.target.value)}>
                <MenuItem value="100">Policy</MenuItem>
                <MenuItem value="101">Budget Report</MenuItem>
                <MenuItem value="102">Org Structure</MenuItem>
                <MenuItem value="103">Compliance & Audit</MenuItem>
                <MenuItem value="104">Strategic Plan</MenuItem>
                <MenuItem value="0">Other</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" component="label" fullWidth>
              {selectedFile ? selectedFile.name : 'Select File'}
              <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadSubmit} disabled={!selectedFile || uploadMutation.isPending}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
