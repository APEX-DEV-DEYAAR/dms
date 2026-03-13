import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import jwt from 'jsonwebtoken';

import { createApp } from '../src/app';
import { config } from '../src/config';
import { PostgresAdapter } from '../src/db/adapters/postgres.adapter';

type ControllerOverrides = {
  auth?: Partial<{
    login: (req: any, res: any, next: any) => void | Promise<void>;
    refresh: (req: any, res: any, next: any) => void | Promise<void>;
    me: (req: any, res: any, next: any) => void | Promise<void>;
  }>;
  letterhead?: Partial<{
    create: (req: any, res: any, next: any) => void | Promise<void>;
    getById: (req: any, res: any, next: any) => void | Promise<void>;
    getList: (req: any, res: any, next: any) => void | Promise<void>;
    download: (req: any, res: any, next: any) => void | Promise<void>;
    export: (req: any, res: any, next: any) => void | Promise<void>;
    getNextReference: (req: any, res: any, next: any) => void | Promise<void>;
    update: (req: any, res: any, next: any) => void | Promise<void>;
    getVersionHistory: (req: any, res: any, next: any) => void | Promise<void>;
  }>;
};

function createControllers(overrides: ControllerOverrides = {}) {
  return {
    health: {
      check: (_req: any, res: any) => res.json({ status: 'ok' }),
    },
    auth: {
      login: (_req: any, res: any) => res.json({ ok: true }),
      refresh: (_req: any, res: any) => res.json({ ok: true }),
      me: (_req: any, res: any) => res.json({ ok: true }),
      ...overrides.auth,
    },
    department: {
      getAll: (_req: any, res: any) => res.json([]),
      getById: (_req: any, res: any) => res.json({}),
    },
    letterhead: {
      create: (_req: any, res: any) => res.status(201).json({ ok: true }),
      getById: (_req: any, res: any) => res.json({ ok: true }),
      getList: (_req: any, res: any) => res.json({ data: [], total: 0, page: 1, limit: 20, totalPages: 0 }),
      download: (_req: any, res: any) => res.status(204).end(),
      export: (_req: any, res: any) => res.status(204).end(),
      getNextReference: (_req: any, res: any) => res.json({ nextReference: 'HR-00001' }),
      update: (_req: any, res: any) => res.json({ ok: true }),
      getVersionHistory: (_req: any, res: any) => res.json([]),
      ...overrides.letterhead,
    },
    dashboard: {
      getSummary: (_req: any, res: any) => res.json({}),
      getActivityLog: (_req: any, res: any) => res.json([]),
    },
  } as any;
}

async function startTestServer(overrides: ControllerOverrides = {}): Promise<{ baseUrl: string; server: Server }> {
  const app = createApp(createControllers(overrides));
  const server = app.listen(0);
  await once(server, 'listening');
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    server,
  };
}

async function stopTestServer(server: Server) {
  server.close();
  await once(server, 'close');
}

function createAuthToken(role: 'department_user' | 'admin' = 'department_user') {
  return jwt.sign(
    {
      userId: 1,
      username: 'tester',
      role,
      departmentId: 1,
    },
    config.jwt.secret,
    {
      expiresIn: '1h',
      algorithm: config.jwt.algorithm,
      issuer: config.jwt.issuer,
      audience: config.jwt.audience,
      subject: '1',
    }
  );
}

