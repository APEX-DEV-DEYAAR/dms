import { BaseDBAdapter } from '../db';
import { User } from '../types';

export class UserRepository {
  constructor(private db: BaseDBAdapter) {}

  async findByUsername(username: string): Promise<User | null> {
    return this.db.queryOne<User>(
      'SELECT * FROM users WHERE username = $1 AND is_active = 1',
      [username]
    );
  }

  async findById(id: number): Promise<User | null> {
    return this.db.queryOne<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
  }
}
