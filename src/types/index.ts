// ============================================
// CLOUDFLARE BINDINGS
// ============================================
export type Bindings = {
  DB: D1Database;
};

// ============================================
// ENUMS
// ============================================
export type UserRole = 'COLABORADOR' | 'GESTOR' | 'DIRETOR';
export type UserStatus = 'ATIVO' | 'INATIVO';
export type ProjectStatus = 'PLANEJAMENTO' | 'ATIVO' | 'PAUSADO' | 'CONCLUÍDO' | 'CANCELADO';
export type ActivityStatus = 'ATIVA' | 'INATIVA';
export type TimesheetStatus = 'RASCUNHO' | 'ENVIADO' | 'APROVADO_GESTOR' | 'REPROVADO_GESTOR' | 'APROVADO_DIRETOR' | 'REPROVADO_DIRETOR';

// ============================================
// DATABASE MODELS
// ============================================
export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface User {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  matricula: string;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  department_id?: string;
  manager_id?: string;
  avatar_url?: string;
  timezone: string;
  weekly_hours: number;
  admission_date?: string;
  termination_date?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Project {
  id: string;
  name: string;
  code: string;
  description?: string;
  manager_id: string;
  client?: string;
  cost_center?: string;
  start_date: string;
  end_date?: string;
  status: ProjectStatus;
  budget_hours?: number;
  hourly_rate?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface Activity {
  id: string;
  project_id: string;
  name: string;
  code?: string;
  type: string;
  description?: string;
  status: ActivityStatus;
  display_order?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string;
}

export interface UserProjectAssignment {
  id: string;
  user_id: string;
  project_id: string;
  start_date: string;
  end_date?: string;
  allowed_activities?: string; // JSON array
  created_at: string;
  updated_at: string;
}

export interface TimesheetEntry {
  id: string;
  user_id: string;
  project_id: string;
  activity_id: string;
  entry_date: string;
  hours: number;
  description?: string;
  week_start_date: string;
  status: TimesheetStatus;
  submitted_at?: string;
  manager_approved_at?: string;
  manager_approved_by?: string;
  manager_rejection_reason?: string;
  director_approved_at?: string;
  director_approved_by?: string;
  director_rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user_id: string;
  affected_user_id?: string;
  entity_type: string;
  entity_id: string;
  action: string;
  old_values?: string; // JSON
  new_values?: string; // JSON
  justification?: string;
  ip_address?: string;
  user_agent?: string;
}

export interface WeeklyTemplate {
  id: string;
  user_id: string;
  name: string;
  is_default: number;
  template_data: string; // JSON
  created_at: string;
  updated_at: string;
}

// ============================================
// DTOs (Data Transfer Objects)
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface UserResponse {
  id: string;
  full_name: string;
  email: string;
  cpf: string;
  matricula: string;
  role: UserRole;
  status: UserStatus;
  department_id?: string;
  manager_id?: string;
  avatar_url?: string;
  timezone: string;
  weekly_hours: number;
  admission_date?: string;
  created_at: string;
}

export interface CreateUserRequest {
  full_name: string;
  email: string;
  cpf: string;
  matricula: string;
  password: string;
  role: UserRole;
  department_id?: string;
  manager_id?: string;
  weekly_hours?: number;
  admission_date?: string;
}

export interface UpdateUserRequest {
  full_name?: string;
  email?: string;
  cpf?: string;
  matricula?: string;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  department_id?: string;
  manager_id?: string;
  avatar_url?: string;
  weekly_hours?: number;
  admission_date?: string;
  termination_date?: string;
}

export interface CreateProjectRequest {
  name: string;
  code: string;
  description?: string;
  manager_id: string;
  client?: string;
  cost_center?: string;
  start_date: string;
  end_date?: string;
  budget_hours?: number;
  hourly_rate?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  code?: string;
  description?: string;
  manager_id?: string;
  client?: string;
  cost_center?: string;
  start_date?: string;
  end_date?: string;
  status?: ProjectStatus;
  budget_hours?: number;
  hourly_rate?: number;
}

export interface CreateActivityRequest {
  project_id: string;
  name: string;
  code?: string;
  type: string;
  description?: string;
  display_order?: number;
}

export interface UpdateActivityRequest {
  name?: string;
  code?: string;
  type?: string;
  description?: string;
  status?: ActivityStatus;
  display_order?: number;
}

export interface CreateTimesheetEntryRequest {
  project_id: string;
  activity_id: string;
  entry_date: string;
  hours: number;
  description?: string;
}

export interface UpdateTimesheetEntryRequest {
  hours?: number;
  description?: string;
}

export interface SubmitWeekRequest {
  week_start_date: string;
}

export interface ApproveRejectRequest {
  user_id: string;
  week_start_date: string;
  action: 'approve' | 'reject';
  reason?: string;
}

export interface DashboardStats {
  total_hours_week: number;
  total_hours_month: number;
  pending_approvals: number;
  status_summary: {
    rascunho: number;
    enviado: number;
    aprovado_gestor: number;
    reprovado_gestor: number;
    aprovado_diretor: number;
    reprovado_diretor: number;
  };
  hours_by_project: Array<{
    project_id: string;
    project_name: string;
    total_hours: number;
  }>;
}

// ============================================
// JWT PAYLOAD
// ============================================
export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ============================================
// PAGINATION
// ============================================
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ============================================
// API RESPONSE
// ============================================
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
