import { useQuery } from '@tanstack/react-query';
import { getAuditLogs, getAuditLogDetails } from '../api/auditLogsApi';
import type { AuditLogsQueryParams } from '../types';

export const useAuditLogs = (params: AuditLogsQueryParams) => {
  return useQuery({
    queryKey: ['auditLogs', params],
    queryFn: () => getAuditLogs(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useAuditLogDetails = (
  correlationId: string | null | undefined,
  pageNumber: number = 1,
  pageSize: number = 20,
  enabled: boolean = false
) => {
  return useQuery({
    queryKey: ['auditLogDetails', correlationId, pageNumber, pageSize],
    queryFn: () => getAuditLogDetails(correlationId!, pageNumber, pageSize),
    enabled: Boolean(correlationId) && enabled,
    staleTime: 60_000,
  });
};
