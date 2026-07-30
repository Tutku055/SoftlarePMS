import React, { useState } from 'react';
import { 
  Box, Typography, Button, TextField, Select, MenuItem, 
  FormControl, InputLabel, FormHelperText, Snackbar, Alert, Stack, InputAdornment, Tooltip, Divider, IconButton
} from '@mui/material';
import type { Theme } from '@mui/material';
import { 
  SaveRounded, ArrowBackRounded, BadgeRounded, PersonRounded, 
  PublicRounded, WorkRounded, 
  AccessTimeRounded, FlightTakeoffRounded, 
  HomeRounded, LocationCityRounded, MapRounded, MarkunreadMailboxRounded
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useCreateEmployee } from './hooks/useCreateEmployee';
import { useDepartments } from './hooks/useDepartments';
import styles from './EmployeeCreation.module.css';
import type { CreateEmployeeDto, DepartmentDto } from './types';

// Theme-compatible glass panel
const glassPanelSx = {
  background: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid',
  borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  borderRadius: '16px',
  p: 3,
  mb: 3,
  boxShadow: (theme: Theme) => theme.palette.mode === 'dark'
    ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
    : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
  transition: 'box-shadow 0.3s ease',
};

// Theme-compatible input style (required vs optional)
const getPremiumInputSx = (isRequired: boolean, hasError: boolean) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: (theme: Theme) => isRequired 
      ? (theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.04)')
      : (theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'background.paper'),
    borderRadius: '10px',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.02)',
    '&:hover': {
      boxShadow: (theme: Theme) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0, 0, 0, 0.2)' : '0 2px 8px rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      boxShadow: '0 0 0 3px rgba(128, 128, 128, 0.1)',
    }
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? 'error.main' : 'rgba(128, 128, 128, 0.2)',
  },
  '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: hasError ? 'error.main' : 'primary.main',
    borderWidth: '1px',
  }
});

// Action button matching Detail pages
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

