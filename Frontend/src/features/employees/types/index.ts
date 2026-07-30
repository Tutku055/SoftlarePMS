export const NoteCategory = {
  General: 1,
  HrInternal: 2,
  Performance: 3,
  Disciplinary: 4,
  InterviewAndOnboarding: 5,
} as const;

export type NoteCategory = (typeof NoteCategory)[keyof typeof NoteCategory];

export const ReferenceRelationship = {
  FormerManager: 1,
  Colleague: 2,
  DirectReport: 3,
  Client: 4,
  Academic: 5,
  Other: 6,
} as const;

export type ReferenceRelationship = (typeof ReferenceRelationship)[keyof typeof ReferenceRelationship];

export interface EmployeeNoteDto {
  id: string;
  title: string;
  content: string;
  category: NoteCategory;
  isConfidential: boolean;
  createdAt: string;
}

export interface CreateEmployeeNoteDto {
  title: string;
  content: string;
  category: NoteCategory;
  isConfidential: boolean;
}

export interface UpdateEmployeeNoteDto {
  title: string;
  content: string;
  category: NoteCategory;
  isConfidential: boolean;
}

export interface EmployeeReferenceDto {
  id: string;
  fullName: string;
  company: string;
  title: string;
  relationship: ReferenceRelationship;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface CreateEmployeeReferenceDto {
  fullName: string;
  company: string;
  title: string;
  relationship: ReferenceRelationship;
  phoneNumber: string;
  email: string;
  notes?: string;
}

export interface UpdateEmployeeReferenceDto {
  fullName: string;
  company: string;
  title: string;
  relationship: ReferenceRelationship;
  phoneNumber: string;
  email: string;
  notes: string;
}

export interface PaginatedList<T> {
  items: T[];
  pageNumber: number;
  totalPages: number;
  totalCount: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export interface DepartmentDto {
  id: string;
  name: string;
  description: string;
  employeeCount?: number;
}

export interface EmployeeDto {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  professionId?: string;
  professionName?: string;
  employmentStatus: number;
  hireDate: string;
  terminationDate?: string;
  probationEndDate?: string;
  gender?: number;
  workingHoursPerWeek?: number;
  annualVacationDays?: number;
  carriedOverLeaves?: number;
  email?: string;
  phone?: string;
  city?: string;
  rate?: number;
  department?: DepartmentDto;
}

export interface CreateEmployeeDto {
  employeeNo: string;
  firstName: string;
  lastName: string;
  gender: number;
  dateOfBirth: string;
  nationality: string;
  professionId: string;
  employmentStatus: number;
  hireDate: string;
  workingHoursPerWeek: number;
  annualVacationDays: number;
  carriedOverLeaves: number;
  salaryType: number;
  departmentId?: string;
  // Initial primary address (saved as separate EmployeeAddress entity)
  addressLine: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
}

export interface CreatedEmployeeDto {
  id: string;
  employeeNo: string;
  hireDate: string;
}

export interface FilterCriteria {
  field: string;
  operator: string;
  value: string | null;
}

export interface GetEmployeesParams {
  pageNumber: number;
  pageSize: number;
  filters?: FilterCriteria[];
}

export interface EmployeeAddressDto {
  id: string;
  addressLine: string;
  country: string;
  city: string;
  state: string;
  postalCode: string;
  isPrimary: boolean;
  startDate?: string;
  endDate?: string;
}

export interface EmployeeDetailDto {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  gender: number;
  dateOfBirth: string;
  nationality: string;
  professionId?: string;
  professionName?: string;
  employmentStatus: number;
  hireDate: string;
  terminationDate?: string;
  probationEndDate?: string;
  workingHoursPerWeek: number;
  annualVacationDays: number;
  carriedOverLeaves: number;
  usedLeaveDaysThisYear: number;
  department?: DepartmentDto;
  
  addresses: EmployeeAddressDto[];
  compensation?: any;
  compensations?: any[];
  documents: any[];
  notes: EmployeeNoteDto[];
  references: EmployeeReferenceDto[];
}

export interface UpdateEmployeeCommand {
  employeeId: string;
  firstName: string;
  lastName: string;
  gender: number;
  dateOfBirth: string;
  nationality: string;
  professionId: string;
  employmentStatus: number;
  hireDate: string;
  terminationDate?: string | null;
  probationEndDate?: string | null;
  workingHoursPerWeek: number;
  annualVacationDays: number;
  carriedOverLeaves: number;
  departmentId?: string | null;
}

export interface UpdateEmployeeAddressCommand {
  employeeId: string;
  addressLine: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  isPrimary: boolean;
}
