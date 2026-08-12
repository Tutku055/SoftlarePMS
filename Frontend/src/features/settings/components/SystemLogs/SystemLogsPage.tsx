import React, { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Paper,
  CircularProgress,
  Pagination,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Collapse,
  Divider,
  Alert,
} from '@mui/material';
import {
  SearchRounded,
  CloseRounded,
  RefreshRounded,
  HistoryToggleOffRounded,
  KeyboardArrowDownRounded,
  KeyboardArrowUpRounded,
  OpenInNewRounded,
  LockRounded,
  DeleteForeverRounded,
  AddCircleOutlineRounded,
  EditRounded,
  FingerprintRounded,
  EmailRounded,
  CalendarTodayRounded,
  TableChartRounded,
  CheckCircleRounded,
  WarningAmberRounded,
  FilterListRounded,
  StorageRounded,
  LayersRounded,
  TuneRounded,
  AccessTimeRounded,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../../components/PageHeader/PageHeader';
import { useAuditLogs, useAuditLogDetails } from '../../hooks/useAuditLogs';
import { useAuthStore } from '../../../../store/useAuthStore';
import type { AuditLogDto, AuditLogChangeDto } from '../../types';

const NON_ROUTABLE_TABLES: readonly string[] = [];

const getEntityRoute = (tableName: string, recordId: string, navigationRoute?: string | null): string => {
  if (navigationRoute && navigationRoute.trim()) {
    return navigationRoute.trim();
  }

  const table = (tableName || '').trim().toLowerCase();
  const rawId = (recordId || '').trim();
  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId);
  const cleanId = isGuid ? encodeURIComponent(rawId) : '';

  if (table.includes('timesheet')) {
    return `/finance/timesheets`;
  }
  if (table.includes('payroll')) {
    return `/finance/payrolls`;
  }
  if (table.includes('employeeaddress') || table.includes('employeeaddresses') || table.includes('employeeadress') || table.includes('address')) {
    return cleanId ? `/employees/addresses/${cleanId}` : `/employees/addresses`;
  }
  if (table.includes('employeenote') || table.includes('employeereference') || table.includes('employeecompensation')) {
    return cleanId ? `/employees/${cleanId}` : `/employees/roster`;
  }
  if (table.includes('employee')) {
    return cleanId ? `/employees/${cleanId}` : `/employees/roster`;
  }
  if (table.includes('profession')) {
    return `/departments/professions`;
  }
  if (table.includes('departmentemployee')) {
    return `/departments/employees`;
  }
  if (table.includes('department')) {
    return cleanId ? `/departments/${cleanId}` : `/departments/list`;
  }
  if (table.includes('user')) {
    return cleanId ? `/settings/users/${cleanId}` : `/settings/users`;
  }
  if (table.includes('rolepermission') || table.includes('rolepermissions')) {
    return `/settings/roles`;
  }
  if (table.includes('role') || table.includes('permission')) {
    return cleanId ? `/settings/roles/${cleanId}` : `/settings/roles`;
  }
  if (table.includes('document')) {
    return cleanId ? `/documents/${cleanId}` : `/documents/archive`;
  }
  if (table.includes('overtime')) {
    return `/finance/overtime-types`;
  }
  if (table.includes('rollover') || table.includes('yearend') || table.includes('year-end')) {
    return `/settings/year-end`;
  }
  if (table.includes('notification')) {
    return `/notifications`;
  }
  if (table.includes('audit') || table.includes('log')) {
    return `/settings/system-logs`;
  }
  if (table.includes('calendarevent') || table.includes('calendarevents')) {
    return `/calendar`;
  }
  if (table.includes('calendarnote') || table.includes('calendarnotes')) {
    return `/calendar`;
  }

  return cleanId ? `/${table}/${cleanId}` : `/${table}`;
};

const getRequiredPermission = (tableName: string): string => {
  const table = (tableName || '').trim().toLowerCase();

  if (table.includes('timesheet')) {
    return 'Timesheets.Read';
  }
  if (table.includes('payroll')) {
    return 'Payrolls.Read';
  }
  if (table.includes('employeeaddress') || table.includes('employeeaddresses') || table.includes('employeeadress') || table.includes('address')) {
    return 'EmployeeAddresses.Read';
  }
  if (table.includes('employeenote')) {
    return 'EmployeeNotes.Read';
  }
  if (table.includes('employeereference')) {
    return 'EmployeeReferences.Read';
  }
  if (table.includes('employee')) {
    return 'Employees.Read';
  }
  if (table.includes('profession')) {
    return 'Professions.Read';
  }
  if (table.includes('department')) {
    return 'Departments.Read';
  }
  if (table.includes('document')) {
    return 'Documents.Read';
  }
  if (table.includes('role') || table.includes('permission')) {
    return 'Roles.Read';
  }
  if (table.includes('user')) {
    return 'Users.Read';
  }
  if (table.includes('overtime')) {
    return 'OvertimeTypes.Read';
  }
  if (table.includes('rollover') || table.includes('year')) {
    return 'AuditLogs.Read';
  }
  if (table.includes('notification')) {
    return 'Notifications.Read';
  }

  return 'AuditLogs.Read';
};

