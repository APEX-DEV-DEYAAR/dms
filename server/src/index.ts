import path from 'path';
import { config } from './config';
import { createDBAdapter } from './db';
import { createStorageAdapter } from './storage';
import { createSqlHelper } from './shared/sql-helpers';
import { createApp } from './app';

// Repositories
import { DepartmentRepository } from './repositories/department.repository';
import { UserRepository } from './repositories/user.repository';
import { LetterheadRepository } from './repositories/letterhead.repository';
import { AuditRepository } from './repositories/audit.repository';

// Services
import { AuthService } from './services/auth.service';
import { DepartmentService } from './services/department.service';
import { LetterheadService } from './services/letterhead.service';
import { DashboardService } from './services/dashboard.service';

// Controllers
import { HealthController } from './controllers/health.controller';
import { AuthController } from './controllers/auth.controller';
import { DepartmentController } from './controllers/department.controller';
import { LetterheadController } from './controllers/letterhead.controller';
import { DashboardController } from './controllers/dashboard.controller';

async function main() {
  const db = createDBAdapter();
  const storage = createStorageAdapter();
  const sql = createSqlHelper(db.dialect);

  // Connect and run migrations
  await db.connect();
  const migrationsDir = path.resolve(__dirname, '../../database/migrations');
  await db.runMigrations(migrationsDir);
  console.log('Migrations complete');

  // Wire up repositories
  const deptRepo = new DepartmentRepository(db, sql);
  const userRepo = new UserRepository(db, sql);
  const letterheadRepo = new LetterheadRepository(db, sql);
  const auditRepo = new AuditRepository(db, sql);

  // Wire up services
  const authService = new AuthService(userRepo);
  const deptService = new DepartmentService(deptRepo);
  const letterheadService = new LetterheadService(db, letterheadRepo, deptRepo, auditRepo, storage);
  const dashboardService = new DashboardService(letterheadRepo, auditRepo);

  // Wire up controllers
  const controllers = {
    health: new HealthController(),
    auth: new AuthController(authService),
    department: new DepartmentController(deptService),
    letterhead: new LetterheadController(letterheadService),
    dashboard: new DashboardController(dashboardService),
  };

  const app = createApp(controllers);

  app.listen(config.port, () => {
    console.log(`Letterhead Control System running on port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
