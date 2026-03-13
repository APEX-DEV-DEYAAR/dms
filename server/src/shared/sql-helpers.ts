export interface SqlHelper {
  readonly dialect: 'postgres' | 'oracle';

  /** Returns parameter placeholder for the given 1-based index. Postgres: $1, Oracle: :1 */
  param(index: number): string;

  /** Case-insensitive LIKE: Postgres uses ILIKE, Oracle uses UPPER(col) LIKE UPPER(val) */
  ilike(column: string, paramIndex: number): string;

  /** Adds LIMIT/OFFSET (Postgres) or OFFSET…FETCH (Oracle) to a query */
  paginate(limitParam: number, offsetParam: number): string;

  /** RETURNING clause — Postgres supports it natively; Oracle needs workarounds */
  returning(columns: string): string;

  /** Boolean true literal */
  boolTrue(): string;

  /** Boolean false literal */
  boolFalse(): string;

  /** Cast expression to integer */
  castInt(expr: string): string;

  /** Current timestamp expression */
  currentTimestamp(): string;

  /** Date truncation to month: DATE_TRUNC('month', col) vs TRUNC(col, 'MM') */
  truncMonth(column: string): string;
}

export class PostgresSqlHelper implements SqlHelper {
  readonly dialect = 'postgres' as const;

  param(index: number): string {
    return `$${index}`;
  }

  ilike(column: string, paramIndex: number): string {
    return `${column} ILIKE $${paramIndex}`;
  }

  paginate(limitParam: number, offsetParam: number): string {
    return `LIMIT $${limitParam} OFFSET $${offsetParam}`;
  }

  returning(columns: string): string {
    return `RETURNING ${columns}`;
  }

  boolTrue(): string {
    return '1';
  }

  boolFalse(): string {
    return '0';
  }

  castInt(expr: string): string {
    return `(${expr})::int`;
  }

  currentTimestamp(): string {
    return 'CURRENT_TIMESTAMP';
  }

  truncMonth(column: string): string {
    return `DATE_TRUNC('month', ${column})`;
  }
}

export class OracleSqlHelper implements SqlHelper {
  readonly dialect = 'oracle' as const;

  param(index: number): string {
    return `:${index}`;
  }

  ilike(column: string, paramIndex: number): string {
    return `UPPER(${column}) LIKE UPPER(:${paramIndex})`;
  }

  paginate(limitParam: number, offsetParam: number): string {
    return `OFFSET :${offsetParam} ROWS FETCH NEXT :${limitParam} ROWS ONLY`;
  }

  returning(columns: string): string {
    void columns;
    return '';
  }

  boolTrue(): string {
    return '1';
  }

  boolFalse(): string {
    return '0';
  }

  castInt(expr: string): string {
    return `CAST(${expr} AS INTEGER)`;
  }

  currentTimestamp(): string {
    return 'CURRENT_TIMESTAMP';
  }

  truncMonth(column: string): string {
    return `TRUNC(${column}, 'MM')`;
  }
}

export function createSqlHelper(dialect: 'postgres' | 'oracle'): SqlHelper {
  switch (dialect) {
    case 'postgres':
      return new PostgresSqlHelper();
    case 'oracle':
      return new OracleSqlHelper();
    default:
      throw new Error(`Unsupported SQL dialect: ${dialect}`);
  }
}
