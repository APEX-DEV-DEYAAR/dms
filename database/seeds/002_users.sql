-- Seed test users (password is 'password123' hashed with bcrypt)
-- $2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu

INSERT INTO users (username, password_hash, display_name, email, department_id, role) VALUES
  ('admin', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'System Admin', 'admin@company.com', NULL, 'admin'),
  ('ceo.user', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'CEO Office User', 'ceo@company.com', (SELECT id FROM departments WHERE code = 'CEO'), 'ceo_office'),
  ('compliance.user', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'Compliance Officer', 'compliance@company.com', NULL, 'compliance'),
  ('fin.user', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'Finance User', 'fin@company.com', (SELECT id FROM departments WHERE code = 'FIN'), 'department_user'),
  ('hr.user', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'HR User', 'hr@company.com', (SELECT id FROM departments WHERE code = 'HR'), 'department_user'),
  ('it.user', '$2b$10$pkQlsEa.qKyBIyETQ/zD7uorZFoMD0TnGFpIpBgEDDZf.iWk6UAFu', 'IT User', 'it@company.com', (SELECT id FROM departments WHERE code = 'IT'), 'department_user')
ON CONFLICT (username) DO NOTHING;
