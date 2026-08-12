import {
  DataGrid,
} from '@mui/x-data-grid';
import type {
  GridColDef,
  GridPaginationModel,
  GridColumnVisibilityModel,
  GridColumnHeaderParams,
  GridRowSelectionModel,
} from '@mui/x-data-grid';
import { Box, Stack, TextField, MenuItem, Typography } from '@mui/material';

export type CustomFilterValue = { value: string; operator: string };
export type FilterType = 'text' | 'date' | 'select' | 'multi-select' | 'number' | 'fullName' | 'fileSize';

export type DataTableColumnDef = Omit<GridColDef, 'renderHeader'> & {
  filterType?: FilterType;
  filterOptions?: { value: string; label: string }[];
  disableFilter?: boolean;
};

interface DataTableProps {
  data: any[];
  totalCount: number;
  loading: boolean;
  columns: DataTableColumnDef[];
  paginationModel: GridPaginationModel;
  onPaginationModelChange: (model: GridPaginationModel) => void;
  columnVisibilityModel?: GridColumnVisibilityModel;
  onColumnVisibilityModelChange?: (model: GridColumnVisibilityModel) => void;
  customFilters: Record<string, CustomFilterValue>;
  onCustomFilterChange: (field: string, value: string, operator: string) => void;
  onRowClick?: (id: string) => void;
  checkboxSelection?: boolean;
  selectedRowIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
}

const STRING_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'equals', label: 'Equals' },
  { value: 'startswith', label: 'Starts with' },
  { value: 'endswith', label: 'Ends with' },
];

const FULLNAME_OPERATORS = [
  { value: 'contains', label: 'Contains' },
  { value: 'firstName', label: 'First Name' },
  { value: 'lastName', label: 'Last Name' },
];

const DATE_OPERATORS = [
  { value: 'is', label: 'Is' },
  { value: 'after', label: 'After' },
  { value: 'before', label: 'Before' },
];

const NUMBER_OPERATORS = [
  { value: 'is', label: 'Is' },
  { value: 'morethan', label: 'More than' },
  { value: 'lessthan', label: 'Less than' },
];

const FILESIZE_OPERATORS = [
  { value: 'biggerthan', label: 'Bigger than' },
  { value: 'smallerthan', label: 'Smaller than' },
];

const SELECT_OPERATORS = [
  { value: 'is', label: 'Is' },
  { value: 'not', label: 'Is Not' },
];

const MULTI_SELECT_OPERATORS = [
  { value: 'in', label: 'In' },
  { value: 'notin', label: 'Not In' },
];

// Premium Input Stilleri
const premiumInputSx = {
  '& .MuiOutlinedInput-root': {
    fontSize: '0.75rem',
    borderRadius: '6px',
    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)',
    height: '28px',
    transition: 'all 0.2s ease',
    '& fieldset': {
      borderColor: 'transparent',
      transition: 'all 0.2s ease',
    },
    '&:hover fieldset': {
      borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-focused': {
      backgroundColor: 'background.paper',
      boxShadow: (theme: any) => theme.palette.mode === 'dark' 
        ? '0 2px 8px rgba(0,0,0,0.4)' 
        : '0 2px 6px rgba(0,0,0,0.05)',
      '& fieldset': {
        borderColor: 'primary.main',
        borderWidth: '1px',
      }
    },
    '& input[type="date"]::-webkit-calendar-picker-indicator, & input[type="datetime-local"]::-webkit-calendar-picker-indicator, & input[type="month"]::-webkit-calendar-picker-indicator': {
      filter: (theme: any) => theme.palette.mode === 'dark' ? 'brightness(0) invert(1)' : 'none',
      cursor: 'pointer',
      opacity: 0.8,
      '&:hover': {
        opacity: 1,
      },
    },
  },
  // Seçim kutularındaki aşağı ok simgesini tamamen yok etme
  '& .MuiSelect-icon': { 
    display: 'none !important' 
  },
  // Ok kalktığı için sağ tarafta kalan gereksiz boşluğu sıfırlama (Yazının sığmasını sağlar)
  '& .MuiSelect-select': { 
    paddingRight: '8px !important',
    paddingLeft: '8px !important',
  }
};

import React from 'react';

// ... (imports remain)

