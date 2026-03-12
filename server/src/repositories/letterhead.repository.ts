import { BaseDBAdapter } from '../db';
import { Letterhead, LetterheadWithDetails, LetterheadFilter, PaginatedResult, LetterheadVersionWithDetails } from '../types';

export class LetterheadRepository {
  constructor(private db: BaseDBAdapter) {}

  async create(data: Omit<Letterhead, 'id' | 'created_at' | 'updated_at' | 'updated_by' | 'is_archived' | 'archived_at' | 'archived_by' | 'archive_reference' | 'current_version'>, txDb: BaseDBAdapter): Promise<Letterhead> {
    const result = await txDb.queryOne<Letterhead>(
      `INSERT INTO letterheads
        (department_id, reference_number, letter_date, approval_authority, description, notes, file_name, file_path, file_size_bytes, mime_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [data.department_id, data.reference_number, data.letter_date, data.approval_authority,
       data.description, data.notes, data.file_name, data.file_path, data.file_size_bytes, data.mime_type, data.created_by]
    );
    return result!;
  }

  async update(
    id: number,
    data: Partial<Letterhead>,
    userId: number,
    changeSummary?: string,
    archiveReason?: string,
    archivedFilePath?: string | null,
    txDb?: BaseDBAdapter
  ): Promise<Letterhead> {
    const db = txDb || this.db;
    
    // Get current version before update
    const current = await db.queryOne<LetterheadWithDetails>(
      `SELECT l.*, 
        d.code AS department_code, 
        d.name AS department_name, 
        u.display_name AS created_by_name,
        au.display_name AS archived_by_name,
        uu.display_name AS updated_by_name,
        CASE WHEN EXISTS(SELECT 1 FROM letterhead_versions WHERE letterhead_id = l.id) 
             THEN l.current_version ELSE NULL END as has_versions,
        GREATEST(l.current_version - 1, 0)::int AS snapshot_count
       FROM letterheads l
       JOIN departments d ON l.department_id = d.id
       JOIN users u ON l.created_by = u.id
       LEFT JOIN users au ON l.archived_by = au.id
       LEFT JOIN users uu ON l.updated_by = uu.id
       WHERE l.id = $1`,
      [id]
    );
    if (!current) throw new Error('Letterhead not found');
    
    // Save current state to version history
    await db.execute(
      `INSERT INTO letterhead_versions 
        (letterhead_id, version_number, department_id, reference_number, letter_date, approval_authority,
         description, notes, file_name, file_path, file_size_bytes, mime_type, created_by,
         original_created_at, original_updated_at, modified_by, change_summary, archive_reason, archived_file_path)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
      [
        id,
        current.current_version,
        current.department_id,
        current.reference_number,
        current.letter_date,
        current.approval_authority,
        current.description || '',
        current.notes,
        current.file_name,
        current.file_path,
        current.file_size_bytes,
        current.mime_type,
        current.created_by,
        current.created_at,
        current.updated_at,
        userId,
        changeSummary || 'Updated letter details',
        archiveReason || null,
        archivedFilePath || null,
      ]
    );
    
    // Build dynamic SET clause
    const sets: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (data.department_id !== undefined) {
      sets.push(`department_id = $${paramIndex++}`);
      params.push(data.department_id);
    }
    if (data.letter_date !== undefined) {
      sets.push(`letter_date = $${paramIndex++}`);
      params.push(data.letter_date);
    }
    if (data.approval_authority !== undefined) {
      sets.push(`approval_authority = $${paramIndex++}`);
      params.push(data.approval_authority);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }
    if (data.notes !== undefined) {
      sets.push(`notes = $${paramIndex++}`);
      params.push(data.notes);
    }
    if (data.file_name !== undefined) {
      sets.push(`file_name = $${paramIndex++}`);
      params.push(data.file_name);
    }
    if (data.file_path !== undefined) {
      sets.push(`file_path = $${paramIndex++}`);
      params.push(data.file_path);
    }
    if (data.file_size_bytes !== undefined) {
      sets.push(`file_size_bytes = $${paramIndex++}`);
      params.push(data.file_size_bytes);
    }
    if (data.mime_type !== undefined) {
      sets.push(`mime_type = $${paramIndex++}`);
      params.push(data.mime_type);
    }
    if (data.is_archived !== undefined) {
      sets.push(`is_archived = $${paramIndex++}`);
      params.push(data.is_archived);
    }
    if (data.archived_at !== undefined) {
      sets.push(`archived_at = $${paramIndex++}`);
      params.push(data.archived_at);
    }
    if (data.archived_by !== undefined) {
      sets.push(`archived_by = $${paramIndex++}`);
      params.push(data.archived_by);
    }
    if (data.archive_reference !== undefined) {
      sets.push(`archive_reference = $${paramIndex++}`);
      params.push(data.archive_reference);
    }
    if (data.updated_by !== undefined) {
      sets.push(`updated_by = $${paramIndex++}`);
      params.push(data.updated_by);
    }

    sets.push(`current_version = current_version + 1`);
    sets.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const result = await db.queryOne<Letterhead>(
      `UPDATE letterheads
       SET ${sets.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      params
    );

    return result!;
  }

  async getVersionHistory(letterheadId: number): Promise<LetterheadVersionWithDetails[]> {
    return this.db.query<LetterheadVersionWithDetails>(
      `SELECT 
        v.id,
        v.letterhead_id,
        v.version_number,
        v.department_id,
        v.reference_number,
        v.letter_date,
        v.approval_authority,
        v.description,
        v.notes,
        v.file_name,
        v.file_path,
        v.file_size_bytes,
        v.mime_type,
        v.created_by,
        v.original_created_at,
        v.original_updated_at,
        v.modified_by,
        v.modified_at,
        v.change_summary,
        v.archive_reason,
        v.archived_file_path,
        mu.display_name AS modified_by_name,
        cu.display_name AS created_by_name,
        d.name AS department_name,
        d.code AS department_code
       FROM letterhead_versions v
       JOIN users mu ON v.modified_by = mu.id
       LEFT JOIN users cu ON v.created_by = cu.id
       LEFT JOIN departments d ON v.department_id = d.id
       WHERE v.letterhead_id = $1
       ORDER BY v.version_number DESC, v.modified_at DESC`,
      [letterheadId]
    );
  }

  async createArchive(data: {
    letterhead_id: number;
    archive_reference: string;
    storage_location: string;
    archived_by: number;
    retention_until: Date;
    metadata: any;
  }): Promise<any> {
    return this.db.queryOne(
      `INSERT INTO letterhead_archives
        (letterhead_id, archive_reference, storage_location, archived_by, retention_until, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [data.letterhead_id, data.archive_reference, data.storage_location, data.archived_by, data.retention_until, JSON.stringify(data.metadata)]
    );
  }

  async findArchiveByLetterheadId(letterheadId: number): Promise<any | null> {
    return this.db.queryOne(
      `SELECT a.*, u.display_name as archived_by_name
       FROM letterhead_archives a
       JOIN users u ON a.archived_by = u.id
       WHERE a.letterhead_id = $1
       ORDER BY a.archived_at DESC
       LIMIT 1`,
      [letterheadId]
    );
  }

  async findById(id: number): Promise<LetterheadWithDetails | null> {
    return this.db.queryOne<LetterheadWithDetails>(
      `SELECT l.*, 
        d.code AS department_code, 
        d.name AS department_name, 
        u.display_name AS created_by_name,
        au.display_name AS archived_by_name,
        uu.display_name AS updated_by_name,
        CASE WHEN EXISTS(SELECT 1 FROM letterhead_versions WHERE letterhead_id = l.id) 
             THEN l.current_version ELSE NULL END as has_versions,
        GREATEST(l.current_version - 1, 0)::int AS snapshot_count
       FROM letterheads l
       JOIN departments d ON l.department_id = d.id
       JOIN users u ON l.created_by = u.id
       LEFT JOIN users au ON l.archived_by = au.id
       LEFT JOIN users uu ON l.updated_by = uu.id
       WHERE l.id = $1`,
      [id]
    );
  }

  async findFiltered(filter: LetterheadFilter, departmentId?: number): Promise<PaginatedResult<LetterheadWithDetails>> {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Department scoping
    const deptId = filter.departmentId || departmentId;
    if (deptId) {
      conditions.push(`l.department_id = $${paramIndex++}`);
      params.push(deptId);
    }

    if (filter.startDate) {
      conditions.push(`l.letter_date >= $${paramIndex++}`);
      params.push(filter.startDate);
    }

    if (filter.endDate) {
      conditions.push(`l.letter_date <= $${paramIndex++}`);
      params.push(filter.endDate);
    }

    if (filter.approvalAuthority) {
      conditions.push(`l.approval_authority LIKE $${paramIndex++}`);
      params.push(`%${filter.approvalAuthority}%`);
    }

    if (filter.search) {
      conditions.push(`(l.reference_number LIKE $${paramIndex} OR l.description LIKE $${paramIndex} OR l.notes LIKE $${paramIndex})`);
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    if (filter.isArchived !== undefined) {
      conditions.push(`l.is_archived = $${paramIndex++}`);
      params.push(filter.isArchived ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const countResult = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM letterheads l ${whereClause}`,
      params
    );
    const total = parseInt(countResult?.count || '0', 10);

    const dataParams = [...params, limit, offset];
    const data = await this.db.query<LetterheadWithDetails>(
      `SELECT l.*, 
        d.code AS department_code, 
        d.name AS department_name, 
        u.display_name AS created_by_name,
        au.display_name AS archived_by_name,
        uu.display_name AS updated_by_name,
        CASE WHEN EXISTS(SELECT 1 FROM letterhead_versions WHERE letterhead_id = l.id) 
             THEN l.current_version ELSE NULL END as has_versions,
        GREATEST(l.current_version - 1, 0)::int AS snapshot_count
       FROM letterheads l
       JOIN departments d ON l.department_id = d.id
       JOIN users u ON l.created_by = u.id
       LEFT JOIN users au ON l.archived_by = au.id
       LEFT JOIN users uu ON l.updated_by = uu.id
       ${whereClause}
       ORDER BY l.created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      dataParams
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findAllFiltered(filter: LetterheadFilter, departmentId?: number): Promise<LetterheadWithDetails[]> {
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    const deptId = filter.departmentId || departmentId;
    if (deptId) {
      conditions.push(`l.department_id = $${paramIndex++}`);
      params.push(deptId);
    }
    if (filter.startDate) {
      conditions.push(`l.letter_date >= $${paramIndex++}`);
      params.push(filter.startDate);
    }
    if (filter.endDate) {
      conditions.push(`l.letter_date <= $${paramIndex++}`);
      params.push(filter.endDate);
    }
    if (filter.approvalAuthority) {
      conditions.push(`l.approval_authority LIKE $${paramIndex++}`);
      params.push(`%${filter.approvalAuthority}%`);
    }
    if (filter.search) {
      conditions.push(`(l.reference_number LIKE $${paramIndex} OR l.description LIKE $${paramIndex} OR l.notes LIKE $${paramIndex})`);
      params.push(`%${filter.search}%`);
      paramIndex++;
    }

    if (filter.isArchived !== undefined) {
      conditions.push(`l.is_archived = $${paramIndex++}`);
      params.push(filter.isArchived ? 1 : 0);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    return this.db.query<LetterheadWithDetails>(
      `SELECT l.*, 
        d.code AS department_code, 
        d.name AS department_name, 
        u.display_name AS created_by_name,
        au.display_name AS archived_by_name,
        uu.display_name AS updated_by_name,
        CASE WHEN EXISTS(SELECT 1 FROM letterhead_versions WHERE letterhead_id = l.id) 
             THEN l.current_version ELSE NULL END as has_versions
       FROM letterheads l
       JOIN departments d ON l.department_id = d.id
       JOIN users u ON l.created_by = u.id
       LEFT JOIN users au ON l.archived_by = au.id
       LEFT JOIN users uu ON l.updated_by = uu.id
       ${whereClause}
       ORDER BY l.created_at DESC`,
      params
    );
  }

  async getDepartmentCounts(): Promise<{ department_name: string; department_code: string; count: number }[]> {
    return this.db.query(
      `SELECT d.name AS department_name, d.code AS department_code, COUNT(l.id)::int AS count
       FROM departments d
       LEFT JOIN letterheads l ON d.id = l.department_id
       WHERE d.is_active = 1
       GROUP BY d.name, d.code
       ORDER BY count DESC`
    );
  }

  async getMonthlyCount(): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM letterheads
       WHERE letter_date >= DATE_TRUNC('month', CURRENT_DATE)`
    );
    return parseInt(result?.count || '0', 10);
  }

  async getTotal(): Promise<number> {
    const result = await this.db.queryOne<{ count: string }>(
      'SELECT COUNT(*) as count FROM letterheads'
    );
    return parseInt(result?.count || '0', 10);
  }
}
