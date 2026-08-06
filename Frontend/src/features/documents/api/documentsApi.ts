import { apiClient as api } from '../../../config/apiClient';
export interface DocumentDto {
  id: string;
  referenceId: string;
  ownerModule: number;
  documentType: number;
  fileName: string;
  filePath: string;
  fileSizeBytes: number;
  issueDate?: string;
  expiryDate?: string;
  createdByUserId: string;
  createdAt: string;
  isAvailable: boolean;
  lastCheckedAt?: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const documentsApi = {
  getDocuments: async (params?: {
    referenceId?: string;
    ownerModule?: number;
    documentType?: number;
    minFileSizeBytes?: number;
    maxFileSizeBytes?: number;
    extension?: string;
    extensionOperator?: string;
    expiryDateStart?: string;
    expiryDateEnd?: string;
    uploadDateStart?: string;
    uploadDateEnd?: string;
    fileName?: string;
    fileNameOperator?: string;
    isAvailable?: boolean;
    quickSearch?: string;
    pageNumber?: number;
    pageSize?: number;
  }): Promise<PaginatedList<DocumentDto>> => {
    const response = await api.get('/documents', { params });
    return response.data;
  },

  uploadDocument: async (formData: FormData): Promise<{ id: string }> => {
    const response = await api.post('/documents/upload', formData, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }]
    });
    return response.data;
  },

  uploadDocumentChunk: async (formData: FormData): Promise<{ id?: string, completed: boolean }> => {
    const response = await api.post('/documents/upload-chunk', formData, {
      transformRequest: [(data, headers) => {
        delete headers['Content-Type'];
        return data;
      }]
    });
    return response.data;
  },

  deleteDocument: async (id: string): Promise<void> => {
    await api.delete(`/documents/${id}`);
  },

  updateDocument: async (id: string, data: any): Promise<void> => {
    await api.put(`/documents/${id}`, data);
  },

  getDownloadUrl: (id: string): string => {
    return `${api.defaults.baseURL}/documents/${id}/download`;
  },

  downloadDocument: async (id: string, fileName: string): Promise<void> => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      if (error.response?.status === 404) {
        throw new Error('FILE_NOT_FOUND');
      }
      throw error;
    }
  },

  checkIntegrity: async (): Promise<{ totalChecked: number, missingCount: number, availableCount: number }> => {
    const response = await api.post('/documents/check-integrity');
    return response.data;
  }
};
