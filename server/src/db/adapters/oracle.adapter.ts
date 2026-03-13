import fs from 'fs';
import path from 'path';
import { BaseDBAdapter } from './base.adapter';

type OracleModule = typeof import('oracledb');
type OracleConnection = import('oracledb').Connection;
type OraclePool = import('oracledb').Pool;

interface OracleConfig {
  user: string;
  password: string;
  connectString: string;
}

export class OracleAdapter extends BaseDBAdapter {
  private oracledb?: OracleModule;
  private pool?: OraclePool;
  private connection?: OracleConnection;
  private readonly config: OracleConfig;

  get dialect(): 'oracle' {
    return 'oracle';
  }

  constructor(config: OracleConfig, connection?: OracleConnection, pool?: OraclePool, oracledb?: OracleModule) {
    super();
    this.config = config;
    this.connection = connection;
    this.pool = pool;
    this.oracledb = oracledb;
  }

  private async getOracleDb(): Promise<OracleModule> {
    if (!this.oracledb) {
      try {
        this.oracledb = require('oracledb') as OracleModule;
        this.oracledb.outFormat = this.oracledb.OUT_FORMAT_OBJECT;
        this.oracledb.fetchAsString = [this.oracledb.CLOB];
      } catch {
        throw new Error(
          'Cannot use Oracle: the "oracledb" package is not installed.\n' +
          'Run `npm install oracledb` before setting DB_TYPE=oracle.'
        );
      }
    }

    return this.oracledb;
  }

  private async getConnection(): Promise<OracleConnection> {
    if (this.connection) {
      return this.connection;
    }

    if (!this.pool) {
      throw new Error('Oracle pool has not been initialized. Call connect() first.');
    }

    return this.pool.getConnection();
  }

  private normalizeRow<T>(row: Record<string, unknown>): T {
    const normalized = Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key.toLowerCase(), value])
    );

    return normalized as T;
  }

  private normalizeRows<T>(rows: unknown[] | undefined): T[] {
    if (!rows) {
      return [];
    }

    return rows.map((row) => this.normalizeRow<T>(row as Record<string, unknown>));
  }

  private isManagedConnection(connection: OracleConnection): boolean {
    return !this.connection || connection !== this.connection;
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(sql, params, {
        outFormat: (await this.getOracleDb()).OUT_FORMAT_OBJECT,
      });
      return this.normalizeRows<T>((result.rows || []) as unknown[]);
    } finally {
      if (this.isManagedConnection(connection)) {
        await connection.close();
      }
    }
  }

  async queryOne<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const rows = await this.query<T>(sql, params);
    return rows[0] || null;
  }

  async execute(sql: string, params: any[] = []): Promise<{ rowCount: number }> {
    const connection = await this.getConnection();
    try {
      const result = await connection.execute(sql, params, {
        autoCommit: !this.connection,
      });
      return { rowCount: result.rowsAffected || 0 };
    } finally {
      if (this.isManagedConnection(connection)) {
        await connection.close();
      }
    }
  }

  async transaction<T>(fn: (adapter: BaseDBAdapter) => Promise<T>): Promise<T> {
    if (!this.pool) {
      throw new Error('Oracle pool has not been initialized. Call connect() first.');
    }

    const connection = await this.pool.getConnection();
    const txAdapter = new OracleAdapter(this.config, connection, this.pool, await this.getOracleDb());

    try {
      const result = await fn(txAdapter);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      await connection.close();
    }
  }

  async connect(): Promise<void> {
    const oracledb = await this.getOracleDb();

    if (!this.pool) {
      this.pool = await oracledb.createPool({
        user: this.config.user,
        password: this.config.password,
        connectString: this.config.connectString,
      });
    }

    const connection = await this.pool.getConnection();
    try {
      await connection.execute('SELECT 1 FROM dual');
    } finally {
      await connection.close();
    }

    console.log('Connected to Oracle');
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      return;
    }

    if (this.pool) {
      await this.pool.close(0);
      this.pool = undefined;
    }
  }

  private splitMigrationStatements(sql: string): string[] {
    const statements: string[] = [];
    const lines = sql.replace(/\r/g, '').split('\n');
    let buffer = '';

    for (const originalLine of lines) {
      const line = originalLine.trim();

      if (!line || line.startsWith('--')) {
        continue;
      }

      buffer += `${originalLine}\n`;

      if (line === '/') {
        const statement = buffer.trim();
        if (statement) {
          statements.push(statement.slice(0, -1).trim());
        }
        buffer = '';
        continue;
      }

      if (line.endsWith(';')) {
        statements.push(buffer.trim().replace(/;$/, '').trim());
        buffer = '';
      }
    }

    if (buffer.trim()) {
      statements.push(buffer.trim());
    }

    return statements.filter(Boolean);
  }

  async runMigrations(migrationsDir: string): Promise<void> {
    const dialectDir = path.join(migrationsDir, 'oracle');
    const effectiveDir = fs.existsSync(dialectDir) ? dialectDir : migrationsDir;

    await this.execute(`
      BEGIN
        EXECUTE IMMEDIATE '
          CREATE TABLE schema_migrations (
            id NUMBER(19) GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
            filename VARCHAR2(500) NOT NULL UNIQUE,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
          )
        ';
      EXCEPTION
        WHEN OTHERS THEN
          IF SQLCODE != -955 THEN
            RAISE;
          END IF;
      END;
    `);

    const files = fs.readdirSync(effectiveDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of files) {
      const existing = await this.queryOne<{ id: number }>(
        'SELECT id FROM schema_migrations WHERE filename = :1',
        [file]
      );

      if (existing) {
        continue;
      }

      const migrationSql = fs.readFileSync(path.join(effectiveDir, file), 'utf-8');
      const statements = this.splitMigrationStatements(migrationSql);

      await this.transaction(async (txDb) => {
        for (const statement of statements) {
          await txDb.execute(statement);
        }

        await txDb.execute(
          'INSERT INTO schema_migrations (filename) VALUES (:1)',
          [file]
        );
      });

      console.log(`Migration applied: ${file}`);
    }
  }
}
