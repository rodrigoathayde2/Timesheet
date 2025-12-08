import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/response';
import { getCurrentDate, getWeekStartDate, getMonthStartDate, getMonthEndDate } from '../utils/date';
import type { Bindings, JWTPayload, DashboardStats } from '../types';

const dashboard = new Hono<{ Bindings: Bindings }>();

// GET /api/dashboard/stats - Estatísticas do dashboard
dashboard.get('/stats', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const db = c.env.DB;
    const today = getCurrentDate();
    const weekStart = getWeekStartDate(today);
    const monthStart = getMonthStartDate(today);
    const monthEnd = getMonthEndDate(today);
    
    // Total de horas da semana
    const weekHours = await db.prepare(`
      SELECT COALESCE(SUM(hours), 0) as total
      FROM timesheet_entries
      WHERE user_id = ? AND week_start_date = ?
    `).bind(user.userId, weekStart).first() as any;
    
    // Total de horas do mês
    const monthHours = await db.prepare(`
      SELECT COALESCE(SUM(hours), 0) as total
      FROM timesheet_entries
      WHERE user_id = ? AND entry_date BETWEEN ? AND ?
    `).bind(user.userId, monthStart, monthEnd).first() as any;
    
    // Pendências (timesheets em rascunho ou reprovados)
    const pending = await db.prepare(`
      SELECT COUNT(DISTINCT week_start_date) as count
      FROM timesheet_entries
      WHERE user_id = ? AND status IN ('RASCUNHO', 'REPROVADO_GESTOR', 'REPROVADO_DIRETOR')
    `).bind(user.userId).first() as any;
    
    // Resumo de status
    const statusSummary = await db.prepare(`
      SELECT status, COUNT(DISTINCT week_start_date) as count
      FROM timesheet_entries
      WHERE user_id = ?
      GROUP BY status
    `).bind(user.userId).all();
    
    const statusMap: any = {
      rascunho: 0,
      enviado: 0,
      aprovado_gestor: 0,
      reprovado_gestor: 0,
      aprovado_diretor: 0,
      reprovado_diretor: 0
    };
    
    statusSummary.results.forEach((s: any) => {
      const key = s.status.toLowerCase();
      statusMap[key] = s.count;
    });
    
    // Horas por projeto (mês atual)
    const hoursByProject = await db.prepare(`
      SELECT 
        p.id as project_id,
        p.name as project_name,
        SUM(t.hours) as total_hours
      FROM timesheet_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      WHERE t.user_id = ? AND t.entry_date BETWEEN ? AND ?
      GROUP BY p.id, p.name
      ORDER BY total_hours DESC
    `).bind(user.userId, monthStart, monthEnd).all();
    
    // Pendências de aprovação (para gestores/diretores)
    let pendingApprovals = 0;
    if (user.role === 'GESTOR' || user.role === 'DIRETOR') {
      let query = `
        SELECT COUNT(DISTINCT t.user_id || '-' || t.week_start_date) as count
        FROM timesheet_entries t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.status = 'ENVIADO'
      `;
      
      if (user.role === 'GESTOR') {
        query += ' AND u.manager_id = ?';
        const result = await db.prepare(query).bind(user.userId).first() as any;
        pendingApprovals = result?.count || 0;
      } else {
        const result = await db.prepare(query).first() as any;
        pendingApprovals = result?.count || 0;
      }
    }
    
    const stats: DashboardStats = {
      total_hours_week: weekHours?.total || 0,
      total_hours_month: monthHours?.total || 0,
      pending_approvals: user.role === 'COLABORADOR' ? (pending?.count || 0) : pendingApprovals,
      status_summary: statusMap,
      hours_by_project: hoursByProject.results as any[]
    };
    
    return successResponse(c, stats);
  } catch (error) {
    console.error('Erro ao buscar stats do dashboard:', error);
    return errorResponse(c, 'Erro ao buscar estatísticas', 500);
  }
});

