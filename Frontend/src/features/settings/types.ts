export interface AuditLogChangeDto {
  propertyName: string;
  oldValue: string | null;
  newValue: string | null;
}

export interface AuditLogItemDto {
  id: number;
  tableName: string;
  recordId: string;
  action: 'Created' | 'Modified' | 'Deleted' | string;
  isEntityActive: boolean;
  navigationRoute?: string;
  entityTitle?: string;
  changes: AuditLogChangeDto[];
}

export interface AuditLogDto {
  id: number;
  correlationId: string;
  tableName: string;
  recordId: string;
  action: 'Created' | 'Modified' | 'Deleted' | string;
  actionType?: 'created' | 'deleted' | 'modified' | 'updated' | string;
  itemCount?: number;
  changedByUserId: string | null;
  changedByEmail: string;
  changedAt: string;
  isEntityActive: boolean;
  totalChangesCount?: number;
  entityTitle?: string;
  changes: AuditLogChangeDto[];
  navigationRoute?: string;
  items?: AuditLogItemDto[];
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface AuditLogsQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  tableName?: string;
  action?: string;
}
