import { BaseDBAdapter } from '../db';
import { SqlHelper } from '../shared/sql-helpers';
import { Department } from '../types';
import { NotFoundError } from '../errors/AppError';

export class DepartmentRepository {
  constructor(private db: BaseDBAdapter, private sql: SqlHelper) {}

  async findAll(): Promise<Department[]> {
    return this.db.query<Department>(
      'SELECT * FROM departments WHERE is_active = 1 ORDER BY name'
    );
  }

  async findById(id: number): Promise<Department | null> {
    return this.db.queryOne<Department>(
      `SELECT * FROM departments WHERE id = ${this.sql.param(1)}`,
      [id]
    );
  }

  async findByCode(code: string): Promise<Department | null> {
    return this.db.queryOne<Department>(
      `SELECT * FROM departments WHERE code = ${this.sql.param(1)}`,
      [code]
    );
  }

  async getNextSequence(departmentId: number, txDb: BaseDBAdapter): Promise<{ prefix: string; sequence: number }> {
    const dept = await txDb.queryOne<Department>(
      `SELECT * FROM departments WHERE id = ${this.sql.param(1)} FOR UPDATE`,
      [departmentId]
    );
    if (!dept) throw new NotFoundError('Department not found');

    await txDb.execute(
      `UPDATE departments SET next_sequence = next_sequence + 1 WHERE id = ${this.sql.param(1)}`,
      [departmentId]
    );

    return { prefix: dept.prefix, sequence: dept.next_sequence };
  }

  async peekNextSequence(departmentId: number): Promise<{ prefix: string; sequence: number }> {
    const dept = await this.db.queryOne<Department>(
      `SELECT prefix, next_sequence FROM departments WHERE id = ${this.sql.param(1)}`,
      [departmentId]
    );
    if (!dept) throw new NotFoundError('Department not found');
    return { prefix: dept.prefix, sequence: dept.next_sequence };
  }
}
