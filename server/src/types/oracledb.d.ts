declare module 'oracledb' {
  export const OUT_FORMAT_OBJECT: number;
  export const CLOB: number;

  export let outFormat: number;
  export let fetchAsString: number[];

  export interface ExecuteResult<T = unknown> {
    rows?: T[];
    rowsAffected?: number;
  }

  export interface Connection {
    execute<T = unknown>(sql: string, bindParams?: unknown[], options?: Record<string, unknown>): Promise<ExecuteResult<T>>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    close(): Promise<void>;
  }

  export interface Pool {
    getConnection(): Promise<Connection>;
    close(drainTime?: number): Promise<void>;
  }

  export interface PoolAttributes {
    user: string;
    password: string;
    connectString: string;
  }

  export function createPool(attrs: PoolAttributes): Promise<Pool>;
}
