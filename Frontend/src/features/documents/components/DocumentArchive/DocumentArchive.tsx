import React from 'react';
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Tooltip,
  Divider,
  Menu,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Badge,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  ViewColumnRounded,
  SearchRounded,
  CloseRounded,
  AutoAwesomeRounded,
  FilterAltRounded,
  WarningRounded,
  CheckCircleRounded,
} from '@mui/icons-material';
import type {
  GridPaginationModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { DataTable } from '../../../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../../../components/DataTable/DataTable';
import { useDocuments } from '../../hooks/useDocuments';
import { useAuthStore } from '../../../../store/useAuthStore';
import { parseDocumentFilters } from '../../utils/filterUtils';
import { formatDateDisplay } from '../../../finance/constants/currencyConstants';
import { documentsApi } from '../../api/documentsApi';

const COLUMN_NAMES: Record<string, string> = {
  fileName: 'Original File Name',
  extension: 'Extension',
  documentType: 'Document Type',
  fileSizeBytes: 'File Size',
  createdAt: 'Upload Date',
  expiryDate: 'Expiry Date',
  isAvailable: 'Availability',
};

type QuickFilter = 'all' | 'excel' | 'word' | 'pdf' | 'jpeg' | 'png' | 'expiring_soon';

const formatBytes = (bytes: number, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const DocumentArchive = () => {
  const navigate = useNavigate();
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');
  
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const [selectedOwnerModule, setSelectedOwnerModule] = useState<string>('');
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('all');

  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState<{ totalChecked: number, missingCount: number, availableCount: number } | null>(null);
  const [showIntegrityToast, setShowIntegrityToast] = useState(false);
  
  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({});

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });

    if (field === 'extension') {
      const v = value.replace(/^\./, '').toLowerCase();
      if (v === 'xlsx') setActiveQuickFilter('excel');
      else if (v === 'docx') setActiveQuickFilter('word');
      else if (v === 'pdf') setActiveQuickFilter('pdf');
      else if (v === 'jpeg') setActiveQuickFilter('jpeg');
      else if (v === 'png') setActiveQuickFilter('png');
      else setActiveQuickFilter('all');
    }
    
    if (field === 'expiryDate' && !value) {
      setActiveQuickFilter(prev => prev === 'expiring_soon' ? 'all' : prev);
    }
  }, []);

  const handleClearColumnFilters = () => {
    setColumnFilters({});
    setActiveQuickFilter('all');
  };

  const handleQuickFilterClick = (code: QuickFilter) => {
    const newCode = activeQuickFilter === code ? 'all' : code;
    setActiveQuickFilter(newCode);
    
    setColumnFilters(prev => {
      const next = { ...prev };
      if (newCode === 'excel') {
        next['extension'] = { operator: 'is', value: 'xlsx' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      } else if (newCode === 'word') {
        next['extension'] = { operator: 'is', value: 'docx' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      } else if (newCode === 'pdf') {
        next['extension'] = { operator: 'is', value: 'pdf' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      } else if (newCode === 'jpeg') {
        next['extension'] = { operator: 'is', value: 'jpeg' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      } else if (newCode === 'png') {
        next['extension'] = { operator: 'is', value: 'png' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      } else if (newCode === 'expiring_soon') {
        const in30Days = new Date();
        in30Days.setDate(in30Days.getDate() + 30);
        next['expiryDate'] = { operator: 'before', value: in30Days.toISOString().split('T')[0] };
        if (next['extension']) next['extension'] = { ...next['extension'], value: '' };
      } else {
        if (next['extension']) next['extension'] = { ...next['extension'], value: '' };
        if (next['expiryDate']) next['expiryDate'] = { ...next['expiryDate'], value: '' };
      }
      return next;
    });

    setQuickSearch('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 10 });
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    fileName: true,
    extension: true,
    documentType: true,
    fileSizeBytes: true,
    createdAt: true,
    expiryDate: true,
    isAvailable: true,
  });

  const handleCheckIntegrity = async () => {
    try {
      setIsCheckingIntegrity(true);
      const result = await documentsApi.checkIntegrity();
      setIntegrityResult(result);
      setShowIntegrityToast(true);
      await refetch();
    } catch (error) {
      console.error('Integrity check failed', error);
    } finally {
      setIsCheckingIntegrity(false);
    }
  };

  const activeOwnerModule = selectedOwnerModule ? Number(selectedOwnerModule) : undefined;
  const parsedFilters = parseDocumentFilters(columnFilters);

  const { data, isLoading, isFetching, refetch } = useDocuments({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    ownerModule: activeOwnerModule,
    ...parsedFilters,
    quickSearch: debouncedQuickSearch,
  });

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value && f.operator !== 'between_next_30_days').length;

  const columns: DataTableColumnDef[] = [
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
      headerName: 'Document Type',
      flex: 1,
      minWidth: 150,
      filterType: 'select',
      filterOptions: [
        { value: '0', label: 'Other' },
        ...(activeOwnerModule !== 2 ? [
          { value: '1', label: 'Identification' },
          { value: '2', label: 'Contract' },
          { value: '3', label: 'Health Record' },
          { value: '4', label: 'Certificate' },
          { value: '5', label: 'Resume' },
          { value: '6', label: 'Background Check' },
          { value: '7', label: 'Performance Review' },
          { value: '8', label: 'Payroll And Tax' },
          { value: '9', label: 'Offboarding' },
        ] : []),
        ...(activeOwnerModule !== 1 ? [
          { value: '100', label: 'Policy' },
          { value: '101', label: 'Budget Report' },
          { value: '102', label: 'Org Structure' },
          { value: '103', label: 'Compliance And Audit' },
          { value: '104', label: 'Strategic Plan' },
        ] : []),
      ],
      valueGetter: (_, row: any) => row.documentType,
      renderCell: (params) => {
        const typeLabels: Record<number, string> = {
          0: 'Other', 1: 'Identification', 2: 'Contract', 3: 'Health Record', 4: 'Certificate',
          5: 'Resume', 6: 'Background Check', 7: 'Performance Review', 8: 'Payroll And Tax', 9: 'Offboarding',
          100: 'Policy', 101: 'Budget Report', 102: 'Org Structure', 103: 'Compliance And Audit', 104: 'Strategic Plan'
        };
        return <Chip label={typeLabels[params.value as number] || 'Other'} size="small" />;
      },
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
      renderCell: (params) => (
        <Typography variant="body2" color="text.secondary">
          {formatBytes(params.value as number)}
        </Typography>
      )
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
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1536, margin: '0 auto' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              textShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Document Archive
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Central repository for all system documents.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>File Owner Type</InputLabel>
            <Select
              value={selectedOwnerModule}
              label="File Owner Type"
              onChange={(e) => {
                setSelectedOwnerModule(e.target.value);
                setPaginationModel(prev => ({ ...prev, page: 0 }));
              }}
              sx={{ borderRadius: '10px' }}
            >
              <MenuItem value="">All</MenuItem>
              <MenuItem value="1">Employee</MenuItem>
              <MenuItem value="2">Department</MenuItem>
            </Select>
          </FormControl>
          
          {hasPermission('Documents.Update') && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<AutoAwesomeRounded />}
              onClick={handleCheckIntegrity}
              disabled={isCheckingIntegrity}
              sx={{
                borderRadius: '10px',
                fontWeight: 600,
                textTransform: 'none',
                boxShadow: 'none'
              }}
            >
              Check Integrity
            </Button>
          )}

          <Tooltip title="Manage Columns" arrow>
            <Button
              variant="outlined"
              startIcon={<ViewColumnRounded />}
              onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
              sx={{
                borderRadius: '10px',
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': { backgroundColor: 'action.hover', borderColor: 'text.primary' }
              }}
            >
              Columns
            </Button>
          </Tooltip>
          <Menu anchorEl={columnMenuAnchor} open={Boolean(columnMenuAnchor)} onClose={() => setColumnMenuAnchor(null)}>
            {Object.keys(COLUMN_NAMES).map((key) => (
              <MenuItem key={key} onClick={() => setColumnVisibility(prev => ({ ...prev, [key]: !prev[key] }))}>
                <Checkbox checked={columnVisibility[key] !== false} size="small" />
                <ListItemText primary={COLUMN_NAMES[key]} />
              </MenuItem>
            ))}
          </Menu>
        </Stack>
      </Box>

      <Box
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          p: 3,
          boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)' : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
          mb: 3,
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Search documents..."
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><SearchRounded fontSize="small" /></InputAdornment>,
                endAdornment: quickSearch ? <InputAdornment position="end"><IconButton size="small" onClick={() => setQuickSearch('')}><CloseRounded fontSize="small" /></IconButton></InputAdornment> : undefined,
              },
            }}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
          />

          <Divider sx={{ opacity: 0.4 }} />

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.secondary' }}>
              <AutoAwesomeRounded fontSize="small" /> Quick Filters:
            </Typography>

            {(['all', 'excel', 'word', 'pdf', 'jpeg', 'png', 'expiring_soon'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Files',
                excel: 'Excel (.xlsx)',
                word: 'Word (.docx)',
                pdf: 'PDF',
                jpeg: 'JPEG',
                png: 'PNG',
                expiring_soon: 'Expiring Soon (30 Days)',
              };
              const isActive = activeQuickFilter === code;
              
              return (
                <Chip
                  key={code}
                  label={labels[code]}
                  onClick={() => handleQuickFilterClick(code)}
                  sx={{
                    fontWeight: 500,
                    borderRadius: '8px',
                    border: '1px solid',
                    borderColor: isActive ? 'text.primary' : 'divider',
                    backgroundColor: isActive ? 'text.primary' : 'transparent',
                    color: isActive ? 'background.paper' : 'text.primary',
                    boxShadow: isActive ? '0 2px 6px rgba(0,0,0,0.15)' : 'none',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                       backgroundColor: isActive 
                        ? (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'
                        : 'action.hover',
                    }
                  }}
                />
              );
            })}

            {activeColumnFilterCount > 0 && (
              <>
                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
                <Badge badgeContent={activeColumnFilterCount} color="primary">
                  <Chip
                    icon={<FilterAltRounded />}
                    label="Column Filters Active"
                    size="small"
                    color="primary"
                    variant="outlined"
                    onDelete={handleClearColumnFilters}
                    sx={{ fontWeight: 600 }}
                  />
                </Badge>
              </>
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ borderRadius: 4, overflow: 'hidden', backgroundColor: 'background.paper', border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 24px rgba(0, 0, 0, 0.03)' }}>
        <DataTable
          data={data?.items || []}
          totalCount={data?.totalCount || 0}
          loading={isLoading || isFetching}
          columns={columns}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          columnVisibilityModel={columnVisibility}
          onColumnVisibilityModelChange={setColumnVisibility}
          customFilters={columnFilters}
          onCustomFilterChange={handleCustomFilterChange}
          onRowClick={(id) => navigate(`/documents/${id}`)}
        />
      </Box>

      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, display: 'flex', flexDirection: 'column', gap: 2 }}
        open={isCheckingIntegrity}
      >
        <CircularProgress color="inherit" />
        <Typography variant="h6">Checking physical file integrity...</Typography>
      </Backdrop>

      <Snackbar
        open={showIntegrityToast}
        autoHideDuration={6000}
        onClose={() => setShowIntegrityToast(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={() => setShowIntegrityToast(false)} severity={integrityResult?.missingCount && integrityResult.missingCount > 0 ? "warning" : "success"} sx={{ width: '100%' }}>
          Integrity check completed. {integrityResult?.missingCount} missing files detected out of {integrityResult?.totalChecked} checked.
        </Alert>
      </Snackbar>
    </Box>
  );
};