interface FilterHeaderProps {
  field: string;
  headerName: string;
  filterType: FilterType;
  customFilters: Record<string, CustomFilterValue>;
  onCustomFilterChange: (field: string, value: string, operator: string) => void;
  options?: { value: string; label: string }[];
}

const FilterHeader: React.FC<FilterHeaderProps> = ({
  field,
  headerName,
  filterType,
  customFilters,
  onCustomFilterChange,
  options
}) => {
  const filterState = customFilters[field] || { value: '', operator: (filterType === 'text' || filterType === 'fullName') ? 'contains' : filterType === 'multi-select' ? 'in' : (filterType === 'fileSize' ? 'biggerthan' : 'is') };
  const { value, operator } = filterState;

  const getOpList = () => {
    if (filterType === 'date') return DATE_OPERATORS;
    if (filterType === 'select') return SELECT_OPERATORS;
    if (filterType === 'multi-select') return MULTI_SELECT_OPERATORS;
    if (filterType === 'number') return NUMBER_OPERATORS;
    if (filterType === 'fullName') return FULLNAME_OPERATORS;
    if (filterType === 'fileSize') return FILESIZE_OPERATORS;
    return STRING_OPERATORS;
  };
  const opList = getOpList();

  return (
    <Stack spacing={0.5} sx={{ width: '100%', pt: 1, pb: 0.5, height: '100%', justifyContent: 'flex-end' }}>
      <Typography 
        variant="subtitle2" 
        sx={{ 
          fontWeight: 600, 
          lineHeight: 1,
          color: value ? 'primary.main' : 'text.primary',
          letterSpacing: '-0.01em',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          transition: 'color 0.2s ease',
        }}
      >
        {headerName}
      </Typography>
      
      <Box sx={{ display: 'flex', gap: 0.5 }}>
        {/* Operator Selector */}
        <TextField
          select
          size="small"
          value={operator}
          onChange={(e) => onCustomFilterChange(field, value, e.target.value)}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          slotProps={{
            select: {
              MenuProps: { disableScrollLock: true }
            }
          }}
          sx={{
            width: '92px',
            flexShrink: 0,
            ...premiumInputSx,
            '& .MuiSelect-select': { py: 0.5, display: 'flex', alignItems: 'center' }
          }}
        >
          {opList.map((opt) => (
            <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>

        {/* Value Input */}
        {(filterType === 'select' || filterType === 'fileSize') && options ? (
          <TextField
            select
            size="small"
            value={value}
            onChange={(e) => onCustomFilterChange(field, e.target.value, operator)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            slotProps={{
              select: {
                MenuProps: { disableScrollLock: true }
              }
            }}
            sx={{
              flex: 1,
              ...premiumInputSx,
              '& .MuiSelect-select': { py: 0.5, display: 'flex', alignItems: 'center' }
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>All</MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        ) : filterType === 'multi-select' && options ? (
          <TextField
            select
            size="small"
            value={value ? value.split(',') : []}
            onChange={(e) => {
              const val = e.target.value as unknown as string[];
              if (val.includes('') || val.length === 0) {
                onCustomFilterChange(field, '', operator);
              } else {
                onCustomFilterChange(field, val.join(','), operator);
              }
            }}
            slotProps={{
              select: {
                multiple: true,
                MenuProps: { disableScrollLock: true },
                renderValue: (selected: any) => {
                  const arr = selected as string[];
                  if (arr.length === 0 || (arr.length === 1 && arr[0] === '')) return 'All';
                  if (arr.length === 1) return options.find(o => o.value === arr[0])?.label || arr[0];
                  return `${arr.length} selected`;
                }
              }
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{
              flex: 1,
              ...premiumInputSx,
              '& .MuiSelect-select': { py: 0.5, display: 'flex', alignItems: 'center' }
            }}
          >
            <MenuItem value="" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>All</MenuItem>
            {options.map((opt) => (
              <MenuItem key={opt.value} value={opt.value} sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                {opt.label}
              </MenuItem>
            ))}
          </TextField>
        ) : filterType === 'date' ? (
          <TextField
            type="date"
            size="small"
            value={value}
            onChange={(e) => onCustomFilterChange(field, e.target.value, operator)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{
              flex: 1,
              ...premiumInputSx,
              '& input': { py: 0.5, px: 1, fontSize: '0.75rem' }
            }}
          />
        ) : (filterType === 'number' || filterType === 'fileSize') ? (
          <TextField
            type="number"
            size="small"
            placeholder={filterType === 'fileSize' ? `Value (MB)...` : `Value...`}
            value={value}
            onChange={(e) => onCustomFilterChange(field, e.target.value, operator)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{
              flex: 1,
              ...premiumInputSx,
              '& input': { py: 0.5, px: 1, fontSize: '0.75rem' }
            }}
          />
        ) : (
          <TextField
            size="small"
            placeholder={`Value...`}
            value={value}
            onChange={(e) => onCustomFilterChange(field, e.target.value, operator)}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            sx={{
              flex: 1,
              ...premiumInputSx,
              '& input': { py: 0.5, px: 1, fontSize: '0.75rem', '&::placeholder': { opacity: 0.5 } }
            }}
          />
        )}
      </Box>
    </Stack>
  );
};

export const DataTable = ({
  data,
  totalCount,
  loading,
  columns,
  paginationModel,
  onPaginationModelChange,
  columnVisibilityModel,
  onColumnVisibilityModelChange,
  customFilters,
  onCustomFilterChange,
  onRowClick,
  checkboxSelection = false,
  selectedRowIds,
  onSelectionChange,
}: DataTableProps) => {
  const customFiltersRef = React.useRef(customFilters);
  customFiltersRef.current = customFilters;
  const onCustomFilterChangeRef = React.useRef(onCustomFilterChange);
  onCustomFilterChangeRef.current = onCustomFilterChange;

  const mappedColumns: GridColDef[] = React.useMemo(() => columns.map((col) => {
    const gridCol: GridColDef = { ...col } as GridColDef;
    
    if (col.filterType && !col.disableFilter) {
      gridCol.renderHeader = (_params: GridColumnHeaderParams) => (
        <FilterHeader
          field={col.field}
          headerName={col.headerName || col.field}
          filterType={col.filterType!}
          customFilters={customFiltersRef.current}
          onCustomFilterChange={(f, v, o) => onCustomFilterChangeRef.current(f, v, o)}
          options={col.filterOptions}
        />
      );
    }
    return gridCol;
  }), [columns]);

  return (
    <Box sx={{ width: '100%' }}>
      <DataGrid
        rows={data}
        columns={mappedColumns}
        getRowId={(row) => row.id}
        loading={loading}
        rowCount={totalCount}
        autoHeight
        paginationMode="server"
        paginationModel={paginationModel}
        onPaginationModelChange={onPaginationModelChange}
        pageSizeOptions={[5, 10, 25, 50]}
        columnHeaderHeight={84}
        columnVisibilityModel={columnVisibilityModel}
        onColumnVisibilityModelChange={onColumnVisibilityModelChange}
        checkboxSelection={checkboxSelection}
        keepNonExistentRowsSelected={true}
        rowSelectionModel={
          checkboxSelection && selectedRowIds 
            ? { type: 'include', ids: new Set(selectedRowIds) }
            : undefined
        }
        onRowSelectionModelChange={checkboxSelection && onSelectionChange ? (model: GridRowSelectionModel) => {
          const newSet = new Set<string>();
          model.ids.forEach((id) => newSet.add(String(id)));
          onSelectionChange(newSet);
        } : undefined}
        disableRowSelectionOnClick
        disableMultipleRowSelection={!checkboxSelection}
        disableColumnMenu
        onRowClick={onRowClick ? (params) => onRowClick(params.row.id) : undefined}
        sx={{
          border: 'none',
          backgroundColor: 'transparent',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)',
            borderBottom: '1px solid',
            borderColor: 'divider',
          },
          '& .MuiDataGrid-columnHeader:focus, & .MuiDataGrid-columnHeader:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-cell': {
            borderBottom: '1px solid',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            fontSize: '0.875rem',
            cursor: onRowClick ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
          },
          '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
            outline: 'none',
          },
          '& .MuiDataGrid-row': {
            transition: 'background-color 0.2s ease',
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: '1px solid',
            borderColor: 'divider',
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.01)' : 'transparent',
          }
        }}
      />
    </Box>
  );
};
