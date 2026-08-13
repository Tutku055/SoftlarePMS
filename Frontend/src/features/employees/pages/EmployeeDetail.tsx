// EmployeeDetail.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEmployeeDetail } from '../hooks/useEmployeeDetail';
import { useUpdateEmployee } from '../hooks/useUpdateEmployee';
import { useUpdateEmployeeAddressMutation } from '../hooks/useEmployeeAddresses';
import { useDepartments } from '../hooks/useDepartments';
import { useProfessionsLookup } from '../../professions';;
import { useDocuments } from '../../documents/hooks/useDocuments';
import { useAuthStore } from '../../../store/useAuthStore';
import { useBreadcrumbTitle } from '../../../store/useBreadcrumbStore';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { documentsApi } from '../../documents/api/documentsApi';
import type { GridPaginationModel } from '@mui/x-data-grid';
import { DataTable } from '../../../components/DataTable/DataTable';
import type { CustomFilterValue } from '../../../components/DataTable/DataTable';
import { parseDocumentFilters } from '../../documents/utils/filterUtils';
import { PopupDialog } from '../../../components/PopupDialog/PopupDialog';
import { NotesAndReferences } from '../components/NotesAndReferences/NotesAndReferences';
import { CompensationModal } from '../components/Compensation/CompensationModal';
import { getCurrencyCode } from '../../finance';;
import { formatDateDisplay } from '../../../utils/dateUtils';;

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
} from '@mui/material';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowBackRounded,
  SaveRounded,
  PersonRemoveRounded,
  BadgeRounded,
  AccountBalanceWalletRounded,
  FolderSharedRounded,
  ContactsRounded,
  UploadFileRounded,
  WarningRounded,
  CheckCircleRounded,
  LocationOnRounded,
  LocationOffRounded,
  HomeRounded,
  ContactMailRounded,
} from '@mui/icons-material';
import styles from './EmployeeDetail.module.css';


// .glassPanel sınıfının birebir sx karşılığı[cite: 9]
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

// .premiumInput sınıfının birebir sx karşılığı[cite: 9]
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

// .actionButton sınıfının birebir sx karşılığı[cite: 9]
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

