-- Seed departments
INSERT INTO departments (code, name, prefix) VALUES
  ('FIN', 'Finance', 'DDP-FIN'),
  ('COM', 'Communications', 'DDP-COM'),
  ('HR', 'Human Resources', 'DDP-HR'),
  ('LEG', 'Legal', 'DDP-LEG'),
  ('IT', 'Information Technology', 'DDP-IT'),
  ('OPS', 'Operations', 'DDP-OPS'),
  ('MKT', 'Marketing', 'DDP-MKT'),
  ('ADM', 'Administration', 'DDP-ADM'),
  ('PRO', 'Procurement', 'DDP-PRO'),
  ('CEO', 'CEO Office', 'DDP-CEO')
ON CONFLICT (code) DO NOTHING;
