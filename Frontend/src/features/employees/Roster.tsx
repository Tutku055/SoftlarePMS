import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
  Badge,
  TextField,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  ViewColumnRounded,
  FileDownloadRounded,
  AutoAwesomeRounded,
  FilterAltRounded,
  SearchRounded,
  CloseRounded,
} from '@mui/icons-material';
import type {
  GridPaginationModel,
  GridColumnVisibilityModel,
} from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { DataTable } from '../../components/DataTable/DataTable';
import type { CustomFilterValue, DataTableColumnDef } from '../../components/DataTable/DataTable';
import { useEmployees } from './hooks/useEmployees';
import { useDepartments } from './hooks/useDepartments';
import { useProfessionsLookup } from '../professions/hooks/useProfessionsLookup';
import ExcelJS from 'exceljs';
import { formatDateDisplay } from '../finance/constants/currencyConstants';

const COLUMN_NAMES: Record<string, string> = {
  employeeNo: 'Employee No',
  fullName: 'Full Name',
  departmentId: 'Department',
  profession: 'Profession',
  employmentStatus: 'Status',
  hireDate: 'Hire Date',
};

type QuickFilter = 'all' | 'active' | 'terminated' | 'new_hires';

export const Roster = () => {
  // ─── QUICK TEXT SEARCH ───────────────────────────────────────────────────
  const [quickSearch, setQuickSearch] = useState('');
  const [debouncedQuickSearch, setDebouncedQuickSearch] = useState('');

  // ─── SMART FILTER CHIPS ───────────────────────────────────────────────────
  const [activeQuickFilter, setActiveQuickFilter] = useState<QuickFilter>('active');

  // ─── CUSTOM COLUMN FILTERS (Bypasses DataGrid Free limits) ────────────────
  const [columnFilters, setColumnFilters] = useState<Record<string, CustomFilterValue>>({
    employmentStatus: { operator: 'is', value: '1' }
  });

  const handleCustomFilterChange = useCallback((field: string, value: string, operator: string) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      next[field] = { value, operator };
      return next;
    });

    if (field === 'employmentStatus') {
      if (value === '1') setActiveQuickFilter('active');
      else if (value === '3') setActiveQuickFilter('terminated');
      else setActiveQuickFilter('all');
    }
    
    if (field === 'hireDate' && !value) {
      setActiveQuickFilter(prev => prev === 'new_hires' ? 'all' : prev);
    }
  }, []);

  const handleClearColumnFilters = useCallback(() => {
    setColumnFilters({});
  }, []);

  // ─── PAGINATION ───────────────────────────────────────────────────────────
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({
    page: 0,
    pageSize: 10,
  });

  // ─── COLUMN VISIBILITY ────────────────────────────────────────────────────
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  const [columnVisibility, setColumnVisibility] = useState<GridColumnVisibilityModel>({
    employeeNo: true,
    fullName: true,
    departmentId: true,
    profession: true,
    employmentStatus: true,
    hireDate: true,
  });

  // ─── BUILD API FILTER LIST ────────────────────────────────────────────────
  const buildFilters = useCallback(
    (cols: Record<string, CustomFilterValue>, qs: string) => {
      const filters: { field: string; operator: string; value: string }[] = [];

      Object.entries(cols).forEach(([field, filterData]) => {
        const { value, operator } = filterData;
        if (!value) return;
        
        if (field === 'hireDate') {
          const d = new Date(value + 'T00:00:00');
          filters.push({ field, operator, value: d.toISOString() });
        } else if (field === 'fullName') {
          if (operator === 'firstName') {
            filters.push({ field: 'firstName', operator: 'contains', value });
          } else if (operator === 'lastName') {
            filters.push({ field: 'lastName', operator: 'contains', value });
          } else {
            const parts = value.trim().split(/\s+/);
            parts.forEach(part => {
              filters.push({ field: 'quickSearch', operator: 'contains', value: part });
            });
          }
        } else {
          filters.push({ field, operator, value });
        }
      });

      if (qs.trim()) {
        const parts = qs.trim().split(/\s+/);
        parts.forEach(part => {
          filters.push({ field: 'quickSearch', operator: 'contains', value: part });
        });
      }

      return filters;
    },
    []
  );

  // ─── DEBOUNCED API FILTERS ────────────────────────────────────────────────
  const [apiFilters, setApiFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setApiFilters(buildFilters(columnFilters, debouncedQuickSearch));
      setPaginationModel((prev) => ({ ...prev, page: 0 }));
    }, 350);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [columnFilters, activeQuickFilter, debouncedQuickSearch, buildFilters]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuickSearch(quickSearch), 350);
    return () => clearTimeout(t);
  }, [quickSearch]);

  const handleQuickFilterClick = (code: QuickFilter) => {
    const newCode = activeQuickFilter === code ? 'all' : code;
    setActiveQuickFilter(newCode);
    
    setColumnFilters(prev => {
      const next = { ...prev };
      if (newCode === 'active') {
        next['employmentStatus'] = { operator: 'is', value: '1' };
        if (next['hireDate']) next['hireDate'] = { ...next['hireDate'], value: '' };
      } else if (newCode === 'terminated') {
        next['employmentStatus'] = { operator: 'is', value: '3' };
        if (next['hireDate']) next['hireDate'] = { ...next['hireDate'], value: '' };
      } else if (newCode === 'new_hires') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        thirtyDaysAgo.setHours(0, 0, 0, 0);
        next['hireDate'] = { operator: 'after', value: thirtyDaysAgo.toISOString().split('T')[0] };
        if (next['employmentStatus']) next['employmentStatus'] = { ...next['employmentStatus'], value: '' };
      } else {
        if (next['employmentStatus']) next['employmentStatus'] = { ...next['employmentStatus'], value: '' };
        if (next['hireDate']) next['hireDate'] = { ...next['hireDate'], value: '' };
      }
      return next;
    });

    setQuickSearch('');
    setPaginationModel((prev) => ({ ...prev, page: 0 }));
  };

  const handleColumnToggle = (field: string) =>
    setColumnVisibility((prev) => ({ ...prev, [field]: !prev[field] }));

  const handleShowAll = () =>
    setColumnVisibility(Object.keys(COLUMN_NAMES).reduce((a, k) => ({ ...a, [k]: true }), {}));

  const handleHideAll = () =>
    setColumnVisibility(Object.keys(COLUMN_NAMES).reduce((a, k) => ({ ...a, [k]: false }), {}));

  // ─── API DATA ─────────────────────────────────────────────────────────────
  const { data, isLoading, isFetching } = useEmployees({
    pageNumber: paginationModel.page + 1,
    pageSize: paginationModel.pageSize,
    filters: apiFilters,
  });

  const { data: deptData } = useDepartments();
  const departmentOptions = useMemo(() => deptData?.items.map((d: any) => ({ value: d.id, label: d.name })) || [], [deptData]);

  const { data: profData } = useProfessionsLookup();
  const professionOptions = useMemo(() => profData?.map((p: any) => ({ value: p.name, label: p.name })) || [], [profData]);

  // ─── PREMIUM EXPORT (REAL EXCEL & AUTO-DESIGN) ───────────────────────────
  const handleExport = async () => {
    // NOT: Eğer tüm sayfaları indirmek istersen, backend'indeki useEmployees hook'una 
    // limitsiz (örn: pageSize: 9999) bir istek atan ayrı bir fonksiyon bağlamak gerekir.
    // Şu an bu fonksiyon eldeki 'data.items' verisini premium formatta basar.
    if (!data?.items?.length) return;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Roster Records');

    // 1. Tüm Kolon Konfigürasyonu
    const allColumns = [
      { id: 'employeeNo', label: 'Employee No', getValue: (emp: any) => emp.employeeNo },
      { id: 'fullName', label: 'Full Name', getValue: (emp: any) => `${emp.firstName} ${emp.lastName}` },
      { id: 'departmentId', label: 'Department', getValue: (emp: any) => emp.department?.name || '' },
      { id: 'profession', label: 'Profession', getValue: (emp: any) => emp.professionName || '-' },
      { 
        id: 'employmentStatus', 
        label: 'Status', 
        getValue: (emp: any) => {
          if (emp.employmentStatus === 1) return 'Active';
          if (emp.employmentStatus === 2) return 'On Leave';
          if (emp.employmentStatus === 3) return 'Terminated';
          return 'Unknown';
        }
      },
      { id: 'hireDate', label: 'Hire Date', getValue: (emp: any) => formatDateDisplay(emp.hireDate) },
    ];

    // 2. Sadece görünür olan kolonları filtrele (columnVisibility state'ine göre)
    const visibleColumns = allColumns.filter(col => columnVisibility[col.id] !== false);

    // Excel kolon yapılandırmasını tanımla
    worksheet.columns = visibleColumns.map(col => ({
      header: col.label,
      key: col.id,
      width: 15 // Geçici genişlik, aşağıda dinamik optimize edilecek
    }));

    // 3. Başlık Satırı Tasarımı (Premium Dark Tasarım)
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28; // Başlığa nefes alma alanı
    headerRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFF' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '1A1A1A' } // Elit antrasit arka plan
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' };
    });

    // 4. Veri Satırlarını Ekleme ve Hücre Stilleme
    data.items.forEach((emp, index) => {
      const rowData: Record<string, any> = {};
      visibleColumns.forEach(col => {
        rowData[col.id] = col.getValue(emp);
      });

      const row = worksheet.addRow(rowData);
      row.height = 22; // Satır yüksekliği dengelendi

      // Zebra şerit efekti (Alternatif satır renklendirme)
      const isEven = index % 2 === 0;

      row.eachCell((cell, colNumber) => {
        const colId = visibleColumns[colNumber - 1].id;

        // Standart hücre yazı tipi ve hizalaması
        cell.font = { name: 'Segoe UI', size: 10, color: { argb: '333333' } };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        
        // Çok ince, estetik sınır çizgileri
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'EBF0F5' } },
          right: { style: 'thin', color: { argb: 'F4F7F9' } }
        };

        // Zebra arkalanı uygula
        if (!isEven) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F9FAFC' }
          };
        }

        // STATUS KOLONU ÖZEL ROZET TASARIMI (UI ile senkronize renkler)
        if (colId === 'employmentStatus') {
          const statusVal = cell.value;
          if (statusVal === 'Active') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'E8F5E9' } }; // Soft Yeşil
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: '2E7D32' } };
          } else if (statusVal === 'On Leave') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3E0' } }; // Soft Turuncu
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'E65100' } };
          } else if (statusVal === 'Terminated') {
            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEBEE' } }; // Soft Kırmızı
            cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'C62828' } };
          }
        }
      });
    });

    // 5. Dinamik Kolon Genişliği Hesaplama (Yazıların sığması ve "###" hatası olmaması için)
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell?.({ includeEmpty: true }, (cell) => {
        const valueLen = cell.value ? cell.value.toString().length : 0;
        if (valueLen > maxLen) {
          maxLen = valueLen;
        }
      });
      column.width = Math.max(maxLen + 4, 14); // İçeriğe göre genişlet, min 14 birim yap
    });

    // 6. Gerçek .xlsx Olarak İndirme Tetikleyicisi
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Uzantı artık tam standartta bir gerçek Excel dosyası (.xlsx)
    a.download = `SoftlarePMS_Roster_${new Date().toISOString().split('T')[0]}.xlsx`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const activeColumnFilterCount = Object.values(columnFilters).filter(f => !!f.value).length;
  const navigate = useNavigate();

  const columns: DataTableColumnDef[] = [
    {
      field: 'employeeNo',
      headerName: 'Employee No',
      flex: 1,
      minWidth: 185,
      filterType: 'text',
    },
    {
      field: 'fullName',
      headerName: 'Full Name',
      flex: 1.5,
      minWidth: 200,
      filterType: 'fullName',
      valueGetter: (_, row: any) => `${row.firstName} ${row.lastName}`,
    },
    {
      field: 'departmentId',
      headerName: 'Department',
      flex: 1,
      minWidth: 185,
      filterType: 'multi-select',
      filterOptions: departmentOptions,
      valueGetter: (_, row: any) => row.department?.name || '',
    },
    {
      field: 'profession',
      headerName: 'Profession',
      flex: 1.5,
      minWidth: 150,
      filterType: 'multi-select',
      filterOptions: professionOptions,
      valueGetter: (_, row: any) => row.professionName || '-',
      renderCell: (params) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: 'employmentStatus',
      headerName: 'Status',
      flex: 1,
      minWidth: 185,
      filterType: 'select',
      filterOptions: [
        { value: '1', label: 'Active' },
        { value: '2', label: 'On Leave' },
        { value: '3', label: 'Terminated' },
      ],
      renderCell: (params) => {
        const val = params.value as number;
        
        const getChipStyles = (status: number) => {
          switch(status) {
            case 1:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(46, 125, 50, 0.15)' : 'rgba(46, 125, 50, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#81c784' : '#2e7d32',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(129, 199, 132, 0.2)' : 'rgba(46, 125, 50, 0.15)',
                label: 'Active'
              };
            case 2:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(237, 108, 2, 0.15)' : 'rgba(237, 108, 2, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#ffb74d' : '#ed6c02',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 183, 77, 0.2)' : 'rgba(237, 108, 2, 0.15)',
                label: 'On Leave'
              };
            case 3:
              return {
                bg: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(211, 47, 47, 0.15)' : 'rgba(211, 47, 47, 0.08)',
                color: (theme: any) => theme.palette.mode === 'dark' ? '#e57373' : '#d32f2f',
                border: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(229, 115, 115, 0.2)' : 'rgba(211, 47, 47, 0.15)',
                label: 'Terminated'
              };
            default:
              return {
                bg: 'transparent',
                color: 'text.secondary',
                border: 'divider',
                label: 'Unknown'
              };
          }
        };

        const styles = getChipStyles(val);

        return (
          <Chip
            label={styles.label}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.75rem',
              backgroundColor: styles.bg,
              color: styles.color,
              border: '1px solid',
              borderColor: styles.border,
              borderRadius: '6px',
              height: '24px',
            }}
          />
        );
      },
    },
    {
      field: 'hireDate',
      headerName: 'Hire Date',
      flex: 1,
      minWidth: 185,
      filterType: 'date',
      valueGetter: (value: string | null | undefined) => {
        if (!value) return null;
        return new Date(value);
      },
      valueFormatter: (value: Date | null | undefined) => {
        if (!value) return '';
        return formatDateDisplay(value);
      },
    },
  ];

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1536, margin: '0 auto' }}>
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'text.primary',
              textShadow: (theme) => theme.palette.mode === 'dark' 
                ? '0 1px 2px rgba(0,0,0,0.5)' 
                : '0 1px 2px rgba(0,0,0,0.05)',
            }}
          >
            Roster Management
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage core employee records, probation statuses, and professions.
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
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
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'text.primary',
                }
              }}
            >
              Columns
            </Button>
          </Tooltip>

          <Menu
            anchorEl={columnMenuAnchor}
            open={Boolean(columnMenuAnchor)}
            onClose={() => setColumnMenuAnchor(null)}
            slotProps={{ paper: { sx: { borderRadius: 3, minWidth: 220, mt: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.1)' } } }}
          >
            <Box sx={{ px: 2, pt: 1.5, pb: 1 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 600 }}>
                Visible Columns
              </Typography>
            </Box>
            <Box sx={{ px: 1, pb: 1, display: 'flex', gap: 1 }}>
              <Button size="small" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleShowAll}>Show All</Button>
              <Button size="small" color="inherit" sx={{ flex: 1, borderRadius: 1.5 }} onClick={handleHideAll}>Hide All</Button>
            </Box>
            <Divider sx={{ mb: 0.5 }} />
            {Object.keys(COLUMN_NAMES).map((key) => (
              <MenuItem key={key} onClick={() => handleColumnToggle(key)} sx={{ py: 0.5 }}>
                <Checkbox checked={columnVisibility[key] !== false} size="small" sx={{ pointerEvents: 'none', py: 0 }} />
                <ListItemText primary={COLUMN_NAMES[key]} slotProps={{ primary: { variant: 'body2' } }} />
              </MenuItem>
            ))}
          </Menu>

          <Tooltip title="Export Roster to Excel" arrow>
            <Button
              variant="outlined"
              startIcon={<FileDownloadRounded />}
              onClick={handleExport}
              disabled={!data?.items?.length}
              sx={{
                borderRadius: '10px',
                borderColor: 'divider',
                color: 'text.primary',
                fontWeight: 600,
                textTransform: 'none',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: 'action.hover',
                  borderColor: 'text.primary',
                }
              }}
            >
              Export
            </Button>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── FILTER PANEL (PREMIUM GLASS EFFECT) ──────────────────────────── */}
      <Box
        sx={{
          background: (theme) => theme.palette.mode === 'dark' ? 'rgba(24, 24, 24, 0.85)' : 'rgba(255, 255, 255, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid',
          borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
          borderRadius: 4,
          p: 3,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 8px 32px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.2)'
            : '0 8px 32px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
          mb: 3,
          transition: 'box-shadow 0.3s ease',
        }}
      >
        <Stack spacing={2.5}>
          <TextField
            size="small"
            fullWidth
            placeholder="Quick search by first name, last name…"
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: 'text.secondary', fontSize: '1.1rem' }} />
                  </InputAdornment>
                ),
                endAdornment: quickSearch ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setQuickSearch('')} edge="end">
                      <CloseRounded fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ) : undefined,
              },
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                backgroundColor: 'background.paper',
                borderRadius: '10px',
                transition: 'box-shadow 0.2s ease, border-color 0.2s ease',
                boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 1px 2px rgba(0,0,0,0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                '&:hover': {
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 2px 8px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.04)',
                },
                '&.Mui-focused': {
                  boxShadow: (theme) => theme.palette.mode === 'dark' ? '0 0 0 3px rgba(255,255,255,0.05)' : '0 0 0 3px rgba(128,128,128,0.1)',
                }
              },
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: 'divider',
              },
              '& .Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: 'primary.main',
                borderWidth: '1px',
              }
            }}
          />

          <Divider sx={{ opacity: 0.4 }} />

          <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
            <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontWeight: 600, color: 'text.secondary' }}>
              <AutoAwesomeRounded fontSize="small" /> Quick Filters:
            </Typography>

            {(['all', 'active', 'new_hires', 'terminated'] as QuickFilter[]).map((code) => {
              const labels: Record<QuickFilter, string> = {
                all: 'All Records',
                active: 'Active Employees',
                new_hires: 'New Hires (30 Days)',
                terminated: 'Terminated',
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

      {/* ── DATA TABLE ─────────────────────────────────────────────────────── */}
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
          onRowClick={(id) => navigate(`/employees/${id}`)}
        />
      </Box>
    </Box>
  );
};