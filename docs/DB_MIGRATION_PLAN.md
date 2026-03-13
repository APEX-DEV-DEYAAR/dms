# PostgreSQL → Oracle Migration Plan

## Prerequisites

1. Oracle 19c+ instance available and accessible from the application server
2. DBA account to create schema objects
3. `oracledb` npm package installed: `npm install oracledb`
4. Oracle Instant Client installed on the app server (required by `oracledb`)

## Step-by-step

### 1. Environment configuration

```env
DB_TYPE=oracle
DB_USER=lcs_user
DB_PASSWORD=<secret>
ORACLE_CONNECT_STRING=oracle-host:1521/XEPDB1
```

### 2. Run Oracle schema creation

Execute `database/migrations/oracle/001_init.sql` against the Oracle instance. Review for your Oracle version — the `GENERATED ALWAYS AS IDENTITY` syntax requires Oracle 12c+.

```bash
sqlplus lcs_user/<password>@oracle-host:1521/XEPDB1 @database/migrations/oracle/001_init.sql
```

### 3. Implement OracleAdapter

Open `server/src/db/adapters/oracle.adapter.ts` and replace the stub methods with real `oracledb` calls:

- **Connection pooling**: Use `oracledb.createPool()` in `connect()`, `pool.close()` in `disconnect()`
- **query()**: Execute SQL with bind parameters (`:1`, `:2`), return `result.rows`
- **execute()**: Same pattern, return `{ rowCount: result.rowsAffected }`
- **transaction()**: Use `connection.execute('BEGIN')` / `connection.commit()` / `connection.rollback()`
- **runMigrations()**: Same logic, but read from `migrations/oracle/` subdirectory and use `:1` bind syntax for the migrations tracking table

### 4. Migrate data

Export data from PostgreSQL and import into Oracle:

```bash
# Export from PostgreSQL
pg_dump --data-only --inserts letterhead_control > data_export.sql

# Convert INSERT syntax for Oracle:
# - Replace BIGSERIAL auto-values with sequence-generated IDs
# - Replace boolean TRUE/FALSE with 1/0 (already done in our schema)
# - Replace CURRENT_TIMESTAMP usage
```

Alternatively, use an ETL tool (e.g., Oracle SQL Developer Migration Workbench).

### 5. Verify

1. Set `DB_TYPE=oracle` in `.env`
2. Run `npm run dev` — app should connect to Oracle
3. Test all API endpoints (login, CRUD, archive, export, dashboard)
4. Compare record counts between old PostgreSQL and new Oracle databases

### 6. Rollback plan

Keep the PostgreSQL database running in read-only mode during migration window. If issues arise:

1. Set `DB_TYPE=postgres` in `.env`
2. Restart the application
3. Investigate and fix Oracle-specific issues before retrying

## Key differences to handle

| Feature | PostgreSQL | Oracle |
|---------|-----------|--------|
| Auto-increment | `BIGSERIAL` | `GENERATED ALWAYS AS IDENTITY` |
| Parameters | `$1, $2` | `:1, :2` |
| RETURNING | `RETURNING *` | `RETURNING ... INTO` (requires OUT binds) |
| ILIKE | Native | `UPPER(col) LIKE UPPER(val)` |
| LIMIT/OFFSET | `LIMIT n OFFSET m` | `OFFSET m ROWS FETCH NEXT n ROWS ONLY` |
| DATE_TRUNC | `DATE_TRUNC('month', col)` | `TRUNC(col, 'MM')` |
| JSON | `jsonb` | `CLOB` + JSON functions |
| Boolean | `1/0` (SMALLINT) | `1/0` (NUMBER(1)) |

All of these are handled by the `SqlHelper` abstraction in `server/src/shared/sql-helpers.ts`.
