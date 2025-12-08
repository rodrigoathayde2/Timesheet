-- ============================================
-- MIGRATION: Permitir múltiplos lançamentos da mesma atividade no mesmo dia
-- Version: 1.0.1
-- Date: 2025-12-08
-- ============================================

-- SQLite não suporta DROP CONSTRAINT diretamente
-- Precisamos recriar a tabela sem a constraint UNIQUE

-- 1. Criar nova tabela sem a constraint UNIQUE
CREATE TABLE timesheet_entries_new (
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
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copiar dados existentes
INSERT INTO timesheet_entries_new 
SELECT * FROM timesheet_entries;

-- 3. Remover tabela antiga
DROP TABLE timesheet_entries;

-- 4. Renomear nova tabela
ALTER TABLE timesheet_entries_new RENAME TO timesheet_entries;

-- 5. Recriar indexes
CREATE INDEX IF NOT EXISTS idx_entries_user ON timesheet_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_entries_project ON timesheet_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_entries_activity ON timesheet_entries(activity_id);
CREATE INDEX IF NOT EXISTS idx_entries_date ON timesheet_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_entries_week ON timesheet_entries(week_start_date);
CREATE INDEX IF NOT EXISTS idx_entries_status ON timesheet_entries(status);
CREATE INDEX IF NOT EXISTS idx_entries_user_week ON timesheet_entries(user_id, week_start_date);