test('auth routes validate request bodies before controller logic runs', async () => {
  let loginCalls = 0;
  let refreshCalls = 0;
  const { baseUrl, server } = await startTestServer({
    auth: {
      login: (_req, res) => {
        loginCalls += 1;
        res.json({ token: 'access', refreshToken: 'refresh', user: { userId: 1, username: 'tester', role: 'admin', departmentId: null } });
      },
      refresh: (_req, res) => {
        refreshCalls += 1;
        res.json({ token: 'access-2', refreshToken: 'refresh-2' });
      },
    },
  });

  try {
    const invalidLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester' }),
    });
    assert.equal(invalidLogin.status, 400);
    assert.equal(loginCalls, 0);

    const validLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'tester', password: 'secret' }),
    });
    assert.equal(validLogin.status, 200);
    assert.equal(loginCalls, 1);

    const invalidRefresh = await fetch(`${baseUrl}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(invalidRefresh.status, 400);
    assert.equal(refreshCalls, 0);
  } finally {
    await stopTestServer(server);
  }
});

test('letterhead create route enforces multipart validation and PDF constraints', async () => {
  let createCalls = 0;
  const { baseUrl, server } = await startTestServer({
    letterhead: {
      create: (req, res) => {
        createCalls += 1;
        res.status(201).json({
          departmentId: req.body.departmentId,
          description: req.body.description,
          fileName: req.file?.originalname,
        });
      },
    },
  });

  const token = createAuthToken();

  try {
    const missingDescription = new FormData();
    missingDescription.set('departmentId', '1');
    missingDescription.set('letterDate', '2026-03-13');
    missingDescription.set('approvalAuthority', 'CEO');
    missingDescription.set('file', new Blob(['%PDF-1.4 valid pdf']), 'letter.pdf');

    const invalidDescriptionResponse = await fetch(`${baseUrl}/api/letterheads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: missingDescription,
    });
    assert.equal(invalidDescriptionResponse.status, 400);
    assert.equal(createCalls, 0);

    const invalidFile = new FormData();
    invalidFile.set('departmentId', '1');
    invalidFile.set('letterDate', '2026-03-13');
    invalidFile.set('approvalAuthority', 'CEO');
    invalidFile.set('description', 'Quarterly report');
    invalidFile.set('file', new Blob(['not a pdf'], { type: 'text/plain' }), 'letter.txt');

    const invalidFileResponse = await fetch(`${baseUrl}/api/letterheads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: invalidFile,
    });
    assert.equal(invalidFileResponse.status, 400);
    assert.equal(createCalls, 0);

    const validRequest = new FormData();
    validRequest.set('departmentId', '1');
    validRequest.set('letterDate', '2026-03-13');
    validRequest.set('approvalAuthority', 'CEO');
    validRequest.set('description', 'Quarterly report');
    validRequest.set('notes', 'Board approved');
    validRequest.set('file', new Blob(['%PDF-1.4 valid pdf'], { type: 'application/pdf' }), 'letter.pdf');

    const validResponse = await fetch(`${baseUrl}/api/letterheads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: validRequest,
    });

    assert.equal(validResponse.status, 201);
    assert.equal(createCalls, 1);
  } finally {
    await stopTestServer(server);
  }
});

class TestPostgresAdapter extends PostgresAdapter {
  executedStatements: Array<{ sql: string; params?: any[] }> = [];
  appliedMigrations = new Set<string>();

  constructor() {
    super({ host: 'localhost', port: 5432, database: 'test', user: 'test', password: 'test' });
  }

  override async execute(sql: string, params?: any[]): Promise<{ rowCount: number }> {
    this.executedStatements.push({ sql, params });
    if (sql.includes('INSERT INTO schema_migrations') && params?.[0]) {
      this.appliedMigrations.add(params[0]);
    }
    return { rowCount: 1 };
  }

  override async queryOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
    if (sql.includes('SELECT id FROM schema_migrations')) {
      return (this.appliedMigrations.has(String(params?.[0])) ? { id: 1 } : null) as T | null;
    }
    return null;
  }
}

test('Postgres migrations prefer the postgres subdirectory and skip already applied files', async () => {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'dms-migrations-'));
  const postgresDir = path.join(tempDir, 'postgres');
  await fs.mkdir(postgresDir);

  await fs.writeFile(path.join(tempDir, '001_root_only.sql'), 'SELECT root;');
  await fs.writeFile(path.join(postgresDir, '001_init.sql'), 'SELECT postgres_init;');
  await fs.writeFile(path.join(postgresDir, '002_skip_me.sql'), 'SELECT postgres_skip;');

  const adapter = new TestPostgresAdapter();
  adapter.appliedMigrations.add('002_skip_me.sql');

  try {
    await adapter.runMigrations(tempDir);

    const executedSql = adapter.executedStatements.map((entry) => entry.sql);
    assert.ok(executedSql.some((sql) => sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')));
    assert.ok(executedSql.some((sql) => sql.includes('SELECT postgres_init;')));
    assert.ok(!executedSql.some((sql) => sql.includes('SELECT root;')));
    assert.ok(!executedSql.some((sql) => sql.includes('SELECT postgres_skip;')));
  } finally {
    await adapter.disconnect();
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});
