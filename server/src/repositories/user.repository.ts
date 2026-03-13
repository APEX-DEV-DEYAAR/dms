import { BaseDBAdapter } from '../db';
import { SqlHelper } from '../shared/sql-helpers';
import { User } from '../types';

export class UserRepository {
  constructor(private db: BaseDBAdapter, private sql: SqlHelper) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.db.queryOne<User>(
      `SELECT * FROM users WHERE username = ${this.sql.param(1)} AND is_active = 1`,
      [username]
    );
  }

  async findById(id: number): Promise<User | null> {
    return this.db.queryOne<User>(
      `SELECT * FROM users WHERE id = ${this.sql.param(1)}`,
      [id]
    );
  }
}
