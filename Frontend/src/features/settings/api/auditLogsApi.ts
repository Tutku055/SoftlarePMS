import { apiClient } from '../../../config/apiClient';
import type { AuditLogDto, AuditLogItemDto, AuditLogsQueryParams, PaginatedList } from '../types';

export const getAuditLogs = async (params: AuditLogsQueryParams = {}): Promise<PaginatedList<AuditLogDto>> => {
  const { data } = await apiClient.get<PaginatedList<AuditLogDto>>('/auditlogs', {
    params: {
      pageNumber: params.pageNumber ?? 1,
      pageSize: params.pageSize ?? 10,
      searchTerm: params.searchTerm || undefined,
      tableName: params.tableName || undefined,
      action: params.action || undefined,
    },
  });
  return data;
};

export const getAuditLogDetails = async (
  correlationId: string,
  pageNumber: number = 1,
  pageSize: number = 20
): Promise<PaginatedList<AuditLogItemDto>> => {
  const { data } = await apiClient.get<PaginatedList<AuditLogItemDto>>(
    `/auditlogs/${correlationId}/details`,
    {
      params: {
        pageNumber,
        pageSize,
      },
    }
  );
  return data;
};
