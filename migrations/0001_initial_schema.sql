-- ============================================
-- TIMESHEET SYSTEM - INITIAL SCHEMA
-- Version: 1.0.0
-- Date: 2025-12-08
-- ============================================

-- ============================================
-- 1. DEPARTMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

-- ============================================
-- 2. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  cpf TEXT UNIQUE NOT NULL,
  matricula TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('COLABORADOR', 'GESTOR', 'DIRETOR')),
  status TEXT DEFAULT 'ATIVO' CHECK(status IN ('ATIVO', 'INATIVO')),
  department_id TEXT REFERENCES departments(id),
  manager_id TEXT REFERENCES users(id),
  avatar_url TEXT,
  timezone TEXT DEFAULT 'America/Sao_Paulo',
  weekly_hours REAL DEFAULT 40.00,
  admission_date DATE,
  termination_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

-- ============================================
-- 3. PROJECTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  manager_id TEXT REFERENCES users(id) NOT NULL,
  client TEXT,
  cost_center TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'ATIVO' CHECK(status IN ('PLANEJAMENTO', 'ATIVO', 'PAUSADO', 'CONCLUÍDO', 'CANCELADO')),
  budget_hours INTEGER,
  hourly_rate REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL
);

-- ============================================
-- 4. ACTIVITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'ATIVA' CHECK(status IN ('ATIVA', 'INATIVA')),
  display_order INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  UNIQUE(project_id, name)
);

-- ============================================
-- 5. USER PROJECT ASSIGNMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_project_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  allowed_activities TEXT, -- JSON array de activity IDs
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 6. TIMESHEET ENTRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS timesheet_entries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  project_id TEXT REFERENCES projects(id) NOT NULL,
  activity_id TEXT REFERENCES activities(id) NOT NULL,
  entry_date DATE NOT NULL,
  hours REAL NOT NULL CHECK (hours >= 0.25 AND hours <= 24),
  description TEXT,
  week_start_date DATE NOT NULL,
  status TEXT DEFAULT 'RASCUNHO' CHECK(status IN ('RASCUNHO', 'ENVIADO', 'APROVADO_GESTOR', 'REPROVADO_GESTOR', 'APROVADO_DIRETOR', 'REPROVADO_DIRETOR')),
  submitted_at DATETIME,
  manager_approved_at DATETIME,
  manager_approved_by TEXT REFERENCES users(id),
  manager_rejection_reason TEXT,
  director_approved_at DATETIME,
  director_approved_by TEXT REFERENCES users(id),
  director_rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id, activity_id, entry_date)
);

-- ============================================
-- 7. AUDIT LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT REFERENCES users(id) NOT NULL,
  affected_user_id TEXT REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  old_values TEXT, -- JSON
  new_values TEXT, -- JSON
  justification TEXT,
  ip_address TEXT,
  user_agent TEXT
);

-- ============================================
-- 8. WEEKLY TEMPLATES TABLE (para templates de semana)
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_templates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  template_data TEXT NOT NULL, -- JSON com os lançamentos
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_cpf ON users(cpf);
CREATE INDEX IF NOT EXISTS idx_users_matricula ON users(matricula);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_manager ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_department ON users(department_id);

-- Projects indexes
CREATE INDEX IF NOT EXISTS idx_projects_code ON projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);

-- Activities indexes
CREATE INDEX IF NOT EXISTS idx_activities_project ON activities(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);

-- User project assignments indexes
CREATE INDEX IF NOT EXISTS idx_assignments_user ON user_project_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_project ON user_project_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_assignments_dates ON user_project_assignments(start_date, end_date);

-- Timesheet entries indexes
CREATE INDEX IF NOT EXISTS idx_entries_user ON timesheet_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_project ON timesheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_entries_activity ON timesheet_entries(activity_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON timesheet_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_week ON timesheet_entries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON timesheet_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_user_week ON timesheet_entries(user_id, week_start_date);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_affected_user ON audit_logs(affected_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);

-- Weekly templates indexes
CREATE INDEX IF NOT EXISTS idx_templates_user ON weekly_templates(user_id);