export const EmployeeCreation: React.FC = () => {
  const navigate = useNavigate();
  const { mutate: createEmployee, isPending } = useCreateEmployee();
  const { data: deptData } = useDepartments();
  const departmentOptions = deptData?.items.map((d: DepartmentDto) => ({ value: d.id, label: d.name })) || [];

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const [formState, setFormState] = useState<CreateEmployeeDto>({
    employeeNo: '',
    firstName: '',
    lastName: '',
    gender: 0, 
    dateOfBirth: '',
    nationality: '',
    profession: '',
    employmentStatus: 1, 
    hireDate: new Date().toISOString().split('T')[0],
    workingHoursPerWeek: 40,
    annualVacationDays: 14,
    carriedOverLeaves: 0,
    salaryType: 2, // Default to Monthly (2)
    departmentId: '',
    addressLine: '',
    postalCode: '',
    city: '',
    state: '',
    country: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({
      ...prev,
      [name]: ['workingHoursPerWeek', 'annualVacationDays', 'carriedOverLeaves'].includes(name)
        ? (value === '' ? 0 : Number(value))
        : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormState(prev => {
      const newState = { ...prev, [name]: value };
      
      // If SalaryType changes to Hourly (1), reset vacation/hours to 0
      if (name === 'salaryType' && value === 1) {
        newState.workingHoursPerWeek = 0;
        newState.annualVacationDays = 0;
        newState.carriedOverLeaves = 0;
      }
      // If SalaryType changes to Monthly (2), set some sensible defaults if they were 0
      else if (name === 'salaryType' && value === 2) {
        newState.workingHoursPerWeek = 40;
        newState.annualVacationDays = 14;
        newState.carriedOverLeaves = 0;
      }

      return newState;
    });

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formState.employeeNo.trim()) newErrors.employeeNo = 'Required';
    else if (formState.employeeNo.length > 20) newErrors.employeeNo = 'Max 20 chars';

    if (!formState.firstName.trim()) newErrors.firstName = 'Required';
    else if (formState.firstName.length > 50) newErrors.firstName = 'Max 50 chars';

    if (!formState.lastName.trim()) newErrors.lastName = 'Required';
    else if (formState.lastName.length > 50) newErrors.lastName = 'Max 50 chars';

    if (!formState.nationality.trim()) newErrors.nationality = 'Required';
    if (!formState.profession.trim()) newErrors.profession = 'Required';

    if (!formState.dateOfBirth) newErrors.dateOfBirth = 'Required';
    else {
      const dob = new Date(formState.dateOfBirth);
      const limitDate = new Date();
      limitDate.setFullYear(limitDate.getFullYear() - 16);
      if (dob > limitDate) newErrors.dateOfBirth = 'Must be at least 16 years old';
    }

    if (!formState.hireDate) newErrors.hireDate = 'Required';

    if (formState.salaryType === 2 && formState.workingHoursPerWeek <= 0) newErrors.workingHoursPerWeek = '> 0';
    else if (formState.salaryType === 2 && formState.workingHoursPerWeek > 60) newErrors.workingHoursPerWeek = '<= 60';

    if (formState.salaryType === 2 && formState.annualVacationDays < 0) newErrors.annualVacationDays = '>= 0';
    if (formState.salaryType === 2 && formState.carriedOverLeaves < 0) newErrors.carriedOverLeaves = '>= 0';

    if (!formState.addressLine.trim()) newErrors.addressLine = 'Required';
    else if (formState.addressLine.length > 200) newErrors.addressLine = 'Max 200 chars';

    if (!formState.city.trim()) newErrors.city = 'Required';
    else if (formState.city.length > 100) newErrors.city = 'Max 100 chars';

    if (!formState.country.trim()) newErrors.country = 'Required';
    else if (formState.country.length > 100) newErrors.country = 'Max 100 chars';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      setSnackbarMessage('Please correct the validation errors before submitting.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }

    createEmployee(formState, {
      onSuccess: (data) => {
        setSnackbarMessage(`Success! Created employee ${data.employeeNo}`);
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
        setTimeout(() => navigate(`/employees/${data.id || 'roster'}`), 1500);
      },
      onError: (err: unknown) => {
        const errorObj = err as { response?: { data?: { detail?: string } }, message?: string };
        setSnackbarMessage(errorObj?.response?.data?.detail || errorObj?.message || 'Failed to create employee');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      
      {/* HEADER */}
      <Box className={styles.headerContainer} sx={{ mb: 4 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Tooltip title="Back to Roster">
            <IconButton 
              onClick={() => navigate('/employees/roster')} 
              sx={{ 
                bgcolor: 'action.hover', 
                width: 40, 
                height: 40, 
                borderRadius: '50%',
                flexShrink: 0
              }}
            >
              <ArrowBackRounded />
            </IconButton>
          </Tooltip>
          <Box>
            <Typography 
              variant="h4" 
              className={styles.pageTitle} 
              sx={{ 
                fontSize: { xs: '1.5rem', md: '2.125rem' },
                fontWeight: 700, 
                letterSpacing: '-0.02em', 
                color: 'text.primary',
                textShadow: (theme: Theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.05)'
              }}
            >
              Onboard Employee
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Create a new employee profile and define their initial setup
            </Typography>
          </Box>
        </Stack>
      </Box>

      <form onSubmit={handleSubmit} noValidate>
        
        {/* SECTION 1: Personal Details */}
        <Box sx={glassPanelSx}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
            <PersonRounded color="primary" />
            <Typography variant="h6" className={styles.sectionTitle} sx={{ m: 0 }}>
              Personal Identity
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <div className={styles.formGrid}>
            <TextField
              label="Employee No *"
              name="employeeNo"
              value={formState.employeeNo}
              onChange={handleInputChange}
              error={!!errors.employeeNo}
              helperText={errors.employeeNo}
              sx={getPremiumInputSx(true, !!errors.employeeNo)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><BadgeRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />
            <TextField
              label="First Name *"
              name="firstName"
              value={formState.firstName}
              onChange={handleInputChange}
              error={!!errors.firstName}
              helperText={errors.firstName}
              sx={getPremiumInputSx(true, !!errors.firstName)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><PersonRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />
            <TextField
              label="Last Name *"
              name="lastName"
              value={formState.lastName}
              onChange={handleInputChange}
              error={!!errors.lastName}
              helperText={errors.lastName}
              sx={getPremiumInputSx(true, !!errors.lastName)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><PersonRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <FormControl fullWidth error={!!errors.gender} sx={getPremiumInputSx(true, !!errors.gender)}>
              <InputLabel id="gender-label">Gender *</InputLabel>
              <Select
                labelId="gender-label"
                value={formState.gender}
                label="Gender *"
                onChange={(e) => handleSelectChange('gender', e.target.value)}
              >
                <MenuItem value={0}>Unspecified</MenuItem>
                <MenuItem value={1}>Male</MenuItem>
                <MenuItem value={2}>Female</MenuItem>
              </Select>
              {errors.gender && <FormHelperText>{errors.gender}</FormHelperText>}
            </FormControl>

            <TextField
              label="Date of Birth *"
              name="dateOfBirth"
              type="date"
              value={formState.dateOfBirth}
              onChange={handleInputChange}
              error={!!errors.dateOfBirth}
              helperText={errors.dateOfBirth}
              sx={getPremiumInputSx(true, !!errors.dateOfBirth)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <TextField
              label="Nationality *"
              name="nationality"
              value={formState.nationality}
              onChange={handleInputChange}
              error={!!errors.nationality}
              helperText={errors.nationality}
              sx={getPremiumInputSx(true, !!errors.nationality)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><PublicRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />
          </div>
        </Box>

        {/* SECTION 2: Work Configuration */}
        <Box sx={glassPanelSx}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
            <WorkRounded color="primary" />
            <Typography variant="h6" className={styles.sectionTitle} sx={{ m: 0 }}>
              Work Configuration
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <div className={styles.formGrid}>
            <TextField
              label="Profession *"
              name="profession"
              value={formState.profession}
              onChange={handleInputChange}
              error={!!errors.profession}
              helperText={errors.profession}
              sx={getPremiumInputSx(true, !!errors.profession)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><WorkRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <FormControl fullWidth error={!!errors.employmentStatus} sx={getPremiumInputSx(true, !!errors.employmentStatus)}>
              <InputLabel id="status-label">Employment Status *</InputLabel>
              <Select
                labelId="status-label"
                value={formState.employmentStatus}
                label="Employment Status *"
                onChange={(e) => handleSelectChange('employmentStatus', e.target.value)}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={2}>On Leave</MenuItem>
                <MenuItem value={3}>Terminated</MenuItem>
              </Select>
              {errors.employmentStatus && <FormHelperText>{errors.employmentStatus}</FormHelperText>}
            </FormControl>

            <FormControl fullWidth sx={getPremiumInputSx(true, false)}>
              <InputLabel id="salary-type-label">Salary Type *</InputLabel>
              <Select
                labelId="salary-type-label"
                value={formState.salaryType}
                label="Salary Type *"
                onChange={(e) => handleSelectChange('salaryType', e.target.value)}
              >
                <MenuItem value={1}>Hourly</MenuItem>
                <MenuItem value={2}>Monthly</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Hire Date *"
              name="hireDate"
              type="date"
              value={formState.hireDate}
              onChange={handleInputChange}
              error={!!errors.hireDate}
              helperText={errors.hireDate}
              sx={getPremiumInputSx(true, !!errors.hireDate)}
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
            />

            <FormControl fullWidth error={!!errors.departmentId} sx={getPremiumInputSx(false, !!errors.departmentId)}>
              <InputLabel id="department-label">Department</InputLabel>
              <Select
                labelId="department-label"
                value={formState.departmentId}
                label="Department"
                onChange={(e) => handleSelectChange('departmentId', e.target.value)}
              >
                <MenuItem value=""><em>None</em></MenuItem>
                {departmentOptions.map((d: { value: string, label: string }) => (
                  <MenuItem key={d.value} value={d.value}>{d.label}</MenuItem>
                ))}
              </Select>
              {errors.departmentId && <FormHelperText>{errors.departmentId}</FormHelperText>}
            </FormControl>

            {formState.salaryType === 2 && (
              <>
                <TextField
                  label="Hours / Week *"
                  name="workingHoursPerWeek"
                  type="number"
                  value={formState.workingHoursPerWeek || ''}
                  onChange={handleInputChange}
                  error={!!errors.workingHoursPerWeek}
                  helperText={errors.workingHoursPerWeek}
                  sx={getPremiumInputSx(true, !!errors.workingHoursPerWeek)}
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><AccessTimeRounded fontSize="small" /></InputAdornment>,
                    }
                  }}
                />

                <TextField
                  label="Annual Vacation Days *"
                  name="annualVacationDays"
                  type="number"
                  value={formState.annualVacationDays || ''}
                  onChange={handleInputChange}
                  error={!!errors.annualVacationDays}
                  helperText={errors.annualVacationDays}
                  sx={getPremiumInputSx(true, !!errors.annualVacationDays)}
                  fullWidth
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><FlightTakeoffRounded fontSize="small" /></InputAdornment>,
                    }
                  }}
                />
              </>
            )}
          </div>
        </Box>

        {/* SECTION 3: Address & Contact */}
        <Box sx={glassPanelSx}>
          <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: 'center' }}>
            <HomeRounded color="primary" />
            <Typography variant="h6" className={styles.sectionTitle} sx={{ m: 0 }}>
              Primary Address
            </Typography>
          </Stack>
          <Divider sx={{ mb: 3, opacity: 0.5 }} />

          <div className={styles.formGrid}>
            <TextField
              label="Address Line *"
              name="addressLine"
              value={formState.addressLine}
              onChange={handleInputChange}
              error={!!errors.addressLine}
              helperText={errors.addressLine}
              sx={getPremiumInputSx(true, !!errors.addressLine)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><HomeRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <TextField
              label="Postal Code"
              name="postalCode"
              value={formState.postalCode}
              onChange={handleInputChange}
              error={!!errors.postalCode}
              helperText={errors.postalCode}
              sx={getPremiumInputSx(false, !!errors.postalCode)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><MarkunreadMailboxRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <TextField
              label="City *"
              name="city"
              value={formState.city}
              onChange={handleInputChange}
              error={!!errors.city}
              helperText={errors.city}
              sx={getPremiumInputSx(true, !!errors.city)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><LocationCityRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <TextField
              label="State / Province"
              name="state"
              value={formState.state}
              onChange={handleInputChange}
              error={!!errors.state}
              helperText={errors.state}
              sx={getPremiumInputSx(false, !!errors.state)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><MapRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />

            <TextField
              label="Country *"
              name="country"
              value={formState.country}
              onChange={handleInputChange}
              error={!!errors.country}
              helperText={errors.country}
              sx={getPremiumInputSx(true, !!errors.country)}
              fullWidth
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><PublicRounded fontSize="small" /></InputAdornment>,
                }
              }}
            />
          </div>
        </Box>

        {/* Action Buttons */}
        <Box sx={{ mt: 2, mb: 6, display: 'flex', justifyContent: 'flex-end' }}>
          <Stack direction="row" spacing={2}>
            <Button 
              variant="outlined" 
              onClick={() => navigate('/employees/roster')}
              sx={{ ...actionButtonSx, px: 4 }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              variant="contained" 
              startIcon={<SaveRounded />}
              className={styles.submitButton}
              size="large"
              disabled={isPending}
              sx={{ px: 4, borderRadius: '10px', boxShadow: 'none' }}
            >
              {isPending ? 'Creating...' : 'Finalize & Save'}
            </Button>
          </Stack>
        </Box>
      </form>

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
    </Box>
  );
};
