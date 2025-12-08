-- ============================================
-- TIMESHEET SYSTEM - SEED DATA
-- Dados de teste para desenvolvimento
-- ============================================

-- ============================================
-- 1. DEPARTMENTS
-- ============================================
INSERT OR IGNORE INTO departments (id, name, code, description) VALUES 
  ('dept-1', 'Tecnologia da Informação', 'TI', 'Departamento de TI e Desenvolvimento'),
  ('dept-2', 'Recursos Humanos', 'RH', 'Departamento de Gestão de Pessoas'),
  ('dept-3', 'Financeiro', 'FIN', 'Departamento Financeiro'),
  ('dept-4', 'Comercial', 'COM', 'Departamento Comercial e Vendas');

-- ============================================
-- 2. USERS
-- Senha padrão para todos: "senha123" 
-- Hash bcrypt: $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke
-- ============================================

-- Diretor
INSERT OR IGNORE INTO users (id, full_name, email, cpf, matricula, password_hash, role, status, department_id, weekly_hours, admission_date) VALUES 
  ('user-dir-1', 'Carlos Eduardo Silva', 'carlos.silva@empresa.com.br', '12345678901', 'DIR001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'DIRETOR', 'ATIVO', 'dept-1', 40.00, '2020-01-15');

-- Gestores
INSERT OR IGNORE INTO users (id, full_name, email, cpf, matricula, password_hash, role, status, department_id, manager_id, weekly_hours, admission_date) VALUES 
  ('user-ges-1', 'Ana Paula Santos', 'ana.santos@empresa.com.br', '23456789012', 'GES001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'GESTOR', 'ATIVO', 'dept-1', 'user-dir-1', 40.00, '2020-03-10'),
  ('user-ges-2', 'Roberto Lima', 'roberto.lima@empresa.com.br', '34567890123', 'GES002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'GESTOR', 'ATIVO', 'dept-2', 'user-dir-1', 40.00, '2020-06-20'),
  ('user-ges-3', 'Mariana Costa', 'mariana.costa@empresa.com.br', '45678901234', 'GES003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'GESTOR', 'ATIVO', 'dept-3', 'user-dir-1', 40.00, '2021-02-01');

-- Colaboradores do Gestor Ana Paula (TI)
INSERT OR IGNORE INTO users (id, full_name, email, cpf, matricula, password_hash, role, status, department_id, manager_id, weekly_hours, admission_date) VALUES 
  ('user-col-1', 'João Pedro Oliveira', 'joao.oliveira@empresa.com.br', '56789012345', 'COL001', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-1', 'user-ges-1', 40.00, '2021-05-10'),
  ('user-col-2', 'Maria Fernanda Souza', 'maria.souza@empresa.com.br', '67890123456', 'COL002', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-1', 'user-ges-1', 40.00, '2021-08-15'),
  ('user-col-3', 'Pedro Henrique Alves', 'pedro.alves@empresa.com.br', '78901234567', 'COL003', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-1', 'user-ges-1', 40.00, '2022-01-20'),
  ('user-col-4', 'Juliana Rodrigues', 'juliana.rodrigues@empresa.com.br', '89012345678', 'COL004', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-1', 'user-ges-1', 40.00, '2022-03-15');

-- Colaboradores do Gestor Roberto (RH)
INSERT OR IGNORE INTO users (id, full_name, email, cpf, matricula, password_hash, role, status, department_id, manager_id, weekly_hours, admission_date) VALUES 
  ('user-col-5', 'Lucas Ferreira', 'lucas.ferreira@empresa.com.br', '90123456789', 'COL005', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-2', 'user-ges-2', 40.00, '2022-06-01'),
  ('user-col-6', 'Camila Martins', 'camila.martins@empresa.com.br', '01234567890', 'COL006', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-2', 'user-ges-2', 40.00, '2022-09-10');

-- Colaboradores do Gestor Mariana (Financeiro)
INSERT OR IGNORE INTO users (id, full_name, email, cpf, matricula, password_hash, role, status, department_id, manager_id, weekly_hours, admission_date) VALUES 
  ('user-col-7', 'Rafael Santos', 'rafael.santos@empresa.com.br', '11234567890', 'COL007', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-3', 'user-ges-3', 40.00, '2023-01-15'),
  ('user-col-8', 'Beatriz Lima', 'beatriz.lima@empresa.com.br', '22345678901', 'COL008', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke', 'COLABORADOR', 'ATIVO', 'dept-3', 'user-ges-3', 40.00, '2023-04-20');

-- ============================================
-- 3. PROJECTS
-- ============================================
INSERT OR IGNORE INTO projects (id, name, code, description, manager_id, client, cost_center, start_date, end_date, status, budget_hours, hourly_rate) VALUES 
  ('proj-1', 'Sistema de CRM', 'CRM-2024', 'Desenvolvimento de CRM corporativo', 'user-ges-1', 'Cliente A', 'CC-TI-001', '2024-01-01', '2024-12-31', 'ATIVO', 2000, 150.00),
  ('proj-2', 'App Mobile Vendas', 'MOBILE-2024', 'Aplicativo mobile para força de vendas', 'user-ges-1', 'Cliente B', 'CC-TI-002', '2024-03-01', '2024-10-31', 'ATIVO', 1500, 180.00),
  ('proj-3', 'Portal RH', 'RH-PORTAL', 'Portal de autoatendimento para colaboradores', 'user-ges-2', 'Interno', 'CC-RH-001', '2024-02-01', NULL, 'ATIVO', 1000, 120.00),
  ('proj-4', 'Sistema Financeiro', 'FIN-SYS', 'Modernização do sistema financeiro', 'user-ges-3', 'Interno', 'CC-FIN-001', '2024-01-15', '2024-11-30', 'ATIVO', 1800, 160.00),
  ('proj-5', 'Manutenção Infraestrutura', 'INFRA-MANUT', 'Manutenção e suporte da infraestrutura', 'user-ges-1', 'Interno', 'CC-TI-003', '2024-01-01', NULL, 'ATIVO', 5000, 100.00);

-- ============================================
-- 4. ACTIVITIES
-- ============================================

-- Atividades do Projeto CRM
INSERT OR IGNORE INTO activities (id, project_id, name, code, type, description, status, display_order) VALUES 
  ('act-1', 'proj-1', 'Desenvolvimento Backend', 'CRM-BACKEND', 'DESENVOLVIMENTO', 'Desenvolvimento de APIs e regras de negócio', 'ATIVA', 1),
  ('act-2', 'proj-1', 'Desenvolvimento Frontend', 'CRM-FRONTEND', 'DESENVOLVIMENTO', 'Desenvolvimento de interfaces', 'ATIVA', 2),
  ('act-3', 'proj-1', 'Testes', 'CRM-TESTES', 'TESTES', 'Testes unitários e integração', 'ATIVA', 3),
  ('act-4', 'proj-1', 'Reuniões', 'CRM-REUNIAO', 'REUNIÃO', 'Reuniões de alinhamento', 'ATIVA', 4);

-- Atividades do App Mobile
INSERT OR IGNORE INTO activities (id, project_id, name, code, type, description, status, display_order) VALUES 
  ('act-5', 'proj-2', 'Desenvolvimento iOS', 'MOB-IOS', 'DESENVOLVIMENTO', 'Desenvolvimento iOS', 'ATIVA', 1),
  ('act-6', 'proj-2', 'Desenvolvimento Android', 'MOB-ANDROID', 'DESENVOLVIMENTO', 'Desenvolvimento Android', 'ATIVA', 2),
  ('act-7', 'proj-2', 'API Backend', 'MOB-API', 'DESENVOLVIMENTO', 'APIs para o app', 'ATIVA', 3),
  ('act-8', 'proj-2', 'Testes', 'MOB-TESTES', 'TESTES', 'Testes automatizados', 'ATIVA', 4);

-- Atividades do Portal RH
INSERT OR IGNORE INTO activities (id, project_id, name, code, type, description, status, display_order) VALUES 
  ('act-9', 'proj-3', 'Desenvolvimento', 'RH-DEV', 'DESENVOLVIMENTO', 'Desenvolvimento do portal', 'ATIVA', 1),
  ('act-10', 'proj-3', 'Documentação', 'RH-DOC', 'DOCUMENTAÇÃO', 'Documentação técnica', 'ATIVA', 2),
  ('act-11', 'proj-3', 'Treinamento', 'RH-TREINO', 'REUNIÃO', 'Treinamento de usuários', 'ATIVA', 3);

-- Atividades do Sistema Financeiro
INSERT OR IGNORE INTO activities (id, project_id, name, code, type, description, status, display_order) VALUES 
  ('act-12', 'proj-4', 'Migração de Dados', 'FIN-MIGRACAO', 'DESENVOLVIMENTO', 'Migração do sistema legado', 'ATIVA', 1),
  ('act-13', 'proj-4', 'Desenvolvimento', 'FIN-DEV', 'DESENVOLVIMENTO', 'Desenvolvimento de funcionalidades', 'ATIVA', 2),
  ('act-14', 'proj-4', 'Homologação', 'FIN-HOMOLOG', 'TESTES', 'Testes de homologação', 'ATIVA', 3);

-- Atividades de Infraestrutura
INSERT OR IGNORE INTO activities (id, project_id, name, code, type, description, status, display_order) VALUES 
  ('act-15', 'proj-5', 'Suporte N1', 'INFRA-SUPORTE', 'SUPORTE', 'Suporte técnico nível 1', 'ATIVA', 1),
  ('act-16', 'proj-5', 'Manutenção Servidores', 'INFRA-MANUT', 'SUPORTE', 'Manutenção preventiva e corretiva', 'ATIVA', 2),
  ('act-17', 'proj-5', 'Monitoramento', 'INFRA-MONITOR', 'SUPORTE', 'Monitoramento de sistemas', 'ATIVA', 3);

-- ============================================
-- 5. USER PROJECT ASSIGNMENTS
-- ============================================

-- Colaboradores de TI no Projeto CRM
INSERT OR IGNORE INTO user_project_assignments (id, user_id, project_id, start_date, end_date, allowed_activities) VALUES 
  ('assign-1', 'user-col-1', 'proj-1', '2024-01-01', NULL, NULL),
  ('assign-2', 'user-col-2', 'proj-1', '2024-01-01', NULL, NULL),
  ('assign-3', 'user-col-3', 'proj-1', '2024-01-01', NULL, NULL);

-- Colaboradores de TI no App Mobile
INSERT OR IGNORE INTO user_project_assignments (id, user_id, project_id, start_date, end_date, allowed_activities) VALUES 
  ('assign-4', 'user-col-2', 'proj-2', '2024-03-01', NULL, NULL),
  ('assign-5', 'user-col-4', 'proj-2', '2024-03-01', NULL, NULL);

-- Colaboradores de TI na Infraestrutura
INSERT OR IGNORE INTO user_project_assignments (id, user_id, project_id, start_date, end_date, allowed_activities) VALUES 
  ('assign-6', 'user-col-1', 'proj-5', '2024-01-01', NULL, NULL),
  ('assign-7', 'user-col-3', 'proj-5', '2024-01-01', NULL, NULL),
  ('assign-8', 'user-col-4', 'proj-5', '2024-01-01', NULL, NULL);

-- Colaboradores de RH no Portal RH
INSERT OR IGNORE INTO user_project_assignments (id, user_id, project_id, start_date, end_date, allowed_activities) VALUES 
  ('assign-9', 'user-col-5', 'proj-3', '2024-02-01', NULL, NULL),
  ('assign-10', 'user-col-6', 'proj-3', '2024-02-01', NULL, NULL);

-- Colaboradores de Financeiro no Sistema Financeiro
INSERT OR IGNORE INTO user_project_assignments (id, user_id, project_id, start_date, end_date, allowed_activities) VALUES 
  ('assign-11', 'user-col-7', 'proj-4', '2024-01-15', NULL, NULL),
  ('assign-12', 'user-col-8', 'proj-4', '2024-01-15', NULL, NULL);

-- ============================================
-- 6. TIMESHEET ENTRIES (Exemplos da semana atual)
-- Segunda-feira: 2025-12-08 (semana começa domingo 2025-12-07)
-- ============================================

-- Lançamentos do João (user-col-1) - Status RASCUNHO
INSERT OR IGNORE INTO timesheet_entries (id, user_id, project_id, activity_id, entry_date, hours, description, week_start_date, status) VALUES 
  ('entry-1', 'user-col-1', 'proj-1', 'act-1', '2025-12-08', 6.00, 'Desenvolvimento de API de clientes', '2025-12-07', 'RASCUNHO'),
  ('entry-2', 'user-col-1', 'proj-5', 'act-15', '2025-12-08', 2.00, 'Suporte a usuários', '2025-12-07', 'RASCUNHO');

-- Lançamentos da Maria (user-col-2) - Status ENVIADO
INSERT OR IGNORE INTO timesheet_entries (id, user_id, project_id, activity_id, entry_date, hours, description, week_start_date, status, submitted_at) VALUES 
  ('entry-3', 'user-col-2', 'proj-1', 'act-2', '2025-12-08', 5.00, 'Desenvolvimento de tela de cadastro', '2025-12-07', 'ENVIADO', '2025-12-08 18:30:00'),
  ('entry-4', 'user-col-2', 'proj-2', 'act-6', '2025-12-08', 3.00, 'Desenvolvimento de módulo Android', '2025-12-07', 'ENVIADO', '2025-12-08 18:30:00');

-- Lançamentos da semana passada (2025-12-01, domingo 2025-12-01) - APROVADO_GESTOR
INSERT OR IGNORE INTO timesheet_entries (id, user_id, project_id, activity_id, entry_date, hours, description, week_start_date, status, submitted_at, manager_approved_at, manager_approved_by) VALUES 
  ('entry-5', 'user-col-1', 'proj-1', 'act-1', '2025-12-02', 8.00, 'Desenvolvimento backend', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-6', 'user-col-1', 'proj-1', 'act-1', '2025-12-03', 7.50, 'Desenvolvimento backend', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-7', 'user-col-1', 'proj-5', 'act-15', '2025-12-03', 0.50, 'Suporte rápido', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-8', 'user-col-1', 'proj-1', 'act-1', '2025-12-04', 8.00, 'Desenvolvimento backend', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-9', 'user-col-1', 'proj-1', 'act-3', '2025-12-05', 6.00, 'Testes unitários', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-10', 'user-col-1', 'proj-1', 'act-4', '2025-12-05', 2.00, 'Reunião de sprint', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1'),
  ('entry-11', 'user-col-1', 'proj-1', 'act-1', '2025-12-06', 8.00, 'Finalização de features', '2025-12-01', 'APROVADO_GESTOR', '2025-12-06 18:00:00', '2025-12-07 10:00:00', 'user-ges-1');