interface BulkAuditTransactionDetailsProps {
  correlationId: string;
  itemCount: number;
  isExpanded: boolean;
  renderActionBadge: (label: string, type: 'created' | 'deleted' | 'modified' | 'updated') => React.ReactNode;
  renderActionButton: (tableName: string, recordId: string, isEntityActive: boolean, navigationRoute?: string | null) => React.ReactNode;
  renderChangesContent: (changes?: AuditLogChangeDto[], action?: string) => React.ReactNode;
}

const BulkAuditTransactionDetails: React.FC<BulkAuditTransactionDetailsProps> = ({
  correlationId,
  itemCount,
  isExpanded,
  renderActionBadge,
  renderActionButton,
  renderChangesContent,
}) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const [subPageNumber, setSubPageNumber] = useState<number>(1);
  const pageSize = 20;

  const { data, isLoading, isFetching } = useAuditLogDetails(
    correlationId,
    subPageNumber,
    pageSize,
    isExpanded
  );

  const subItems = data?.items || [];
  const totalSubCount = data?.totalCount ?? itemCount;
  const totalSubPages = data?.totalPages || Math.ceil(totalSubCount / pageSize) || 1;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Threshold UI Info Banner for Bulk Transactions (> 50 items) */}
      {itemCount > 50 && (
        <Alert
          severity="info"
          icon={<LayersRounded sx={{ fontSize: 20 }} />}
          sx={{
            borderRadius: 2.5,
            fontWeight: 600,
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.12)' : '#EEF2FF',
            color: isDark ? '#C7D2FE' : '#3730A3',
            border: `1px solid ${isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.25)'}`,
            '& .MuiAlert-icon': {
              color: isDark ? '#818CF8' : '#4F46E5',
            },
          }}
        >
          Bulk Transaction Detected: <strong>{itemCount.toLocaleString()}</strong> items processed in this batch.
        </Alert>
      )}

      {/* Loading Spinner */}
      {isLoading ? (
        <Box
          sx={{
            py: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1.5,
          }}
        >
          <CircularProgress size={32} thickness={4} sx={{ color: 'primary.main' }} />
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            Loading transaction sub-items...
          </Typography>
        </Box>
      ) : subItems.length === 0 ? (
        <Box sx={{ py: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No sub-items found for this transaction.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {subItems.map((item, subIdx) => {
              const subActionType =
                item.action?.toLowerCase().includes('created')
                  ? 'created'
                  : item.action?.toLowerCase().includes('deleted')
                  ? 'deleted'
                  : 'modified';

              const itemGlobalIndex = (subPageNumber - 1) * pageSize + subIdx + 1;

              return (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2.5,
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.02)'
                      : '#FFFFFF',
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  {/* Sub-item Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 1.5,
                      mb: 1.5,
                      pb: 1.25,
                      borderBottom: `1px dashed ${theme.palette.divider}`,
                    }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 700,
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                        }}
                      >
                        #{itemGlobalIndex} {item.entityTitle || item.tableName}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: 'text.secondary',
                          fontFamily: 'monospace',
                        }}
                      >
                        (ID: {item.recordId})
                      </Typography>
                      {item.changedAt && (
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.5,
                            fontSize: '0.725rem',
                            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                            px: 0.75,
                            py: 0.2,
                            borderRadius: 1,
                            border: `1px solid ${theme.palette.divider}`,
                          }}
                        >
                          <AccessTimeRounded sx={{ fontSize: 12, opacity: 0.7 }} />
                          {new Date(item.changedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </Typography>
                      )}
                    </Box>

                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1.5,
                      }}
                    >
                      {renderActionBadge(item.action, subActionType)}
                      {renderActionButton(
                        item.tableName,
                        item.recordId,
                        item.isEntityActive,
                        item.navigationRoute
                      )}
                    </Box>
                  </Box>

                  {/* Sub-item Changes */}
                  {renderChangesContent(item.changes, item.action)}
                </Paper>
              );
            })}
          </Box>

          {/* Sub-Pagination Bar for Batch / Multi-item groups */}
          {totalSubPages > 1 && (
            <Box
              sx={{
                mt: 1,
                pt: 2,
                borderTop: `1px dashed ${theme.palette.divider}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 1.5,
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Showing items{' '}
                <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {(subPageNumber - 1) * pageSize + 1} -{' '}
                  {Math.min(subPageNumber * pageSize, totalSubCount)}
                </Typography>{' '}
                of{' '}
                <Typography component="span" variant="caption" sx={{ fontWeight: 700, color: 'text.primary' }}>
                  {totalSubCount.toLocaleString()}
                </Typography>
              </Typography>

              <Pagination
                count={totalSubPages}
                page={subPageNumber}
                onChange={(_, newPage) => setSubPageNumber(newPage)}
                size="small"
                color="primary"
                shape="rounded"
                disabled={isFetching}
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export const SystemLogsPage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const navigate = useNavigate();
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const [pageNumber, setPageNumber] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [searchInput, setSearchInput] = useState<string>('');
  const [activeActionFilter, setActiveActionFilter] = useState<string>('All');
  const [expandedGroupIds, setExpandedGroupIds] = useState<Set<string>>(new Set());

  const queryParams = useMemo(
    () => ({
      pageNumber,
      pageSize,
      searchTerm: searchInput.trim() || undefined,
      action: activeActionFilter !== 'All' ? activeActionFilter : undefined,
    }),
    [pageNumber, pageSize, searchInput, activeActionFilter]
  );

  const { data, isLoading, refetch } = useAuditLogs(queryParams);
  const groupedLogs: AuditLogDto[] = data?.items || [];
  const totalCount = data?.totalCount || 0;
  const totalPages = data?.totalPages || 1;

  const toggleGroupExpanded = (correlationId: string) => {
    setExpandedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(correlationId)) {
        next.delete(correlationId);
      } else {
        next.add(correlationId);
      }
      return next;
    });
  };

  const handleExpandAll = () => {
    if (groupedLogs.length === 0) return;
    if (expandedGroupIds.size === groupedLogs.length) {
      setExpandedGroupIds(new Set());
    } else {
      setExpandedGroupIds(new Set(groupedLogs.map((g) => String(g.correlationId))));
    }
  };

  const renderActionBadge = (label: string, type: 'created' | 'deleted' | 'modified' | 'updated') => {
    if (type === 'created') {
      return (
        <Chip
          icon={<AddCircleOutlineRounded sx={{ fontSize: 16 }} />}
          label={label}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
            color: isDark ? '#34D399' : '#047857',
            borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        />
      );
    }
    if (type === 'deleted') {
      return (
        <Chip
          icon={<DeleteForeverRounded sx={{ fontSize: 16 }} />}
          label={label}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEF2F2',
            color: isDark ? '#F87171' : '#B91C1C',
            borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        />
      );
    }
    if (type === 'modified') {
      return (
        <Chip
          icon={<EditRounded sx={{ fontSize: 16 }} />}
          label={label}
          size="small"
          sx={{
            fontWeight: 600,
            fontSize: '0.75rem',
            backgroundColor: isDark ? 'rgba(99, 102, 241, 0.2)' : '#EEF2FF',
            color: isDark ? '#818CF8' : '#4338CA',
            borderColor: isDark ? 'rgba(99, 102, 241, 0.3)' : '#C7D2FE',
            borderWidth: 1,
            borderStyle: 'solid',
          }}
        />
      );
    }
    return (
      <Chip
        icon={<TuneRounded sx={{ fontSize: 16 }} />}
        label={label}
        size="small"
        sx={{
          fontWeight: 600,
          fontSize: '0.75rem',
          backgroundColor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FFFBEB',
          color: isDark ? '#FBBF24' : '#B45309',
          borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
          borderWidth: 1,
          borderStyle: 'solid',
        }}
      />
    );
  };

  const renderChangesContent = (changes?: AuditLogChangeDto[], action?: string) => {
    if (!changes || changes.length === 0) {
      return (
        <Box
          sx={{
            py: 2,
            px: 2.5,
            borderRadius: 2,
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.02)' : '#F9FAFB',
            border: `1px dashed ${theme.palette.divider}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          }}
        >
          <WarningAmberRounded sx={{ color: 'text.secondary', fontSize: 18 }} />
          <Typography variant="body2" color="text.secondary">
            No specific property mutation deltas recorded for this transaction.
          </Typography>
        </Box>
      );
    }

    const act = (action || '').toLowerCase();

    // Specific Badge Layout for Created items
    if (act === 'created') {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          {changes.map((change, idx) => {
            const propLabel = change.formattedPropertyName || change.propertyName;
            const displayVal = change.newValue !== null && change.newValue !== undefined ? change.newValue : '<empty>';
            const hasRawDiff = Boolean(change.newValueRaw && change.newValueRaw !== change.newValue);

            return (
              <Tooltip
                key={`${change.propertyName}-${idx}`}
                title={
                  hasRawDiff
                    ? `Property: ${change.propertyName} | Raw ID: ${change.newValueRaw}`
                    : `Property: ${change.propertyName}`
                }
                arrow
                placement="top"
              >
                <Paper
                  elevation={0}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                    border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0'}`,
                    color: isDark ? '#6EE7B7' : '#15803D',
                    transition: 'transform 0.15s ease',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      lineHeight: 1,
                      color: isDark ? '#34D399' : '#059669',
                    }}
                  >
                    +
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                    }}
                  >
                    {propLabel}: <strong style={{ fontWeight: 700 }}>{displayVal}</strong>
                  </Typography>
                </Paper>
              </Tooltip>
            );
          })}
        </Box>
      );
    }

    // Specific Badge Layout for Deleted items
    if (act === 'deleted') {
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
          {changes.map((change, idx) => {
            const propLabel = change.formattedPropertyName || change.propertyName;
            const displayVal = change.oldValue !== null && change.oldValue !== undefined ? change.oldValue : '<empty>';
            const hasRawDiff = Boolean(change.oldValueRaw && change.oldValueRaw !== change.oldValue);

            return (
              <Tooltip
                key={`${change.propertyName}-${idx}`}
                title={
                  hasRawDiff
                    ? `Property: ${change.propertyName} | Raw ID: ${change.oldValueRaw}`
                    : `Property: ${change.propertyName}`
                }
                arrow
                placement="top"
              >
                <Paper
                  elevation={0}
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 1.75,
                    py: 0.85,
                    borderRadius: 2,
                    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                    border: `1px solid ${isDark ? 'rgba(239, 68, 68, 0.3)' : '#FECACA'}`,
                    color: isDark ? '#FCA5A5' : '#B91C1C',
                    transition: 'transform 0.15s ease',
                    cursor: 'default',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      fontWeight: 800,
                      fontSize: '1rem',
                      lineHeight: 1,
                      color: isDark ? '#F87171' : '#DC2626',
                    }}
                  >
                    -
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: '0.8125rem',
                      textDecoration: 'line-through',
                    }}
                  >
                    {propLabel}: {displayVal}
                  </Typography>
                </Paper>
              </Tooltip>
            );
          })}
        </Box>
      );
    }

    // Standard Delta View for Modified / Other items
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
        {changes.map((change, idx) => {
          const propLabel = change.formattedPropertyName || change.propertyName;
          const oldDisplay = change.oldValue !== null ? change.oldValue : '<null>';
          const newDisplay = change.newValue !== null ? change.newValue : '<null>';
          const hasOldRawDiff = Boolean(change.oldValueRaw && change.oldValueRaw !== change.oldValue);
          const hasNewRawDiff = Boolean(change.newValueRaw && change.newValueRaw !== change.newValue);

          return (
            <Paper
              key={`${change.propertyName}-${idx}`}
              elevation={0}
              sx={{
                p: { xs: 1.5, sm: 2 },
                borderRadius: 2.5,
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#F8FAFC',
                border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.07)' : '#E2E8F0'}`,
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
                alignItems: 'center',
                gap: { xs: 1, md: 2 },
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : '#CBD5E1',
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F1F5F9',
                },
              }}
            >
              {/* Column 1: Human-Readable Property Name with Technical Tooltip */}
              <Tooltip
                title={
                  change.propertyName !== propLabel
                    ? `System Property: ${change.propertyName}`
                    : `Property: ${change.propertyName}`
                }
                arrow
                placement="top"
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0, cursor: 'default' }}>
                  <Box
                    sx={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      backgroundColor: theme.palette.primary.main,
                      flexShrink: 0,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                      color: theme.palette.text.primary,
                      fontSize: '0.875rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {propLabel}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Column 2: Value Delta Flow with Raw ID accountability */}
              <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1.25 }}>
                <Tooltip
                  title={hasOldRawDiff ? `Raw ID / Value: ${change.oldValueRaw}` : ''}
                  arrow
                  placement="top"
                  disableHoverListener={!hasOldRawDiff}
                >
                  <Box
                    component="span"
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.8125rem',
                      fontFamily: hasOldRawDiff ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2',
                      color: isDark ? '#FCA5A5' : '#B91C1C',
                      textDecoration: 'line-through',
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                      cursor: hasOldRawDiff ? 'help' : 'default',
                    }}
                  >
                    {oldDisplay}
                  </Box>
                </Tooltip>
                <Typography
                  component="span"
                  sx={{
                    fontWeight: 700,
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                    userSelect: 'none',
                  }}
                >
                  ➔
                </Typography>
                <Tooltip
                  title={hasNewRawDiff ? `Raw ID / Value: ${change.newValueRaw}` : ''}
                  arrow
                  placement="top"
                  disableHoverListener={!hasNewRawDiff}
                >
                  <Box
                    component="span"
                    sx={{
                      px: 1.25,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontSize: '0.8125rem',
                      fontFamily: hasNewRawDiff ? 'inherit' : 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                      color: isDark ? '#86EFAC' : '#15803D',
                      fontWeight: 600,
                      border: `1px solid ${isDark ? 'rgba(16, 185, 129, 0.3)' : '#BBF7D0'}`,
                      wordBreak: 'break-word',
                      maxWidth: '100%',
                      cursor: hasNewRawDiff ? 'help' : 'default',
                    }}
                  >
                    {newDisplay}
                  </Box>
                </Tooltip>
              </Box>
            </Paper>
          );
        })}
      </Box>
    );
  };

  const renderActionButton = (
    tableName: string,
    recordId: string,
    isEntityActive: boolean,
    navigationRoute?: string | null
  ) => {
    if (!isEntityActive) {
      return (
        <Tooltip title="Entity Not Found or Deleted from Database" arrow placement="top">
          <span>
            <button
              type="button"
              disabled
              className="bg-red-500 text-white rounded-lg cursor-not-allowed opacity-75 shadow-none transition-all flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                backgroundColor: '#EF4444',
                color: '#FFFFFF',
                borderRadius: 8,
                cursor: 'not-allowed',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <DeleteForeverRounded sx={{ fontSize: 20 }} />
            </button>
          </span>
        </Tooltip>
      );
    }

    const routeUrl = getEntityRoute(tableName, recordId, navigationRoute);

    const isNonRoutable = NON_ROUTABLE_TABLES.some(
      (table) => table.toLowerCase() === (tableName || '').trim().toLowerCase()
    ) || !routeUrl;

    if (isNonRoutable) {
      return (
        <Tooltip
          title="System Entity - No direct detail view available"
          arrow
          placement="top"
        >
          <span>
            <button
              type="button"
              disabled
              className="bg-slate-500 text-white rounded-lg cursor-not-allowed opacity-80 shadow-none transition-all flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                backgroundColor: '#64748B',
                color: '#FFFFFF',
                borderRadius: 8,
                cursor: 'not-allowed',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <StorageRounded sx={{ fontSize: 19 }} />
            </button>
          </span>
        </Tooltip>
      );
    }

    const requiredPermission = getRequiredPermission(tableName);
    const hasReadPermission = hasPermission(requiredPermission);

    if (!hasReadPermission) {
      return (
        <Tooltip
          title={`Access Denied: Missing ${requiredPermission} permission`}
          arrow
          placement="top"
        >
          <span>
            <button
              type="button"
              disabled
              className="bg-orange-500 text-white rounded-lg cursor-not-allowed opacity-85 shadow-none transition-all flex items-center justify-center"
              style={{
                width: 38,
                height: 38,
                backgroundColor: '#F97316',
                color: '#FFFFFF',
                borderRadius: 8,
                cursor: 'not-allowed',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockRounded sx={{ fontSize: 19 }} />
            </button>
          </span>
        </Tooltip>
      );
    }

    const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test((recordId || '').trim());
    const buttonTooltip = isGuid
      ? `Navigate to ${tableName} (#${recordId.trim().substring(0, 8)}...)`
      : `Navigate to ${tableName} overview`;

    return (
      <Tooltip
        title={buttonTooltip}
        arrow
        placement="top"
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(routeUrl);
          }}
          className="bg-green-500 hover:bg-green-600 active:scale-95 text-white rounded-lg cursor-pointer shadow-sm transition-all flex items-center justify-center"
          style={{
            width: 38,
            height: 38,
            backgroundColor: '#10B981',
            color: '#FFFFFF',
            borderRadius: 8,
            cursor: 'pointer',
            border: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 4px rgba(16, 185, 129, 0.3)',
          }}
        >
          <OpenInNewRounded sx={{ fontSize: 19 }} />
        </button>
      </Tooltip>
    );
  };

  const quickFilterActions = ['All', 'Created', 'Modified', 'Deleted'];

  return (
    <Box sx={{ p: { xs: 2, sm: 3.5 }, maxWidth: 1400, mx: 'auto' }}>
      <PageHeader
        title="System Logs"
        subtitle="Audit trail and correlated transaction viewer with join-resolution."
        icon={<HistoryToggleOffRounded />}
        actions={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              size="small"
              onClick={handleExpandAll}
              startIcon={
                expandedGroupIds.size === groupedLogs.length && groupedLogs.length > 0 ? (
                  <KeyboardArrowUpRounded />
                ) : (
                  <KeyboardArrowDownRounded />
                )
              }
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
              }}
            >
              {expandedGroupIds.size === groupedLogs.length && groupedLogs.length > 0
                ? 'Collapse All'
                : 'Expand All'}
            </Button>

            <Button
              variant="outlined"
              size="small"
              onClick={() => refetch()}
              disabled={isLoading}
              startIcon={<RefreshRounded />}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
                borderColor: theme.palette.divider,
                color: 'text.primary',
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
                },
              }}
            >
              Refresh Logs
            </Button>
          </Box>
        }
      />

      {/* ── 2. Filters & Search Bar ───────────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          borderRadius: 3,
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.7)' : '#FFFFFF',
          border: `1px solid ${theme.palette.divider}`,
          backdropFilter: 'blur(8px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'stretch', md: 'center' },
            gap: 2,
          }}
        >
          {/* Quick Action Filter Chips */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <FilterListRounded sx={{ color: 'text.secondary', fontSize: 20, mr: 0.5 }} />
            {quickFilterActions.map((action) => {
              const isSelected = activeActionFilter === action;
              return (
                <Chip
                  key={action}
                  label={action}
                  clickable
                  onClick={() => {
                    setActiveActionFilter(action);
                    setPageNumber(1);
                  }}
                  color={isSelected ? 'primary' : 'default'}
                  variant={isSelected ? 'filled' : 'outlined'}
                  sx={{
                    fontWeight: 600,
                    borderRadius: 2,
                    fontSize: '0.8125rem',
                  }}
                />
              );
            })}
          </Box>

          {/* Search Input Field */}
          <TextField
            size="small"
            placeholder="Search by entity, email, or details..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPageNumber(1);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchRounded sx={{ color: 'text.secondary', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchInput ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSearchInput('');
                        setPageNumber(1);
                      }}
                    >
                      <CloseRounded sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={{
              minWidth: { xs: '100%', md: 320 },
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              },
            }}
          />
        </Box>
      </Paper>

      {/* ── 3. Logs List Table Container ─────────────────────────────── */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 3,
          backgroundColor: isDark ? 'rgba(31, 41, 55, 0.7)' : '#FFFFFF',
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        {/* Table Column Header */}
        <Box
          sx={{
            py: 1.75,
            px: { xs: 2, sm: 3 },
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.75)' : '#F8FAFC',
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: 'text.secondary',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            gap: 2,
          }}
        >
          <Box sx={{ flex: '0 0 44px', width: 44, textAlign: 'center' }}>Expand</Box>
          <Box sx={{ flex: '0 0 240px', width: 240 }}>Entity &amp; Record</Box>
          <Box sx={{ flex: '0 0 170px', width: 170 }}>Action</Box>
          <Box sx={{ flex: '1 1 200px', minWidth: 200 }}>Performed By</Box>
          <Box sx={{ flex: '0 0 200px', width: 200 }}>Timestamp</Box>
          <Box sx={{ flex: '0 0 90px', width: 90, textAlign: 'center' }}>Status</Box>
        </Box>

        {/* Loading State */}
        {isLoading ? (
          <Box sx={{ py: 10, textAlign: 'center' }}>
            <CircularProgress size={36} thickness={4} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Loading system audit logs...
            </Typography>
          </Box>
        ) : groupedLogs.length === 0 ? (
          /* Empty State */
          <Box sx={{ py: 10, px: 3, textAlign: 'center' }}>
            <Box
              sx={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F3F4F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2,
                color: 'text.secondary',
              }}
            >
              <HistoryToggleOffRounded sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              No audit logs found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchInput || activeActionFilter !== 'All'
                ? 'Try adjusting your search criteria or action filter.'
                : 'System transactions and mutations will appear here automatically.'}
            </Typography>
          </Box>
        ) : (
          /* Grouped Log Rows */
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            {groupedLogs.map((group, index) => {
              const isExpanded = expandedGroupIds.has(group.correlationId);
              const dateObj = new Date(group.changedAt);
              const formattedDate = dateObj.toLocaleDateString([], {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              });
              const formattedTime = dateObj.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });

              return (
                <Box key={group.correlationId}>
                  {index > 0 && <Divider />}
                  <Box
                    sx={{
                      transition: 'background-color 0.2s ease',
                      backgroundColor: isExpanded
                        ? isDark
                          ? 'rgba(255, 255, 255, 0.03)'
                          : 'rgba(243, 244, 246, 0.6)'
                        : 'transparent',
                      '&:hover': {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.04)'
                          : 'rgba(249, 250, 251, 0.9)',
                      },
                    }}
                  >
                    {/* Summary Bar Row */}
                    <Box
                      onClick={() => toggleGroupExpanded(group.correlationId)}
                      sx={{
                        py: 2,
                        px: { xs: 2, sm: 3 },
                        display: 'flex',
                        flexDirection: { xs: 'column', md: 'row' },
                        alignItems: { xs: 'flex-start', md: 'center' },
                        gap: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {/* Expand Chevron Icon */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '0 0 44px' },
                          width: { xs: '100%', md: 44 },
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: { xs: 'space-between', md: 'center' },
                        }}
                      >
                        <IconButton
                          size="small"
                          sx={{
                            transition: 'transform 0.25s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                            color: 'text.secondary',
                          }}
                        >
                          <KeyboardArrowDownRounded />
                        </IconButton>

                        {/* Mobile Header action button */}
                        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                          {renderActionButton(
                            group.tableName,
                            group.recordId,
                            group.isEntityActive,
                            group.navigationRoute
                          )}
                        </Box>
                      </Box>

                      {/* Table Name & Record ID */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '0 0 240px' },
                          width: { xs: '100%', md: 240 },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <TableChartRounded sx={{ fontSize: 18, color: 'text.secondary' }} />
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.text.primary,
                              letterSpacing: '-0.01em',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {group.entityTitle || group.tableName}
                          </Typography>
                          {(group.itemCount ?? group.items?.length ?? 1) > 1 && (
                            <Chip
                              icon={<LayersRounded sx={{ fontSize: 12 }} />}
                              label={`${(group.itemCount ?? group.items?.length ?? 1).toLocaleString()}`}
                              size="small"
                              sx={{
                                height: 20,
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                backgroundColor: isDark
                                  ? 'rgba(99, 102, 241, 0.2)'
                                  : '#EEF2FF',
                                color: isDark ? '#A5B4FC' : '#4F46E5',
                              }}
                            />
                          )}
                        </Box>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            fontFamily: 'monospace',
                            display: 'block',
                            mt: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={group.recordId}
                        >
                          ID: {group.recordId}
                        </Typography>
                      </Box>

                      {/* Action Badge */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '0 0 170px' },
                          width: { xs: '100%', md: 170 },
                        }}
                      >
                        {renderActionBadge(
                          group.action,
                          (group.actionType as 'created' | 'deleted' | 'modified' | 'updated') || 'modified'
                        )}
                      </Box>

                      {/* Performed By Email */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '1 1 200px' },
                          minWidth: { md: 200 },
                          width: { xs: '100%', md: 'auto' },
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <EmailRounded
                            sx={{ fontSize: 16, color: 'text.secondary', flexShrink: 0 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 500,
                              color: theme.palette.text.primary,
                              wordBreak: 'break-all',
                            }}
                          >
                            {group.changedByEmail || 'System'}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Timestamp */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '0 0 200px' },
                          width: { xs: '100%', md: 200 },
                        }}
                      >
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                            <CalendarTodayRounded
                              sx={{ fontSize: 14, color: 'text.secondary', opacity: 0.8 }}
                            />
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 600,
                                color: 'text.primary',
                                fontSize: '0.8125rem',
                                letterSpacing: '-0.01em',
                              }}
                            >
                              {formattedDate}
                            </Typography>
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: 'text.secondary',
                              fontFamily: 'ui-monospace, monospace',
                              fontSize: '0.725rem',
                              ml: 2.75,
                              opacity: 0.85,
                            }}
                          >
                            {formattedTime}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Status & Navigation Action Button */}
                      <Box
                        sx={{
                          flex: { xs: '1 1 auto', md: '0 0 90px' },
                          width: { xs: '100%', md: 90 },
                          display: { xs: 'none', md: 'flex' },
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {renderActionButton(
                          group.tableName,
                          group.recordId,
                          group.isEntityActive,
                          group.navigationRoute
                        )}
                      </Box>
                    </Box>

                    {/* ── 4. Accordion Expanded Details ── */}
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box
                        sx={{
                          px: { xs: 2, sm: 3, md: 4 },
                          pb: 3,
                          pt: 1.5,
                          backgroundColor: isDark
                            ? 'rgba(17, 24, 39, 0.45)'
                            : 'rgba(243, 244, 246, 0.45)',
                          borderTop: `1px dashed ${theme.palette.divider}`,
                        }}
                      >
                        {/* Meta Information Ribbon */}
                        <Box
                          sx={{
                            mb: 2.5,
                            p: 1.5,
                            borderRadius: 2.5,
                            backgroundColor: isDark
                              ? 'rgba(255, 255, 255, 0.03)'
                              : '#FFFFFF',
                            border: `1px solid ${theme.palette.divider}`,
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: { xs: 1.5, sm: 3 },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexWrap: 'wrap',
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <FingerprintRounded
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography variant="caption" color="text.secondary">
                              Correlation ID:
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                            >
                              {group.correlationId}
                            </Typography>
                          </Box>

                          {group.changedByUserId && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                User ID:
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{ fontFamily: 'monospace', fontWeight: 600 }}
                              >
                                {group.changedByUserId}
                              </Typography>
                            </Box>
                          )}

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="caption" color="text.secondary">
                              Database Status:
                            </Typography>
                            <Chip
                              icon={
                                group.isEntityActive ? (
                                  <CheckCircleRounded sx={{ fontSize: 14 }} />
                                ) : (
                                  <DeleteForeverRounded sx={{ fontSize: 14 }} />
                                )
                              }
                              label={
                                group.isEntityActive
                                  ? 'Active in DB'
                                  : 'Inactive / Deleted'
                              }
                              size="small"
                              color={group.isEntityActive ? 'success' : 'error'}
                              variant="outlined"
                              sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          </Box>

                          {(group.itemCount ?? group.items?.length ?? 1) > 1 && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="caption" color="text.secondary">
                                Transaction Entries:
                              </Typography>
                              <Chip
                                label={`${(group.itemCount ?? group.items?.length ?? 1).toLocaleString()} records`}
                                size="small"
                                sx={{ height: 22, fontSize: '0.7rem', fontWeight: 600 }}
                              />
                            </Box>
                          )}
                        </Box>

                        {/* Render Group Items (Single vs Multi-item / Bulk Sub-Sections) */}
                        {(group.itemCount ?? group.items?.length ?? 1) <= 1 ? (
                          <Box>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 700,
                                mb: 1.5,
                                color: theme.palette.text.primary,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              Property Changes ({group.items?.[0]?.changes?.length ?? group.changes?.length ?? 0})
                            </Typography>
                            {renderChangesContent(
                              group.items?.[0]?.changes ?? group.changes,
                              group.items?.[0]?.action ?? group.action
                            )}
                          </Box>
                        ) : (
                          <BulkAuditTransactionDetails
                            correlationId={group.correlationId}
                            itemCount={group.itemCount ?? group.items?.length ?? 2}
                            isExpanded={isExpanded}
                            renderActionBadge={renderActionBadge}
                            renderActionButton={renderActionButton}
                            renderChangesContent={renderChangesContent}
                          />
                        )}
                      </Box>
                    </Collapse>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* ── 5. Pagination Footer ────────────────────────────────────── */}
        <Box
          sx={{
            py: 2,
            px: { xs: 2, sm: 3 },
            backgroundColor: isDark ? 'rgba(17, 24, 39, 0.6)' : '#F9FAFB',
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
          }}
        >
          {/* Record Count & Page Info */}
          <Typography variant="body2" color="text.secondary">
            Showing{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {totalCount > 0 ? (pageNumber - 1) * pageSize + 1 : 0}
            </Typography>{' '}
            -{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {Math.min(pageNumber * pageSize, totalCount)}
            </Typography>{' '}
            of{' '}
            <Typography
              component="span"
              variant="body2"
              sx={{ fontWeight: 600, color: 'text.primary' }}
            >
              {totalCount}
            </Typography>{' '}
            records
          </Typography>

          {/* Pagination Controls & Page Size */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControl size="small" variant="outlined">
              <InputLabel id="page-size-label" sx={{ fontSize: '0.8125rem' }}>
                Rows
              </InputLabel>
              <Select
                labelId="page-size-label"
                value={pageSize}
                label="Rows"
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageNumber(1);
                }}
                sx={{
                  borderRadius: 2,
                  fontSize: '0.8125rem',
                  height: 36,
                }}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={25}>25</MenuItem>
                <MenuItem value={50}>50</MenuItem>
                <MenuItem value={100}>100</MenuItem>
              </Select>
            </FormControl>

            <Pagination
              count={totalPages}
              page={pageNumber}
              onChange={(_, page) => setPageNumber(page)}
              color="primary"
              shape="rounded"
              size="medium"
              showFirstButton
              showLastButton
              sx={{
                '& .MuiPaginationItem-root': {
                  fontWeight: 600,
                  borderRadius: 1.5,
                },
              }}
            />
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};
