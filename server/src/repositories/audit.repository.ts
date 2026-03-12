import { BaseDBAdapter } from '../db';
import { AuditLog } from '../types';

export class AuditRepository {
  constructor(private db: BaseDBAdapter) {}

  async log(entityType: string, entityId: number, action: string, performedBy: number, details?: string): Promise<void> {
    await this.db.execute(
      `INSERT INTO audit_log (entity_type, entity_id, action, performed_by, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [entityType, entityId, action, performedBy, details || null]
    );
  }

  async findRecent(limit = 50): Promise<(AuditLog & { performed_by_name: string })[]> {
    return this.db.query(
      `SELECT a.*, u.display_name AS performed_by_name
       FROM audit_log a
       JOIN users u ON a.performed_by = u.id
       ORDER BY a.created_at DESC
       LIMIT $1`,
      [limit]
    );
  }
}
