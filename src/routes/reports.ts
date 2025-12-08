import { Hono } from 'hono';
import { successResponse, errorResponse } from '../utils/response';
import { requireManager, requireDirector } from '../middleware/auth';
import type { Bindings, JWTPayload } from '../types';

const reports = new Hono<{ Bindings: Bindings }>();

// GET /api/reports/individual - Relatório individual
reports.get('/individual', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const format = c.req.query('format') || 'json'; // json, csv
    
    if (!startDate || !endDate) {
      return errorResponse(c, 'start_date e end_date são obrigatórios');
    }
    
    const query = `
      SELECT 
        t.entry_date,
        p.name as project_name,
        p.code as project_code,
        a.name as activity_name,
        a.type as activity_type,
        t.hours,
        t.description,
        t.status,
        t.submitted_at,
        t.manager_approved_at,
        u_manager.full_name as approved_by
      FROM timesheet_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN activities a ON t.activity_id = a.id
      LEFT JOIN users u_manager ON t.manager_approved_by = u_manager.id
      WHERE t.user_id = ? AND t.entry_date BETWEEN ? AND ?
      ORDER BY t.entry_date DESC, p.name ASC
    `;
    
    const result = await db.prepare(query).bind(user.userId, startDate, endDate).all();
    
    // Calcular totais
    const entries = result.results as any[];
    const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
    
    // Horas por projeto
    const byProject: any = {};
    entries.forEach(e => {
      const key = e.project_name || 'Sem projeto';
      byProject[key] = (byProject[key] || 0) + e.hours;
    });
    
    if (format === 'csv') {
      // Gerar CSV
      let csv = 'Data,Projeto,Código,Atividade,Tipo,Horas,Descrição,Status,Enviado em,Aprovado em,Aprovado por\n';
      entries.forEach(e => {
        csv += `${e.entry_date},${e.project_name},${e.project_code},${e.activity_name},${e.activity_type},${e.hours},"${e.description || ''}",${e.status},${e.submitted_at || ''},${e.manager_approved_at || ''},${e.approved_by || ''}\n`;
      });
      csv += `\nTotal de Horas,${totalHours}\n`;
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_individual_${startDate}_${endDate}.csv"`
        }
      });
    }
    
    return successResponse(c, {
      period: { start_date: startDate, end_date: endDate },
      entries,
      summary: {
        total_hours: totalHours,
        total_entries: entries.length,
        by_project: byProject
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório individual:', error);
    return errorResponse(c, 'Erro ao gerar relatório', 500);
  }
});

// GET /api/reports/team - Relatório de equipe (Gestor/Diretor)
reports.get('/team', requireManager, async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const userId = c.req.query('user_id'); // Opcional
    const format = c.req.query('format') || 'json';
    
    if (!startDate || !endDate) {
      return errorResponse(c, 'start_date e end_date são obrigatórios');
    }
    
    let query = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.email,
        t.week_start_date,
        COUNT(DISTINCT t.entry_date) as days_count,
        SUM(t.hours) as total_hours,
        MAX(t.status) as status,
        MAX(t.submitted_at) as submitted_at,
        MAX(t.manager_approved_at) as approved_at
      FROM timesheet_entries t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.entry_date BETWEEN ? AND ?
    `;
    
    const params: any[] = [startDate, endDate];
    
    if (user.role === 'GESTOR') {
      query += ' AND u.manager_id = ?';
      params.push(user.userId);
    }
    
    if (userId) {
      query += ' AND u.id = ?';
      params.push(userId);
    }
    
    query += ' GROUP BY u.id, u.full_name, u.email, t.week_start_date ORDER BY u.full_name, t.week_start_date';
    
    const result = await db.prepare(query).bind(...params).all();
    
    if (format === 'csv') {
      let csv = 'Colaborador,Email,Semana,Dias,Total Horas,Status,Enviado em,Aprovado em\n';
      (result.results as any[]).forEach(r => {
        csv += `${r.full_name},${r.email},${r.week_start_date},${r.days_count},${r.total_hours},${r.status},${r.submitted_at || ''},${r.approved_at || ''}\n`;
      });
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_equipe_${startDate}_${endDate}.csv"`
        }
      });
    }
    
    return successResponse(c, {
      period: { start_date: startDate, end_date: endDate },
      data: result.results
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de equipe:', error);
    return errorResponse(c, 'Erro ao gerar relatório', 500);
  }
});

