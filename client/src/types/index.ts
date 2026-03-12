export interface Department {
  id: number;
  code: string;
  name: string;
  prefix: string;
  next_sequence: number;
  is_active: number;
}

export type UserRole = 'department_user' | 'compliance' | 'ceo_office' | 'admin';

export interface AuthPayload {
  userId: number;
  username: string;
  role: UserRole;
  departmentId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthPayload;
}

export interface Letterhead {
  id: number;
  department_id: number;
  reference_number: string;
  letter_date: string;
  approval_authority: string;
  description: string;
  notes: string | null;
  file_name: string;
  file_path: string;
  file_size_bytes: number | null;
  mime_type: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  // Version tracking
  current_version: number;
  updated_by: number | null;
  // Archive fields
  is_archived: number;
  archived_at: string | null;
  archived_by: number | null;
  archive_reference: string | null;
  // Display fields (joined)
  department_code?: string;
  department_name?: string;
  created_by_name?: string;
  updated_by_name?: string;
  archived_by_name?: string;
  snapshot_count?: number;
}

export interface UpdateLetterheadPayload {
  departmentId: number;
  letterDate: string;
  approvalAuthority: string;
  description: string;
  notes?: string;
  justification: string;
  file?: File | null;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DashboardSummary {
  totalLetterheads: number;
  thisMonthCount: number;
  departmentBreakdown: { department_name: string; department_code: string; count: number }[];
  recentActivity: Letterhead[];
}

export interface AuditLogEntry {
  id: number;
  entity_type: string;
  entity_id: number;
  action: string;
  performed_by: number;
  performed_by_name: string;
  details: string | null;
  created_at: string;
}

export interface ArchiveInfo {
  id: number;
  letterhead_id: number;
  archive_reference: string;
  storage_location: string;
  archived_by: number;
  archived_at: string;
  retention_until: string | null;
  metadata: Record<string, any>;
  archived_by_name?: string;
}

export interface LetterheadVersion {
  id: number;
  letterhead_id: number;
  version_number: number;
  department_id: number | null;
  reference_number: string | null;
  letter_date: string | null;
  approval_authority: string | null;
  description: string;
  notes: string | null;
  file_name: string | null;
  file_path: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  created_by: number | null;
  original_created_at: string | null;
  original_updated_at: string | null;
  modified_by: number;
  modified_by_name: string;
  created_by_name: string | null;
  department_name: string | null;
  department_code: string | null;
  modified_at: string;
  change_summary: string | null;
  archive_reason: string | null;
  archived_file_path: string | null;
}

export type VersionInfo = LetterheadVersion;
