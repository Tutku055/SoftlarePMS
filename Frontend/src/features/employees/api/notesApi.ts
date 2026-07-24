import { apiClient } from '../../../config/apiClient';
import type { 
  EmployeeNoteDto, 
  CreateEmployeeNoteDto, 
  UpdateEmployeeNoteDto,
  NoteCategory
} from '../types';

export const getEmployeeNotes = async (
  employeeId: string, 
  category?: NoteCategory, 
  isConfidential?: boolean
): Promise<EmployeeNoteDto[]> => {
  const params = new URLSearchParams();
  if (category !== undefined) params.append('category', category.toString());
  if (isConfidential !== undefined) params.append('isConfidential', isConfidential.toString());
  
  const queryString = params.toString() ? `?${params.toString()}` : '';
  const { data } = await apiClient.get<EmployeeNoteDto[]>(`/employees/${employeeId}/notes${queryString}`);
  return data;
};

export const createEmployeeNote = async (
  employeeId: string, 
  note: CreateEmployeeNoteDto
): Promise<EmployeeNoteDto> => {
  const { data } = await apiClient.post<EmployeeNoteDto>(`/employees/${employeeId}/notes`, note);
  return data;
};

export const updateEmployeeNote = async (
  employeeId: string, 
  noteId: string, 
  note: UpdateEmployeeNoteDto
): Promise<void> => {
  await apiClient.put(`/employees/${employeeId}/notes/${noteId}`, note);
};

export const deleteEmployeeNote = async (
  employeeId: string, 
  noteId: string
): Promise<void> => {
  await apiClient.delete(`/employees/${employeeId}/notes/${noteId}`);
};
