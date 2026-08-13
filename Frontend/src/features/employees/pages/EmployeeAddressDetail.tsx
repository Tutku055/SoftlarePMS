// EmployeeAddressDetail.tsx
import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Stack, Button, Avatar, Chip, Divider, TextField, IconButton, Tooltip, CircularProgress, Alert, ToggleButtonGroup, ToggleButton, } from '@mui/material';
import {
  ArrowBackRounded, AddRounded, EditRounded, DeleteOutlineRounded, BusinessRounded, LocationOnRounded, SaveRounded, CloseRounded, HomeRounded, ContactMailRounded, CheckCircleRounded, SwapHorizRounded, HistoryRounded, PlayArrowRounded, } from '@mui/icons-material';
import { useAuthStore } from '../../../store/useAuthStore';
import { useEmployeeDetail } from '../hooks/useEmployeeDetail';
import {
  useEmployeeAddresses, useCreateEmployeeAddress, useUpdateEmployeeAddressMutation, useDeleteEmployeeAddressMutation, } from '../hooks/useEmployeeAddresses';
import type { EmployeeAddressDto } from '../types';
import { PopupDialog } from '../../../components/PopupDialog/PopupDialog';
import { formatDateDisplay } from '../../../utils/dateUtils';;

import * as z from 'zod';

const addressSchema = z.object({
  addressLine: z.string().min(1, 'Address line is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().optional().default(''),
  postalCode: z.string().optional().default(''),
  country: z.string().min(1, 'Country is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().nullable().optional(),
  isPrimary: z.boolean().default(true),
});

const glassPanelSx = {
  background: (theme: any) =>
    theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(12px)',
  border: '1px solid',
  borderColor: (theme: any) =>
    theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
  borderRadius: '16px',
  p: 3,
  boxShadow: (theme: any) =>
    theme.palette.mode === 'dark'
      ? '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
      : '0 8px 32px 0 rgba(0, 0, 0, 0.05)',
};

const premiumInputSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    backgroundColor: (theme: any) =>
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
    transition: 'all 0.2s ease-in-out',
    '&:hover': {
      backgroundColor: (theme: any) =>
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
    },
    '&.Mui-focused': {
      backgroundColor: (theme: any) =>
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    },
  },
};