export const EmployeeDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const { data: employee, isLoading, isError } = useEmployeeDetail(id);
  useBreadcrumbTitle(employee ? `${employee.firstName} ${employee.lastName}`.trim() : null);
  const { mutate: updateEmployee, isPending: isUpdatingEmployee } = useUpdateEmployee();
  const { mutate: updateAddressMutation, isPending: isUpdatingAddress } = useUpdateEmployeeAddressMutation();
  const { data: deptData } = useDepartments();
  const departmentOptions = deptData?.items.map((d: any) => ({ value: d.id, label: d.name })) || [];
  const { data: professions } = useProfessionsLookup();

  const [formState, setFormState] = useState({
    firstName: '',
    lastName: '',
    email: '',
    gender: 0,
    dateOfBirth: '',
    nationality: '',
    professionId: '',
    employmentStatus: 1,
    hireDate: '',
    probationEndDate: '',
    workingHoursPerWeek: 0,
    annualVacationDays: 0,
    carriedOverLeaves: 0,
    departmentId: '',
  });

  const [primaryAddressState, setPrimaryAddressState] = useState({
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const [secondaryAddressState, setSecondaryAddressState] = useState({
    addressLine: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const activePrimary = employee?.addresses?.find(
    (a) => a.isPrimary && (!a.endDate || new Date(a.endDate) >= today)
  );
  const activeSecondary = employee?.addresses?.find(
    (a) => !a.isPrimary && (!a.endDate || new Date(a.endDate) >= today)
  );
  const hasAnyActiveAddress = Boolean(activePrimary || activeSecondary);

  const formatAddressDate = (dateStr: string | null | undefined): string => {
    if (!dateStr || dateStr.startsWith('0001')) {
      return formatDateDisplay(new Date());
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1970) {
      return formatDateDisplay(new Date());
    }
    return formatDateDisplay(d);
  };

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [customFilters, setCustomFilters] = useState<Record<string, CustomFilterValue>>({});

  const parsedFilters = parseDocumentFilters(customFilters);

  const { data: documentData, isLoading: documentsLoading } = useDocuments({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    referenceId: id,
    ownerModule: 1, // Employee
    ...parsedFilters,
  });
  const documentCount = documentData?.totalCount || 0;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadDocType, setUploadDocType] = useState('1'); // Default: Identification
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploadingChunk, setIsUploadingChunk] = useState(false);
  const [errorDialog, setErrorDialog] = useState({ open: false, title: '', message: '' });
  
  const [isCompensationModalOpen, setIsCompensationModalOpen] = useState(false);
  
  const queryClient = useQueryClient();

  const handleUploadSubmit = async () => {
    if (!selectedFile || !id) return;
    setIsUploadingChunk(true);
    setUploadProgress(0);

    const chunkSize = 1024 * 1024 * 2; // 2MB
    const totalChunks = Math.ceil(selectedFile.size / chunkSize);
    const uploadId = crypto.randomUUID();

    try {
      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, selectedFile.size);
        const chunk = selectedFile.slice(start, end);
        
        const formData = new FormData();
        formData.append('file', chunk, selectedFile.name);
        formData.append('uploadId', uploadId);
        formData.append('chunkIndex', i.toString());
        formData.append('totalChunks', totalChunks.toString());
        formData.append('fileName', selectedFile.name);
        formData.append('ownerModule', '1'); // 1 = Employee
        formData.append('referenceId', id);
        formData.append('documentType', uploadDocType);

        await documentsApi.uploadDocumentChunk(formData);
        setUploadProgress(Math.round(((i + 1) / totalChunks) * 100));
      }
      
      await queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadOpen(false);
      setSelectedFile(null);
      setUploadDocType('1');
    } catch (err: any) {
      setErrorDialog({
        open: true,
        title: 'Upload Failed',
        message: err?.response?.data?.detail || err?.message || 'An error occurred during file upload.'
      });
    } finally {
      setIsUploadingChunk(false);
      setUploadProgress(0);
    }
  };

  useEffect(() => {
    if (employee) {
      setFormState({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        email: employee.email || '',
        gender: employee.gender ?? 0,
        dateOfBirth: employee.dateOfBirth?.split('T')[0] || '',
        nationality: employee.nationality || '',
        professionId: employee.professionId || '',
        employmentStatus: employee.employmentStatus || 1,
        hireDate: employee.hireDate?.split('T')[0] || '',
        probationEndDate: employee.probationEndDate?.split('T')[0] || '',
        workingHoursPerWeek: employee.workingHoursPerWeek || 0,
        annualVacationDays: employee.annualVacationDays || 0,
        carriedOverLeaves: employee.carriedOverLeaves || 0,
        departmentId: employee.department?.id || '',
      });

      const todayDate = new Date();
      todayDate.setHours(0, 0, 0, 0);

      const curPrimary = employee.addresses?.find(
        (a) => a.isPrimary && (!a.endDate || new Date(a.endDate) >= todayDate)
      );
      if (curPrimary) {
        setPrimaryAddressState({
          addressLine: curPrimary.addressLine || '',
          city: curPrimary.city || '',
          state: curPrimary.state || '',
          postalCode: curPrimary.postalCode || '',
          country: curPrimary.country || '',
        });
      } else {
        setPrimaryAddressState({
          addressLine: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        });
      }

      const curSecondary = employee.addresses?.find(
        (a) => !a.isPrimary && (!a.endDate || new Date(a.endDate) >= todayDate)
      );
      if (curSecondary) {
        setSecondaryAddressState({
          addressLine: curSecondary.addressLine || '',
          city: curSecondary.city || '',
          state: curSecondary.state || '',
          postalCode: curSecondary.postalCode || '',
          country: curSecondary.country || '',
        });
      } else {
        setSecondaryAddressState({
          addressLine: '',
          city: '',
          state: '',
          postalCode: '',
          country: '',
        });
      }
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormState({ ...formState, [e.target.name]: e.target.value });
  };
  
  const handlePrimaryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrimaryAddressState({ ...primaryAddressState, [e.target.name]: e.target.value });
  };

  const handleSecondaryAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSecondaryAddressState({ ...secondaryAddressState, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (!id) return;
    const { hireDate, ...restFormState } = formState;
    updateEmployee({
      employeeId: id,
      ...restFormState,
      departmentId: restFormState.departmentId || null,
      probationEndDate: restFormState.probationEndDate || null,
      workingHoursPerWeek: Number(restFormState.workingHoursPerWeek),
      annualVacationDays: Number(restFormState.annualVacationDays),
      carriedOverLeaves: Number(restFormState.carriedOverLeaves),
    });

    if (activePrimary && primaryAddressState.addressLine) {
      updateAddressMutation({
        employeeId: id,
        id: activePrimary.id,
        dto: {
          addressLine: primaryAddressState.addressLine,
          city: primaryAddressState.city,
          state: primaryAddressState.state,
          postalCode: primaryAddressState.postalCode,
          country: primaryAddressState.country,
          startDate: activePrimary.startDate,
          endDate: activePrimary.endDate,
          isPrimary: true,
        },
      });
    }

    if (activeSecondary && secondaryAddressState.addressLine) {
      updateAddressMutation({
        employeeId: id,
        id: activeSecondary.id,
        dto: {
          addressLine: secondaryAddressState.addressLine,
          city: secondaryAddressState.city,
          state: secondaryAddressState.state,
          postalCode: secondaryAddressState.postalCode,
          country: secondaryAddressState.country,
          startDate: activeSecondary.startDate,
          endDate: activeSecondary.endDate,
          isPrimary: false,
        },
      });
    }
  };

  const handleTerminate = () => {
    if (!id) return;
    setFormState(prev => ({ ...prev, employmentStatus: 3 }));
    const { hireDate, ...restFormState } = formState;
    updateEmployee({
      employeeId: id,
      ...restFormState,
      employmentStatus: 3,
      departmentId: restFormState.departmentId || null,
      probationEndDate: restFormState.probationEndDate || null,
      workingHoursPerWeek: Number(restFormState.workingHoursPerWeek),
      annualVacationDays: Number(restFormState.annualVacationDays),
      carriedOverLeaves: Number(restFormState.carriedOverLeaves),
    });
  };

  const genders = [{ value: 0, label: 'Unspecified' }, { value: 1, label: 'Male' }, { value: 2, label: 'Female' }];
  const statuses = [{ value: 1, label: 'Active' }, { value: 2, label: 'On Leave' }, { value: 3, label: 'Terminated' }];

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

  if (isError || !employee) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: 2 }}>
        <Typography variant="h6" color="error">Failed to load employee details.</Typography>
        <Button variant="outlined" onClick={() => navigate('/employees/roster')}>Go Back</Button>
      </Box>
    );
  }

  const getStatusProps = (status: number) => {
    switch(status) {
      case 1:
        return {
          label: 'Active',
          color: (theme: any) => theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32',
          bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
          border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(46, 125, 50, 0.15)'
        };
      case 2:
        return {
          label: 'On Leave',
          color: (theme: any) => theme.palette.mode === 'dark' ? '#ffb74d' : '#ed6c02',
          bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.08)',
          border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 183, 77, 0.2)' : 'rgba(237, 108, 2, 0.15)'
        };
      case 3:
        return {
          label: 'Terminated',
          color: (theme: any) => theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f',
          bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
          border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(229, 115, 115, 0.2)' : 'rgba(211, 47, 47, 0.15)'
        };
      default:
        return { label: 'Unknown', color: 'text.secondary', bg: 'transparent', border: 'divider' };
    }
  };

  const statusProps = getStatusProps(employee.employmentStatus);

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="Employee Profile"
        subtitle={`ID: ${employee.id} | ${employee.firstName} ${employee.lastName}`}
        icon={<BadgeRounded />}
        actions={
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Tooltip title="Back to Roster">
              <IconButton onClick={() => navigate('/employees/roster')} sx={{ bgcolor: 'action.hover' }}>
                <ArrowBackRounded />
              </IconButton>
            </Tooltip>
            {hasPermission('Employees.Update') && (
              <>
                <Button onClick={handleTerminate} disabled={isUpdatingEmployee || isUpdatingAddress || formState.employmentStatus === 3} variant="outlined" color="error" startIcon={<PersonRemoveRounded />} sx={actionButtonSx}>
                  {formState.employmentStatus === 3 ? 'Terminated' : 'Terminate'}
                </Button>
                <Button onClick={handleSave} disabled={isUpdatingEmployee || isUpdatingAddress} variant="contained" startIcon={<SaveRounded />} sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', boxShadow: 'none' }}>
                  {isUpdatingEmployee || isUpdatingAddress ? 'Saving...' : 'Save Changes'}
                </Button>
              </>
            )}
          </Stack>
        }
      />

      <Box sx={glassPanelSx}>
        <Box className={styles.profileSummaryGrid}>
          <Avatar sx={{ width: 84, height: 84, bgcolor: 'primary.main', fontSize: '2rem', fontWeight: 600 }}>
            {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Stack direction="row" spacing={2} sx={{ mb: 0.5, alignItems: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{employee.firstName} {employee.lastName}</Typography>
              <Chip 
                label={statusProps.label} 
                size="small" 
                sx={{ 
                  fontWeight: 600, 
                  bgcolor: statusProps.bg, 
                  color: statusProps.color,
                  border: '1px solid',
                  borderColor: statusProps.border
                }} 
              />
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500, mb: 1 }}>
              {employee.professionName} • {employee.employeeNo} {employee.department ? `• ${employee.department.name}` : ''}
            </Typography>
            <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
              <Typography variant="caption" color="text.secondary">
                <strong>Hire Date:</strong> {formatDateDisplay(employee.hireDate)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Probation Ends:</strong> {employee.probationEndDate ? formatDateDisplay(employee.probationEndDate) : 'N/A'}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                <strong>Nationality:</strong> {employee.nationality}
              </Typography>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
        <Tabs 
          value={activeTab} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: '0.95rem', minHeight: '48px' },
          }}
        >
          <Tab icon={<BadgeRounded sx={{ mr: 1 }}/>} iconPosition="start" label="General Info" />
          <Tab icon={<AccountBalanceWalletRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Financial & Compensation" />
          <Tab icon={<FolderSharedRounded sx={{ mr: 1 }}/>} iconPosition="start" label={`Documents (${documentCount})`} />
          <Tab icon={<ContactsRounded sx={{ mr: 1 }}/>} iconPosition="start" label="Notes & References" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Box sx={glassPanelSx}>
          <Typography variant="h6" className={styles.sectionTitle}>
            Personal Details
          </Typography>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />
          
          <Box className={styles.formGrid}>
            <TextField label="Employee No" value={employee.employeeNo} size="small" fullWidth sx={premiumInputSx} disabled />
            <TextField label="First Name" name="firstName" value={formState.firstName} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField label="Last Name" name="lastName" value={formState.lastName} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField label="Email" name="email" type="email" value={formState.email} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField select label="Gender" name="gender" value={formState.gender} onChange={handleChange} size="small" fullWidth sx={premiumInputSx}>
              {genders.map((g) => <MenuItem key={g.value} value={g.value}>{g.label}</MenuItem>)}
            </TextField>
            <TextField label="Date of Birth" name="dateOfBirth" type="date" value={formState.dateOfBirth} onChange={handleChange} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={premiumInputSx} />
            <TextField label="Nationality" name="nationality" value={formState.nationality} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField select label="Profession" name="professionId" value={formState.professionId} onChange={handleChange} size="small" fullWidth sx={premiumInputSx}>
              <MenuItem value=""><em>None</em></MenuItem>
              {professions?.map((p: any) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
              {formState.professionId && !professions?.some((p: any) => p.id === formState.professionId) && (
                <MenuItem value={formState.professionId} sx={{ display: 'none' }}>Loading...</MenuItem>
              )}
            </TextField>
            <TextField select label="Employment Status" name="employmentStatus" value={formState.employmentStatus} onChange={handleChange} size="small" fullWidth sx={premiumInputSx}>
              {statuses.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
            <TextField label="Hire Date" name="hireDate" type="date" value={formState.hireDate} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={premiumInputSx} disabled />
            <TextField label="Probation End Date" name="probationEndDate" type="date" value={formState.probationEndDate} onChange={handleChange} size="small" fullWidth slotProps={{ inputLabel: { shrink: true } }} sx={premiumInputSx} />
            <TextField label="Working Hours / Week" name="workingHoursPerWeek" type="number" value={formState.workingHoursPerWeek} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField label="Annual Vacation Days" name="annualVacationDays" type="number" value={formState.annualVacationDays} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField label="Carried Over Leaves" name="carriedOverLeaves" type="number" value={formState.carriedOverLeaves} onChange={handleChange} size="small" fullWidth sx={premiumInputSx} />
            <TextField select label="Department" name="departmentId" value={formState.departmentId} onChange={handleChange} size="small" fullWidth sx={premiumInputSx}>
              <MenuItem value=""><em>None</em></MenuItem>
              {departmentOptions.map((d: any) => <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>)}
              {formState.departmentId && !departmentOptions.some((d: any) => d.value === formState.departmentId) && (
                <MenuItem value={formState.departmentId} sx={{ display: 'none' }}>Loading...</MenuItem>
              )}
            </TextField>
          </Box>
        </Box>

        {/* Active Addresses Section */}
        <Box sx={{ mt: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnRounded color="primary" />
              <Typography variant="h6" className={styles.sectionTitle}>
                Active Addresses
              </Typography>
            </Box>
            {hasPermission('EmployeeAddresses.Read') && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<LocationOnRounded />}
                onClick={() => navigate(`/employees/addresses/${employee.id}`)}
                sx={{
                  borderRadius: '8px',
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                }}
              >
                Manage & History
              </Button>
            )}
          </Box>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          {!hasAnyActiveAddress ? (
            <Box
              sx={{
                ...glassPanelSx,
                p: 4,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <LocationOffRounded sx={{ fontSize: 44, color: 'text.secondary', opacity: 0.6 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                No Active Address Registered
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 460 }}>
                This employee does not have any active primary or secondary address assigned. Historical records can be managed and reactivated in the Addresses tab.
              </Typography>
              {hasPermission('EmployeeAddresses.Read') && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => navigate(`/employees/addresses/${employee.id}`)}
                  sx={{ mt: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                  Manage Addresses
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* Active Primary Address */}
              {activePrimary && (
                <Box sx={glassPanelSx}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<HomeRounded style={{ fontSize: 16 }} />}
                      label="Active Primary Address"
                      size="small"
                      color="primary"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Active since: {formatAddressDate(activePrimary.startDate)}
                    </Typography>
                  </Stack>
                  <Box className={styles.formGrid}>
                    <TextField
                      label="Address Line"
                      name="addressLine"
                      value={primaryAddressState.addressLine}
                      onChange={handlePrimaryAddressChange}
                      size="small"
                      fullWidth
                      sx={{ ...premiumInputSx, gridColumn: '1 / -1' }}
                    />
                    <TextField
                      label="City"
                      name="city"
                      value={primaryAddressState.city}
                      onChange={handlePrimaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="State / Province"
                      name="state"
                      value={primaryAddressState.state}
                      onChange={handlePrimaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="Postal Code"
                      name="postalCode"
                      value={primaryAddressState.postalCode}
                      onChange={handlePrimaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="Country"
                      name="country"
                      value={primaryAddressState.country}
                      onChange={handlePrimaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                  </Box>
                </Box>
              )}

              {/* Active Secondary Address */}
              {activeSecondary && (
                <Box sx={glassPanelSx}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 2 }}>
                    <Chip
                      icon={<ContactMailRounded style={{ fontSize: 16 }} />}
                      label="Active Secondary Address"
                      size="small"
                      color="info"
                      sx={{ fontWeight: 600 }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      Active since: {formatAddressDate(activeSecondary.startDate)}
                    </Typography>
                  </Stack>
                  <Box className={styles.formGrid}>
                    <TextField
                      label="Address Line"
                      name="addressLine"
                      value={secondaryAddressState.addressLine}
                      onChange={handleSecondaryAddressChange}
                      size="small"
                      fullWidth
                      sx={{ ...premiumInputSx, gridColumn: '1 / -1' }}
                    />
                    <TextField
                      label="City"
                      name="city"
                      value={secondaryAddressState.city}
                      onChange={handleSecondaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="State / Province"
                      name="state"
                      value={secondaryAddressState.state}
                      onChange={handleSecondaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="Postal Code"
                      name="postalCode"
                      value={secondaryAddressState.postalCode}
                      onChange={handleSecondaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                    <TextField
                      label="Country"
                      name="country"
                      value={secondaryAddressState.country}
                      onChange={handleSecondaryAddressChange}
                      size="small"
                      fullWidth
                      sx={premiumInputSx}
                    />
                  </Box>
                </Box>
              )}
            </Stack>
          )}
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box className={styles.actionCardsGrid}>
          <Box sx={{ ...glassPanelSx, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Compensation History</Typography>
              <Typography variant="body2" color="text.secondary">Manage pay grades, base salary, and effective dates.</Typography>
            </Box>
            <Divider sx={{ opacity: 0.5 }} />
            <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Current Base Salary</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'success.main' }}>
                  {employee.compensation 
                    ? `${employee.compensation.baseSalary} ${getCurrencyCode(employee.compensation.currency)}`
                    : 'Not Set'}
                </Typography>
              </Box>
            </Stack>

            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Full compensation history and payroll settings have been moved to the Payroll Details section.
              </Typography>
              <Button 
                variant="outlined" 
                color="primary" 
                onClick={() => navigate(`/finance/payrolls/${employee.id}?tab=1`)}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
              >
                View Full Compensation History & Settings
              </Button>
            </Box>
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Box sx={glassPanelSx}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Employee Documents</Typography>
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
                    { value: '1', label: 'Identification' },
                    { value: '2', label: 'Contract' },
                    { value: '3', label: 'Health Record' },
                    { value: '4', label: 'Certificate' },
                    { value: '5', label: 'Resume' },
                    { value: '6', label: 'Background Check' },
                    { value: '7', label: 'Performance Review' },
                    { value: '8', label: 'Payroll And Tax' },
                    { value: '9', label: 'Offboarding' },
                  ],
                  valueGetter: (_, row: any) => row.documentType,
                  renderCell: (params: any) => {
                    const typeLabels: Record<number, string> = {
                      0: 'Other', 1: 'Identification', 2: 'Contract', 3: 'Health Record', 4: 'Certificate',
                      5: 'Resume', 6: 'Background Check', 7: 'Performance Review', 8: 'Payroll And Tax', 9: 'Offboarding'
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
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              customFilters={customFilters}
              onCustomFilterChange={(field: string, value: string, operator: string) => {
                setCustomFilters((prev) => ({ ...prev, [field]: { value, operator } }));
              }}
              onRowClick={(id: string) => navigate(`/documents/${id}`)}
            />
          </Box>
        </Box>
      </TabPanel>

      <TabPanel value={activeTab} index={3}>
        {id && <NotesAndReferences employeeId={id} />}
      </TabPanel>

      <Dialog open={uploadOpen} onClose={() => setUploadOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Employee Document</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Document Type</InputLabel>
              <Select value={uploadDocType} label="Document Type" onChange={(e) => setUploadDocType(e.target.value)} disabled={isUploadingChunk}>
                <MenuItem value="1">Identification</MenuItem>
                <MenuItem value="2">Contract</MenuItem>
                <MenuItem value="3">Health Record</MenuItem>
                <MenuItem value="4">Certificate</MenuItem>
                <MenuItem value="5">Resume</MenuItem>
                <MenuItem value="6">Background Check</MenuItem>
                <MenuItem value="7">Performance Review</MenuItem>
                <MenuItem value="8">Payroll & Tax</MenuItem>
                <MenuItem value="9">Offboarding</MenuItem>
                <MenuItem value="0">Other</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" component="label" fullWidth disabled={isUploadingChunk}>
              {selectedFile ? selectedFile.name : 'Select File'}
              <input type="file" hidden onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} />
            </Button>
            {isUploadingChunk && (
              <Box sx={{ width: '100%' }}>
                <Stack direction="row" sx={{ justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Uploading...</Typography>
                  <Typography variant="body2" color="text.secondary">{uploadProgress}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 1, height: 8 }} />
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setUploadOpen(false)} disabled={isUploadingChunk}>Cancel</Button>
          <Button variant="contained" onClick={handleUploadSubmit} disabled={!selectedFile || isUploadingChunk}>
            Upload
          </Button>
        </DialogActions>
      </Dialog>
      
      <PopupDialog
        open={errorDialog.open}
        onClose={() => setErrorDialog(prev => ({ ...prev, open: false }))}
        title={errorDialog.title}
        content={errorDialog.message}
        confirmColor="error"
        onConfirm={() => setErrorDialog(prev => ({ ...prev, open: false }))}
        confirmText="Close"
        hideCancel
      />

      <CompensationModal
        open={isCompensationModalOpen}
        onClose={() => setIsCompensationModalOpen(false)}
        employeeId={id || ''}
        currentBaseSalary={employee.compensation?.baseSalary || 0}
        currentCurrency={employee.compensation?.currency || 1}
        currentSalaryType={employee.compensation?.salaryType}
      />
    </Box>
  );
};