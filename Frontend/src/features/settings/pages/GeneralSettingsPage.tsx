import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab, TextField, Button, Grid,
  CircularProgress, Divider, Snackbar, Alert, Switch, FormControlLabel,
  InputAdornment, IconButton
} from '@mui/material';
import {
  Save, Business, People, AccessTime, Email, CloudUpload, Visibility, VisibilityOff, SettingsRounded
} from '@mui/icons-material';
import { PageHeader } from '../../../components/PageHeader/PageHeader';
import { 
  useSystemParameters, 
  useUpdateSystemParameters, 
  useUploadCompanyLogo, 
  useTestEmailConnection,
} from '../api/GeneralSettingsApi';
import type { SystemParametersDto } from '../api/GeneralSettingsApi';
import { apiClient } from '../../../config/apiClient';
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
      style={{ padding: '24px 0' }}
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `settings-tab-${index}`,
    'aria-controls': `settings-tabpanel-${index}`,
  };
}

export const GeneralSettingsPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [formData, setFormData] = useState<SystemParametersDto | null>(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [showPassword, setShowPassword] = useState(false);
  const [emailTestResult, setEmailTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const { data: systemParams, isLoading, isError } = useSystemParameters();
  const updateMutation = useUpdateSystemParameters();
  const uploadLogoMutation = useUploadCompanyLogo();
  const testEmailMutation = useTestEmailConnection();

  useEffect(() => {
    if (systemParams) {
      setFormData(systemParams);
    }
  }, [systemParams]);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (field: keyof SystemParametersDto, value: any) => {
    if (formData) {
      setFormData({ ...formData, [field]: value });
    }
  };

  const ensureNonNullableDto = (data: Partial<SystemParametersDto>): SystemParametersDto => ({
    companyName: data.companyName || '',
    companyLogoPath: data.companyLogoPath || '',
    employeeNoPrefix: data.employeeNoPrefix || 'EMP',
    goLiveYear: data.goLiveYear || new Date().getFullYear(),
    monthlyWorkingHours: data.monthlyWorkingHours || 225,
    dailyWorkingHours: data.dailyWorkingHours || 8,
    smtpHost: data.smtpHost || 'localhost',
    smtpPort: data.smtpPort || 1025,
    senderName: data.senderName || '',
    senderEmail: data.senderEmail || '',
    smtpUserName: data.smtpUserName || '',
    smtpPassword: data.smtpPassword || '',
    smtpEnableSsl: data.smtpEnableSsl || false,
  });

  const isFormValid = () => {
    if (!formData) return false;
    return Boolean(
      formData.companyName?.trim() &&
      formData.employeeNoPrefix?.trim() &&
      formData.goLiveYear > 2000 &&
      formData.monthlyWorkingHours > 0 &&
      formData.dailyWorkingHours > 0 &&
      formData.smtpHost?.trim() &&
      formData.smtpPort > 0 &&
      formData.senderName?.trim() &&
      formData.senderEmail?.trim()
    );
  };

  const isSmtpValid = () => {
    if (!formData) return false;
    return Boolean(
      formData.smtpHost?.trim() &&
      formData.smtpPort > 0 &&
      formData.senderName?.trim() &&
      formData.senderEmail?.trim()
    );
  };

  const handleSave = () => {
    if (formData) {
      updateMutation.mutate(ensureNonNullableDto(formData), {
        onSuccess: () => {
          setToast({ open: true, message: 'Settings saved successfully!', severity: 'success' });
        },
        onError: () => {
          setToast({ open: true, message: 'Failed to save settings.', severity: 'error' });
        }
      });
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadLogoMutation.mutate(file, {
        onSuccess: (path) => {
          setToast({ open: true, message: 'Logo uploaded successfully!', severity: 'success' });
          if (formData) {
            setFormData({ ...formData, companyLogoPath: path });
          }
        },
        onError: () => {
          setToast({ open: true, message: 'Failed to upload logo.', severity: 'error' });
        }
      });
    }
  };

  const handleTestEmail = () => {
    if (formData) {
      setEmailTestResult(null);
      testEmailMutation.mutate(ensureNonNullableDto(formData), {
        onSuccess: (data) => {
          setEmailTestResult({ success: data.success, message: data.message });
        },
        onError: (err: any) => {
          setEmailTestResult({ success: false, message: err.response?.data?.message || 'Failed to connect to backend.' });
        }
      });
    }
  };

  const handleCloseToast = () => {
    setToast({ ...toast, open: false });
  };

  if (isLoading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  }

  if (isError) {
    return <Typography color="error">Error loading settings. Check console or backend logs.</Typography>;
  }

  if (!formData) {
    return null;
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="General Settings"
        subtitle="System-wide configuration, company profile, and SMTP integration."
        icon={<SettingsRounded />}
        actions={
          <Button 
            variant="contained" 
            color="primary" 
            size="small"
            startIcon={<Save />} 
            onClick={handleSave}
            disabled={updateMutation.isPending || !isFormValid()}
            sx={{ borderRadius: 2, fontWeight: 600 }}
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        }
      />

      <Paper sx={{ width: '100%', borderRadius: 2.5, overflow: 'hidden', border: '1px solid', borderColor: 'divider', bgcolor: 'background.paper' }} elevation={0}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleChange} 
            aria-label="settings tabs"
            variant="scrollable"
            scrollButtons="auto"
            sx={{ px: 2 }}
          >
            <Tab icon={<Business sx={{ mr: 1 }} />} iconPosition="start" label="Company Profile" {...a11yProps(0)} />
            <Tab icon={<People sx={{ mr: 1 }} />} iconPosition="start" label="General & Employee" {...a11yProps(1)} />
            <Tab icon={<AccessTime sx={{ mr: 1 }} />} iconPosition="start" label="Payroll & Hours" {...a11yProps(2)} />
            <Tab icon={<Email sx={{ mr: 1 }} />} iconPosition="start" label="Email (SMTP)" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2, md: 4 } }}>
          {/* Tab 1: Company Profile & Branding */}
          <CustomTabPanel value={tabValue} index={0}>
            <Grid container spacing={4}>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Company Information</Typography>
                <Divider sx={{ mb: 3 }} />
                <TextField
                  fullWidth
                  label="Company Name"
                  value={formData.companyName || ''}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  margin="normal"
                  variant="outlined"
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="h6" gutterBottom>Company Logo</Typography>
                <Divider sx={{ mb: 3 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Box 
                    sx={{ 
                      width: 120, 
                      height: 120, 
                      borderRadius: 2, 
                      border: '1px dashed grey',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      bgcolor: 'background.default'
                    }}
                  >
                    {formData.companyLogoPath ? (
                      <img 
                        src={`${apiClient.defaults.baseURL}/vault/${formData.companyLogoPath}`} 
                        alt="Company Logo" 
                        style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Business color="disabled" fontSize="large" />
                    )}
                  </Box>
                  <Box>
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<CloudUpload />}
                      disabled={uploadLogoMutation.isPending}
                    >
                      {uploadLogoMutation.isPending ? 'Uploading...' : 'Upload New Logo'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleLogoUpload}
                      />
                    </Button>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
                      Recommended size: 256x256px (PNG, JPG)
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* Tab 2: General & Employee Settings */}
          <CustomTabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>General Settings</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Employee Number Prefix"
                  value={formData.employeeNoPrefix || ''}
                  onChange={(e) => handleInputChange('employeeNoPrefix', e.target.value)}
                  placeholder="e.g. EMP"
                  helperText="Prefix used when generating new employee numbers."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Go-Live Year"
                  value={formData.goLiveYear || ''}
                  onChange={(e) => handleInputChange('goLiveYear', parseInt(e.target.value) || 0)}
                  helperText="The year the system goes live. Prevents generating data before this year."
                />
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* Tab 3: Payroll & Working Hours */}
          <CustomTabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>Working Hours</Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Monthly Working Hours"
                  value={formData.monthlyWorkingHours || ''}
                  onChange={(e) => handleInputChange('monthlyWorkingHours', parseFloat(e.target.value) || 0)}
                  helperText="Standard working hours per month (e.g. 225)."
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="Daily Working Hours"
                  value={formData.dailyWorkingHours || ''}
                  onChange={(e) => handleInputChange('dailyWorkingHours', parseFloat(e.target.value) || 0)}
                  helperText="Standard working hours per day (e.g. 8)."
                />
              </Grid>
            </Grid>
          </CustomTabPanel>

          {/* Tab 4: Email (SMTP) Configuration */}
          <CustomTabPanel value={tabValue} index={3}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
              <Typography variant="h6">SMTP Configuration</Typography>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={handleTestEmail}
                disabled={testEmailMutation.isPending || !isSmtpValid()}
              >
                {testEmailMutation.isPending ? 'Testing...' : 'Test Connection'}
              </Button>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Note: Clicking "Test Connection" will instantly test the SMTP settings you have entered above by sending a test email to your current account.
            </Typography>
            {emailTestResult && (
              <Alert 
                severity={emailTestResult.success ? 'success' : 'error'} 
                sx={{ mb: 3 }}
              >
                {emailTestResult.success ? 'Verified: ' : 'Verification Failed: '}
                {emailTestResult.message}
              </Alert>
            )}
            <Divider sx={{ mb: 3 }} />
            
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  fullWidth
                  label="SMTP Host"
                  value={formData.smtpHost || ''}
                  onChange={(e) => handleInputChange('smtpHost', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <TextField
                  fullWidth
                  type="number"
                  label="SMTP Port"
                  value={formData.smtpPort || ''}
                  onChange={(e) => handleInputChange('smtpPort', parseInt(e.target.value) || 0)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Sender Name"
                  value={formData.senderName || ''}
                  onChange={(e) => handleInputChange('senderName', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Sender Email"
                  value={formData.senderEmail || ''}
                  onChange={(e) => handleInputChange('senderEmail', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="SMTP Username"
                  value={formData.smtpUserName || ''}
                  onChange={(e) => handleInputChange('smtpUserName', e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="SMTP Password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.smtpPassword || ''}
                  onChange={(e) => handleInputChange('smtpPassword', e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={formData.smtpEnableSsl || false} 
                      onChange={(e) => handleInputChange('smtpEnableSsl', e.target.checked)} 
                    />
                  }
                  label="Enable SSL / TLS"
                />
              </Grid>
            </Grid>
          </CustomTabPanel>
        </Box>
      </Paper>

      <Snackbar open={toast.open} autoHideDuration={6000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleCloseToast} severity={toast.severity} sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