// GET /api/dashboard/team - Estatísticas da equipe (Gestor)
dashboard.get('/team', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    
    if (user.role === 'COLABORADOR') {
      return errorResponse(c, 'Acesso negado', 403);
    }
    
    const db = c.env.DB;
    const monthStart = getMonthStartDate(getCurrentDate());
    const monthEnd = getMonthEndDate(getCurrentDate());
    
    let query = `
      SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(DISTINCT t.week_start_date) as weeks_count,
        SUM(t.hours) as total_hours,
        AVG(t.hours) as avg_hours
      FROM users u
      LEFT JOIN timesheet_entries t ON u.id = t.user_id 
        AND t.entry_date BETWEEN ? AND ?
      WHERE u.deleted_at IS NULL
    `;
    
    const params: any[] = [monthStart, monthEnd];
    
    if (user.role === 'GESTOR') {
      query += ' AND u.manager_id = ?';
      params.push(user.userId);
    }
    
    query += ' GROUP BY u.id, u.full_name, u.email ORDER BY total_hours DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao buscar stats da equipe:', error);
    return errorResponse(c, 'Erro ao buscar estatísticas da equipe', 500);
  }
});

// GET /api/dashboard/executive - Dashboard executivo (Diretor)
dashboard.get('/executive', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    
    if (user.role !== 'DIRETOR') {
      return errorResponse(c, 'Acesso negado', 403);
    }
    
    const db = c.env.DB;
    const monthStart = getMonthStartDate(getCurrentDate());
    const monthEnd = getMonthEndDate(getCurrentDate());
    
    // Total geral de horas
    const totalHours = await db.prepare(`
      SELECT COALESCE(SUM(hours), 0) as total
      FROM timesheet_entries
      WHERE entry_date BETWEEN ? AND ?
    `).bind(monthStart, monthEnd).first() as any;
    
    // Total de colaboradores ativos
    const activeUsers = await db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE status = 'ATIVO' AND deleted_at IS NULL
    `).first() as any;
    
    // Horas por departamento
    const hoursByDept = await db.prepare(`
      SELECT 
        d.name as department,
        COUNT(DISTINCT u.id) as users_count,
        SUM(t.hours) as total_hours
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN timesheet_entries t ON u.id = t.user_id 
        AND t.entry_date BETWEEN ? AND ?
      WHERE d.deleted_at IS NULL
      GROUP BY d.id, d.name
      ORDER BY total_hours DESC
    `).bind(monthStart, monthEnd).all();
    
    // Top 10 projetos
    const topProjects = await db.prepare(`
      SELECT 
        p.name as project_name,
        p.code as project_code,
        COUNT(DISTINCT t.user_id) as users_count,
        SUM(t.hours) as total_hours
      FROM projects p
      LEFT JOIN timesheet_entries t ON p.id = t.project_id 
        AND t.entry_date BETWEEN ? AND ?
      WHERE p.deleted_at IS NULL
      GROUP BY p.id, p.name, p.code
      ORDER BY total_hours DESC
      LIMIT 10
    `).bind(monthStart, monthEnd).all();
    
    // Taxa de aprovação
    const approvalRate = await db.prepare(`
      SELECT 
        SUM(CASE WHEN status IN ('APROVADO_GESTOR', 'APROVADO_DIRETOR') THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as rate
      FROM (
        SELECT DISTINCT user_id, week_start_date, status
        FROM timesheet_entries
        WHERE entry_date BETWEEN ? AND ?
      )
    `).bind(monthStart, monthEnd).first() as any;
    
    return successResponse(c, {
      total_hours: totalHours?.total || 0,
      active_users: activeUsers?.count || 0,
      hours_by_department: hoursByDept.results,
      top_projects: topProjects.results,
      approval_rate: approvalRate?.rate || 0
    });
  } catch (error) {
    console.error('Erro ao buscar dashboard executivo:', error);
    return errorResponse(c, 'Erro ao buscar dashboard executivo', 500);
  }
});

export default dashboard;