// GET /api/reports/project - Relatório por projeto
reports.get('/project', requireManager, async (c) => {
  try {
    const db = c.env.DB;
    
    const projectId = c.req.query('project_id');
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const format = c.req.query('format') || 'json';
    
    if (!projectId || !startDate || !endDate) {
      return errorResponse(c, 'project_id, start_date e end_date são obrigatórios');
    }
    
    const query = `
      SELECT 
        u.full_name as collaborator,
        a.name as activity_name,
        a.type as activity_type,
        t.entry_date,
        t.hours,
        t.description
      FROM timesheet_entries t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN activities a ON t.activity_id = a.id
      WHERE t.project_id = ? AND t.entry_date BETWEEN ? AND ?
      ORDER BY u.full_name, t.entry_date
    `;
    
    const result = await db.prepare(query).bind(projectId, startDate, endDate).all();
    
    // Totais
    const entries = result.results as any[];
    const totalHours = entries.reduce((sum, e) => sum + (e.hours || 0), 0);
    
    const byCollaborator: any = {};
    const byActivity: any = {};
    
    entries.forEach(e => {
      byCollaborator[e.collaborator] = (byCollaborator[e.collaborator] || 0) + e.hours;
      byActivity[e.activity_name] = (byActivity[e.activity_name] || 0) + e.hours;
    });
    
    if (format === 'csv') {
      let csv = 'Colaborador,Atividade,Tipo,Data,Horas,Descrição\n';
      entries.forEach(e => {
        csv += `${e.collaborator},${e.activity_name},${e.activity_type},${e.entry_date},${e.hours},"${e.description || ''}"\n`;
      });
      csv += `\nTotal,${totalHours}\n`;
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_projeto_${projectId}_${startDate}_${endDate}.csv"`
        }
      });
    }
    
    return successResponse(c, {
      project_id: projectId,
      period: { start_date: startDate, end_date: endDate },
      entries,
      summary: {
        total_hours: totalHours,
        by_collaborator: byCollaborator,
        by_activity: byActivity
      }
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de projeto:', error);
    return errorResponse(c, 'Erro ao gerar relatório', 500);
  }
});

// GET /api/reports/audit - Relatório de auditoria (Diretor)
reports.get('/audit', requireDirector, async (c) => {
  try {
    const db = c.env.DB;
    
    const startDate = c.req.query('start_date');
    const endDate = c.req.query('end_date');
    const entityType = c.req.query('entity_type');
    const action = c.req.query('action');
    const format = c.req.query('format') || 'json';
    
    let query = `
      SELECT 
        a.timestamp,
        u.full_name as user_name,
        u.email as user_email,
        ua.full_name as affected_user_name,
        a.entity_type,
        a.entity_id,
        a.action,
        a.justification,
        a.ip_address
      FROM audit_logs a
      LEFT JOIN users u ON a.user_id = u.id
      LEFT JOIN users ua ON a.affected_user_id = ua.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    if (startDate) {
      query += ' AND a.timestamp >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND a.timestamp <= ?';
      params.push(endDate + ' 23:59:59');
    }
    
    if (entityType) {
      query += ' AND a.entity_type = ?';
      params.push(entityType);
    }
    
    if (action) {
      query += ' AND a.action = ?';
      params.push(action);
    }
    
    query += ' ORDER BY a.timestamp DESC LIMIT 1000';
    
    const result = await db.prepare(query).bind(...params).all();
    
    if (format === 'csv') {
      let csv = 'Data/Hora,Usuário,Email,Usuário Afetado,Entidade,ID Entidade,Ação,Justificativa,IP\n';
      (result.results as any[]).forEach(r => {
        csv += `${r.timestamp},${r.user_name},${r.user_email},${r.affected_user_name || ''},${r.entity_type},${r.entity_id},${r.action},"${r.justification || ''}",${r.ip_address || ''}\n`;
      });
      
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="relatorio_auditoria_${startDate}_${endDate}.csv"`
        }
      });
    }
    
    return successResponse(c, {
      filters: { start_date: startDate, end_date: endDate, entity_type: entityType, action },
      data: result.results,
      count: result.results.length
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de auditoria:', error);
    return errorResponse(c, 'Erro ao gerar relatório', 500);
  }
});

export default reports;