export const EmployeeAddressDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();

  const canCreate = hasPermission('EmployeeAddresses.Create');
  const canUpdate = hasPermission('EmployeeAddresses.Update');
  const canDelete = hasPermission('EmployeeAddresses.Delete');

  const { data: employee, isLoading: employeeLoading } = useEmployeeDetail(id);
  const { data: addresses = [], isLoading: addressesLoading } = useEmployeeAddresses(id);

  const { mutate: createAddress, isPending: isCreating } = useCreateEmployeeAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateEmployeeAddressMutation();
  const { mutate: deleteAddress, isPending: isDeleting } = useDeleteEmployeeAddressMutation();

  // Form State for Adding / Editing Address
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLine, setAddressLine] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().substring(0, 10));
  const [endDate, setEndDate] = useState('');
  const [isPrimary, setIsPrimary] = useState(true);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Delete Modal State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<EmployeeAddressDto | null>(null);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getValidDateInput = (dateStr: string | null | undefined): string => {
    const todayStr = new Date().toISOString().substring(0, 10);
    if (!dateStr || dateStr.startsWith('0001') || dateStr.startsWith('1970-01-01')) {
      return todayStr;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1970) {
      return todayStr;
    }
    return dateStr.substring(0, 10);
  };

  const formatAddressDate = (dateStr: string | null | undefined, fallbackToPresent = false): string => {
    if (!dateStr || dateStr.startsWith('0001')) {
      return fallbackToPresent ? 'Present' : formatDateDisplay(new Date());
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime()) || d.getFullYear() < 1970) {
      return fallbackToPresent ? 'Present' : formatDateDisplay(new Date());
    }
    return formatDateDisplay(d);
  };

  // Compute Current Active Addresses
  const activePrimary = addresses.find(
    (a) => a.isPrimary && (!a.endDate || new Date(a.endDate) >= today)
  );
  const activeSecondary = addresses.find(
    (a) => !a.isPrimary && (!a.endDate || new Date(a.endDate) >= today)
  );

  // Clear or reset form
  const handleResetForm = () => {
    setEditingAddressId(null);
    setAddressLine('');
    setCity('');
    setState('');
    setPostalCode('');
    setCountry('');
    setStartDate(new Date().toISOString().substring(0, 10));
    setEndDate('');
    setIsPrimary(true);
    setFormErrors({});
  };

  // Populate form when clicking Edit or clicking a table row
  const handleSelectForEdit = (addr: EmployeeAddressDto) => {
    setEditingAddressId(addr.id);
    setAddressLine(addr.addressLine || '');
    setCity(addr.city || '');
    setState(addr.state || '');
    setPostalCode(addr.postalCode || '');
    setCountry(addr.country || '');
    
    let sDate = getValidDateInput(addr.startDate);
    let eDate = addr.endDate && !addr.endDate.startsWith('0001') ? addr.endDate.substring(0, 10) : '';
    if (eDate && sDate > eDate) {
      sDate = eDate;
    }

    setStartDate(sDate);
    setEndDate(eDate);
    setIsPrimary(!!addr.isPrimary);
    setFormErrors({});
    setStatusMessage(null);

    // Smooth scroll to top form if needed
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Instant 1-Click Type Switch (Primary <-> Secondary) directly from Table
  const handleToggleAddressType = (addr: EmployeeAddressDto, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!id || !canUpdate) return;

    const targetIsPrimary = !addr.isPrimary;
    let sDate = getValidDateInput(addr.startDate);
    let eDate = addr.endDate && !addr.endDate.startsWith('0001') ? addr.endDate.substring(0, 10) : null;
    if (eDate && sDate > eDate) {
      sDate = eDate;
    }

    updateAddress(
      {
        employeeId: id,
        id: addr.id,
        dto: {
          addressLine: addr.addressLine || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || '',
          startDate: `${sDate}T00:00:00.000Z`,
          endDate: eDate ? `${eDate}T00:00:00.000Z` : null,
          isPrimary: targetIsPrimary,
        },
      },
      {
        onSuccess: () => {
          setStatusMessage({
            type: 'success',
            text: targetIsPrimary
              ? 'Address successfully switched to Primary. Any previous active primary address has been archived.'
              : 'Address successfully switched to Secondary. Any previous active secondary address has been archived.',
          });
          if (editingAddressId === addr.id) {
            setIsPrimary(targetIsPrimary);
          }
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.errors && typeof err.response.data.errors === 'object'
              ? Object.values(err.response.data.errors).flat().join(', ')
              : err?.response?.data?.message ||
                err?.response?.data?.detail ||
                'Failed to switch address type.';
          setStatusMessage({
            type: 'error',
            text: errMsg,
          });
        },
      }
    );
  };

  // Reactivate a historical address (sets StartDate to Today, EndDate to null, archiving previous active address)
  const handleMakeActive = (addr: EmployeeAddressDto, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!id || !canUpdate) return;

    const todayStr = new Date().toISOString().substring(0, 10);

    updateAddress(
      {
        employeeId: id,
        id: addr.id,
        dto: {
          addressLine: addr.addressLine || '',
          city: addr.city || '',
          state: addr.state || '',
          postalCode: addr.postalCode || '',
          country: addr.country || '',
          startDate: `${todayStr}T00:00:00.000Z`,
          endDate: null,
          isPrimary: addr.isPrimary,
        },
      },
      {
        onSuccess: () => {
          setStatusMessage({
            type: 'success',
            text: `Historical address has been made active ${addr.isPrimary ? 'Primary' : 'Secondary'} address. Any previous active ${addr.isPrimary ? 'primary' : 'secondary'} address has been archived.`,
          });
          if (editingAddressId === addr.id) {
            setStartDate(todayStr);
            setEndDate('');
          }
        },
        onError: (err: any) => {
          const errMsg =
            err?.response?.data?.errors && typeof err.response.data.errors === 'object'
              ? Object.values(err.response.data.errors).flat().join(', ')
              : err?.response?.data?.message ||
                err?.response?.data?.detail ||
                'Failed to activate historical address.';
          setStatusMessage({
            type: 'error',
            text: errMsg,
          });
        },
      }
    );
  };

  const handleSave = () => {
    if (!id) return;

    let sDate = getValidDateInput(startDate);
    let eDate = endDate && !endDate.startsWith('0001') ? endDate : null;
    if (eDate && sDate > eDate) {
      sDate = eDate;
    }

    const payload = {
      addressLine,
      city,
      state: state || '',
      postalCode: postalCode || '',
      country,
      startDate: sDate,
      endDate: eDate,
      isPrimary,
    };

    const validation = addressSchema.safeParse(payload);
    if (!validation.success) {
      const errMap: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          errMap[issue.path[0].toString()] = issue.message;
        }
      });
      setFormErrors(errMap);
      return;
    }

    setFormErrors({});
    setStatusMessage(null);

    if (editingAddressId) {
      updateAddress(
        {
          employeeId: id,
          id: editingAddressId,
          dto: {
            addressLine: validation.data.addressLine,
            city: validation.data.city,
            state: validation.data.state || '',
            postalCode: validation.data.postalCode || '',
            country: validation.data.country,
            startDate: `${validation.data.startDate}T00:00:00.000Z`,
            endDate: validation.data.endDate ? `${validation.data.endDate}T00:00:00.000Z` : null,
            isPrimary: validation.data.isPrimary,
          },
        },
        {
          onSuccess: () => {
            setStatusMessage({
              type: 'success',
              text: 'Address record updated successfully.',
            });
            handleResetForm();
          },
          onError: (err: any) => {
            const errMsg =
              err?.response?.data?.errors && typeof err.response.data.errors === 'object'
                ? Object.values(err.response.data.errors).flat().join(', ')
                : err?.response?.data?.message ||
                  err?.response?.data?.detail ||
                  'Failed to update address.';
            setStatusMessage({
              type: 'error',
              text: errMsg,
            });
          },
        }
      );
    } else {
      createAddress(
        {
          employeeId: id,
          dto: {
            addressLine: validation.data.addressLine,
            city: validation.data.city,
            state: validation.data.state || '',
            postalCode: validation.data.postalCode || '',
            country: validation.data.country,
            startDate: `${validation.data.startDate}T00:00:00.000Z`,
            endDate: validation.data.endDate ? `${validation.data.endDate}T00:00:00.000Z` : null,
            isPrimary: validation.data.isPrimary,
          },
        },
        {
          onSuccess: () => {
            setStatusMessage({
              type: 'success',
              text: isPrimary
                ? 'Active primary address saved. Previous primary address has been archived to history.'
                : 'Active secondary address saved. Previous secondary address has been archived to history.',
            });
            handleResetForm();
          },
          onError: (err: any) => {
            const errMsg =
              err?.response?.data?.errors && typeof err.response.data.errors === 'object'
                ? Object.values(err.response.data.errors).flat().join(', ')
                : err?.response?.data?.message ||
                  err?.response?.data?.detail ||
                  'Failed to create address.';
            setStatusMessage({
              type: 'error',
              text: errMsg,
            });
          },
        }
      );
    }
  };

  const handleOpenDelete = (addr: EmployeeAddressDto, e: React.MouseEvent) => {
    e.stopPropagation();
    setAddressToDelete(addr);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!id || !addressToDelete) return;
    deleteAddress(
      { employeeId: id, id: addressToDelete.id },
      {
        onSuccess: () => {
          setDeleteConfirmOpen(false);
          setAddressToDelete(null);
          if (editingAddressId === addressToDelete.id) {
            handleResetForm();
          }
          setStatusMessage({ type: 'success', text: 'Address record deleted.' });
        },
        onError: (err: any) => {
          setStatusMessage({
            type: 'error',
            text: err?.response?.data?.detail || 'Failed to delete address record.',
          });
        },
      }
    );
  };

  const isSaving = isCreating || isUpdating;

  if (employeeLoading || addressesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!employee) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Employee not found.
        </Typography>
        <Button
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate('/employees/addresses')}
          sx={{ mt: 2 }}
        >
          Back to Addresses
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, margin: '0 auto' }}>
      <Stack spacing={3} sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            startIcon={<ArrowBackRounded />}
            onClick={() => navigate('/employees/addresses')}
            sx={{
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 2,
              '&:hover': { bgcolor: 'action.hover', color: 'text.primary' },
            }}
          >
            Back to Address List
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate(`/employees/${employee.id}`)}
            sx={{
              borderRadius: '10px',
              borderColor: 'divider',
              color: 'text.primary',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            View Employee Profile
          </Button>
        </Box>

        {/* Profile Banner with Active Address Badges */}
        <Box sx={glassPanelSx}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', lg: 'row' },
              gap: 3,
              alignItems: { xs: 'flex-start', lg: 'center' },
              justifyContent: 'space-between',
            }}
          >
            <Stack direction="row" spacing={2.5} sx={{ alignItems: 'center' }}>
              <Avatar
                sx={{
                  width: 64,
                  height: 64,
                  bgcolor: 'primary.main',
                  fontSize: '1.5rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                {employee.firstName?.[0]}
                {employee.lastName?.[0]}
              </Avatar>
              <Box>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {employee.firstName} {employee.lastName}
                  </Typography>
                  <Chip
                    label={employee.employeeNo}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontWeight: 600, borderRadius: 1.5 }}
                  />
                </Stack>
                <Stack direction="row" spacing={2} sx={{ mt: 0.5, color: 'text.secondary' }}>
                  {employee.department && (
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BusinessRounded fontSize="small" />
                      {employee.department.name}
                    </Typography>
                  )}
                  {employee.professionName && (
                    <Typography variant="body2">{employee.professionName}</Typography>
                  )}
                </Stack>
              </Box>
            </Stack>

            {/* Active Addresses Status Cards */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ width: { xs: '100%', lg: 'auto' } }}>
              {/* Primary Card */}
              <Box
                sx={{
                  p: 1.5,
                  px: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: activePrimary ? 'primary.main' : 'divider',
                  bgcolor: (theme) =>
                    activePrimary
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(25, 118, 210, 0.12)'
                        : 'rgba(25, 118, 210, 0.06)'
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.02)',
                  minWidth: 220,
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <HomeRounded fontSize="small" color={activePrimary ? 'primary' : 'disabled'} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Primary Address
                  </Typography>
                </Stack>
                {activePrimary ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {activePrimary.city ? `${activePrimary.addressLine}, ${activePrimary.city}` : activePrimary.addressLine}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No active primary address
                  </Typography>
                )}
              </Box>

              {/* Secondary Card */}
              <Box
                sx={{
                  p: 1.5,
                  px: 2,
                  borderRadius: 2.5,
                  border: '1px solid',
                  borderColor: activeSecondary ? 'info.main' : 'divider',
                  bgcolor: (theme) =>
                    activeSecondary
                      ? theme.palette.mode === 'dark'
                        ? 'rgba(2, 136, 209, 0.12)'
                        : 'rgba(2, 136, 209, 0.06)'
                      : theme.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.02)'
                      : 'rgba(0, 0, 0, 0.02)',
                  minWidth: 220,
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: 'center', mb: 0.5 }}>
                  <ContactMailRounded fontSize="small" color={activeSecondary ? 'info' : 'disabled'} />
                  <Typography variant="caption" sx={{ fontWeight: 700, textTransform: 'uppercase' }}>
                    Active Secondary Address
                  </Typography>
                </Stack>
                {activeSecondary ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {activeSecondary.city ? `${activeSecondary.addressLine}, ${activeSecondary.city}` : activeSecondary.addressLine}
                  </Typography>
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    No active secondary address
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        </Box>
      </Stack>

      {/* Status Alerts */}
      {statusMessage && (
        <Alert
          severity={statusMessage.type}
          onClose={() => setStatusMessage(null)}
          sx={{ mb: 3, borderRadius: 2 }}
        >
          {statusMessage.text}
        </Alert>
      )}

      <Box sx={glassPanelSx}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {editingAddressId ? 'Edit Address Record' : 'Add New Address'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Configure employee residential and contact addresses. You can switch address classification (Primary ↔ Secondary) anytime.
            </Typography>
          </Box>
          {editingAddressId && (
            <Chip
              label="Editing Record"
              color="info"
              variant="outlined"
              size="small"
              onDelete={handleResetForm}
              deleteIcon={<CloseRounded />}
              sx={{ fontWeight: 600 }}
            />
          )}
        </Box>
        <Divider sx={{ opacity: 0.5, mb: 3 }} />

        <Box sx={{ mb: 3 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1 }}>
            Address Classification (Primary ↔ Secondary)
          </Typography>
          <ToggleButtonGroup
            value={isPrimary}
            exclusive
            onChange={(_e, val) => {
              if (val !== null) setIsPrimary(val);
            }}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                px: 2.5,
                py: 1,
                borderRadius: '10px !important',
                mr: 1,
                border: '1px solid',
                borderColor: 'divider',
                textTransform: 'none',
                fontWeight: 600,
                gap: 1,
                '&.Mui-selected': {
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(25, 118, 210, 0.25)' : 'rgba(25, 118, 210, 0.12)',
                  borderColor: 'primary.main',
                  color: 'primary.main',
                },
              },
            }}
          >
            <ToggleButton value={true}>
              <HomeRounded fontSize="small" />
              Primary Address (Main / Residential)
            </ToggleButton>
            <ToggleButton value={false}>
              <ContactMailRounded fontSize="small" />
              Secondary Address (Contact / Temporary)
            </ToggleButton>
          </ToggleButtonGroup>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontStyle: 'italic' }}>
            {isPrimary
              ? 'Primary Address: Official residential address for payroll and legal notices. Setting this will archive previous active primary address.'
              : 'Secondary Address: Alternative contact or temporary address. Setting this will archive previous active secondary address.'}
          </Typography>
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2.5,
          }}
        >
          <TextField
            label="Address Line"
            value={addressLine}
            onChange={(e) => setAddressLine(e.target.value)}
            size="small"
            fullWidth
            sx={{ ...premiumInputSx, gridColumn: { xs: '1 / -1', md: '1 / span 2' } }}
            error={!!formErrors.addressLine}
            helperText={formErrors.addressLine}
            placeholder="e.g. 123 Main Street, Suite 400"
          />

          <TextField
            label="City"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            size="small"
            fullWidth
            sx={premiumInputSx}
            error={!!formErrors.city}
            helperText={formErrors.city}
            placeholder="e.g. London"
          />

          <TextField
            label="State / Province"
            value={state}
            onChange={(e) => setState(e.target.value)}
            size="small"
            fullWidth
            sx={premiumInputSx}
            error={!!formErrors.state}
            helperText={formErrors.state}
            placeholder="e.g. Greater London"
          />

          <TextField
            label="Postal Code"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            size="small"
            fullWidth
            sx={premiumInputSx}
            error={!!formErrors.postalCode}
            helperText={formErrors.postalCode}
            placeholder="e.g. SW1A 1AA"
          />

          <TextField
            label="Country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            size="small"
            fullWidth
            sx={premiumInputSx}
            error={!!formErrors.country}
            helperText={formErrors.country}
            placeholder="e.g. United Kingdom"
          />

          <TextField
            label="Start Date"
            type="date"
            size="small"
            fullWidth
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!formErrors.startDate}
            helperText={formErrors.startDate}
            sx={premiumInputSx}
          />

          <TextField
            label="End Date (Optional)"
            type="date"
            size="small"
            fullWidth
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            error={!!formErrors.endDate}
            helperText={formErrors.endDate || 'Leave empty for current active address'}
            sx={premiumInputSx}
          />
        </Box>

        <Box sx={{ mt: 3.5, display: 'flex', gap: 2, alignItems: 'center' }}>
          {(editingAddressId ? canUpdate : canCreate) && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isSaving}
              startIcon={editingAddressId ? <SaveRounded /> : <AddRounded />}
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                textTransform: 'none',
                px: 3,
                py: 1,
                boxShadow: '0 4px 12px rgba(25,118,210,0.25)',
              }}
            >
              {editingAddressId
                ? isSaving
                  ? 'Updating...'
                  : 'Update Address'
                : isSaving
                ? 'Adding...'
                : 'Add New Address'}
            </Button>
          )}

          {editingAddressId && (
            <Button
              variant="outlined"
              onClick={handleResetForm}
              disabled={isSaving}
              sx={{ borderRadius: '10px', fontWeight: 600, textTransform: 'none', px: 2.5 }}
            >
              Cancel Edit
            </Button>
          )}
        </Box>

        <Box sx={{ mt: 5 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocationOnRounded fontSize="small" color="primary" />
              Address History
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Records: {addresses.length}
            </Typography>
          </Box>

          <Box
            sx={{
              borderRadius: 3,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: (theme: any) =>
                theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.5)',
            }}
          >
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}
            >
              <thead style={{ backgroundColor: 'rgba(128, 128, 128, 0.06)' }}>
                <tr>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Type (Click to Switch)</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Address</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>City</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>State / Province</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Postal Code</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Country</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', fontWeight: 600 }}>Period</th>
                  <th style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.2)', textAlign: 'right', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      style={{ padding: '32px 16px', textAlign: 'center', color: 'rgba(128, 128, 128, 0.8)' }}
                    >
                      No address records found for this employee.
                    </td>
                  </tr>
                ) : (
                  addresses.map((addr) => {
                    const isActive = !addr.endDate || new Date(addr.endDate) >= today;
                    const isSelected = editingAddressId === addr.id;

                    return (
                      <tr
                        key={addr.id}
                        onClick={() => canUpdate && handleSelectForEdit(addr)}
                        style={{
                          cursor: canUpdate ? 'pointer' : 'default',
                          backgroundColor: isSelected
                            ? 'rgba(25, 118, 210, 0.08)'
                            : undefined,
                          transition: 'background-color 0.15s ease',
                        }}
                      >
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          {isActive ? (
                            <Chip
                              icon={<CheckCircleRounded style={{ fontSize: 14 }} />}
                              label="Active"
                              size="small"
                              color="success"
                              variant="filled"
                              sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                            />
                          ) : (
                            <Tooltip title={canUpdate ? "Click to reactivate as current active address" : "Historical address"} arrow>
                              <Chip
                                icon={<HistoryRounded style={{ fontSize: 14 }} />}
                                label="Historical"
                                size="small"
                                color="default"
                                variant="outlined"
                                onClick={canUpdate ? (e) => handleMakeActive(addr, e) : undefined}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: canUpdate ? 'pointer' : 'default',
                                  borderColor: 'divider',
                                  borderStyle: 'dashed',
                                  '&:hover': canUpdate
                                    ? {
                                        bgcolor: 'success.main',
                                        color: '#ffffff',
                                        borderColor: 'success.main',
                                        transform: 'scale(1.03)',
                                      }
                                    : {},
                                  transition: 'all 0.15s ease',
                                }}
                              />
                            </Tooltip>
                          )}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          <Tooltip
                            title={canUpdate ? `Click to convert to ${addr.isPrimary ? 'Secondary' : 'Primary'}` : ''}
                            arrow
                          >
                            {addr.isPrimary ? (
                              <Chip
                                icon={<HomeRounded style={{ fontSize: 14 }} />}
                                label="Primary"
                                size="small"
                                color="primary"
                                variant="filled"
                                onClick={canUpdate ? (e) => handleToggleAddressType(addr, e) : undefined}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: canUpdate ? 'pointer' : 'default',
                                  '&:hover': canUpdate ? { opacity: 0.85, transform: 'scale(1.03)' } : {},
                                  transition: 'all 0.15s ease',
                                }}
                              />
                            ) : (
                              <Chip
                                icon={<ContactMailRounded style={{ fontSize: 14 }} />}
                                label="Secondary"
                                size="small"
                                color="info"
                                variant="outlined"
                                onClick={canUpdate ? (e) => handleToggleAddressType(addr, e) : undefined}
                                sx={{
                                  fontWeight: 600,
                                  fontSize: '0.75rem',
                                  cursor: canUpdate ? 'pointer' : 'default',
                                  '&:hover': canUpdate ? { bgcolor: 'info.main', color: '#fff', transform: 'scale(1.03)' } : {},
                                  transition: 'all 0.15s ease',
                                }}
                              />
                            )}
                          </Tooltip>
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)', fontWeight: 600 }}>
                          {addr.addressLine}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          {addr.city || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          {addr.state || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          {addr.postalCode || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)' }}>
                          {addr.country || '—'}
                        </td>
                        <td style={{ padding: '12px 16px', borderBottom: '1px solid rgba(128, 128, 128, 0.1)', whiteSpace: 'nowrap' }}>
                          {formatAddressDate(addr.startDate)} — {formatAddressDate(addr.endDate, true)}
                        </td>
                        <td
                          style={{
                            padding: '12px 16px',
                            borderBottom: '1px solid rgba(128, 128, 128, 0.1)',
                            textAlign: 'right',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {canUpdate && !isActive && (
                            <Tooltip title="Reactivate this address as current active" arrow>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={(e) => handleMakeActive(addr, e)}
                                sx={{ mr: 0.5 }}
                              >
                                <PlayArrowRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canUpdate && (
                            <Tooltip title={`Convert to ${addr.isPrimary ? 'Secondary' : 'Primary'}`} arrow>
                              <IconButton
                                size="small"
                                color="info"
                                onClick={(e) => handleToggleAddressType(addr, e)}
                                sx={{ mr: 0.5 }}
                              >
                                <SwapHorizRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canUpdate && (
                            <Tooltip title="Edit this record" arrow>
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectForEdit(addr);
                                }}
                                sx={{ mr: 0.5 }}
                              >
                                <EditRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          {canDelete && (
                            <Tooltip title="Delete record" arrow>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={(e) => handleOpenDelete(addr, e)}
                              >
                                <DeleteOutlineRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      </Box>

      <PopupDialog
        open={deleteConfirmOpen}
        title="Delete Address Record"
        onClose={() => !isDeleting && setDeleteConfirmOpen(false)}
        onConfirm={handleConfirmDelete}
        confirmText="Delete"
        confirmColor="error"
        isProcessing={isDeleting}
        maxWidth="xs"
        content={
          <Box>
            <Typography variant="body2" color="text.secondary">
              Are you sure you want to permanently delete this address record?
            </Typography>
            {addressToDelete && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: '1px solid',
                  borderColor: 'divider',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {addressToDelete.addressLine}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {[addressToDelete.city, addressToDelete.state, addressToDelete.country]
                    .filter(Boolean)
                    .join(', ')}
                </Typography>
              </Box>
            )}
          </Box>
        }
      />
    </Box>
  );
};
