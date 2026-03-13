export interface Department {
  id: number;
  code: string;
  name: string;
  prefix: string;
  next_sequence: number;
  is_active: number;
  created_at: Date;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  display_name: string;
  email: string | null;
  department_id: number | null;
  role: UserRole;
  is_active: number;
  created_at: Date;
}

export type UserRole = 'department_user' | 'compliance' | 'ceo_office' | 'admin';

export interface Letterhead {
  id: number;
  department_id: number;
  reference_number: string;
  letter_date: Date;
  approval_authority: string;
  description: string | null;
  notes: string | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string;
  created_by: number;
  updated_by: number | null;
  created_at: Date;
  updated_at: Date;
  is_archived: number;
  archived_at: Date | null;
  archived_by: number | null;
  archive_reference: string | null;
  current_version: number;
}

export interface LetterheadWithDetails extends Letterhead {
  department_code: string;
  department_name: string;
  created_by_name: string;
  archived_by_name: string | null;
  updated_by_name: string | null;
  has_versions: number | null;
  snapshot_count: number;
}

export interface LetterheadVersion {
  id: number;
  letterhead_id: number;
  version_number: number;
  department_id: number | null;
  reference_number: string | null;
  letter_date: Date | null;
  approval_authority: string | null;
  description: string;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_by: number | null;
  original_created_at: Date | null;
  original_updated_at: Date | null;
  modified_by: number;
  modified_at: Date;
  change_summary: string | null;
  archive_reason: string | null;
  archived_file_path: string | null;
}

export interface LetterheadVersionWithDetails extends LetterheadVersion {
  modified_by_name: string;
  created_by_name: string | null;
  department_name: string | null;
  department_code: string | null;
}

export interface UpdateLetterheadInput {
  departmentId: number;
  letterDate: string;
  approvalAuthority: string;
  description: string;
  notes?: string | null;
  justification: string;
}

export interface AuditLog {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  performed_by: number;
  details: string | null;
  created_at: Date;
}

export interface AuthPayload {
  userId: number;
  username: string;
  role: UserRole;
  departmentId: number | null;
}

export interface RefreshTokenPayload {
  userId: number;
  type: 'refresh';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LetterheadFilter {
  departmentId?: number;
  startDate?: string;
  endDate?: string;
  approvalAuthority?: string;
  search?: string;
  isArchived?: boolean;
  page?: number;
  limit?: number;
}

export interface DashboardSummary {
  totalLetterheads: number;
  thisMonthCount: number;
  departmentBreakdown: { department_name: string; department_code: string; count: number }[];
  recentActivity: LetterheadWithDetails[];
}
