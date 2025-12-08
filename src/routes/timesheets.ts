import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';
import { getWeekStartDate, getCurrentDate } from '../utils/date';
import { isValidDate, isValidHours, isQuarterHour } from '../utils/validation';
import { requireManager, requireDirector } from '../middleware/auth';
import type { Bindings, CreateTimesheetEntryRequest, JWTPayload, TimesheetEntry } from '../types';

const timesheets = new Hono<{ Bindings: Bindings }>();

// GET /api/timesheets - Lista lançamentos do usuário autenticado
timesheets.get('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const db = c.env.DB;
    const weekStart = c.req.query('week_start_date');
    const status = c.req.query('status');
    
    let query = `
      SELECT 
        t.*,
        p.name as project_name,
        p.code as project_code,
        a.name as activity_name,
        a.type as activity_type
      FROM timesheet_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN activities a ON t.activity_id = a.id
      WHERE t.user_id = ?
    `;
    const params: any[] = [user.userId];
    
    if (weekStart) {
      query += ' AND t.week_start_date = ?';
      params.push(weekStart);
    }
    
    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY t.entry_date DESC, t.created_at DESC';
    
    const result = await db.prepare(query).bind(...params).all();
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar lançamentos:', error);
    return errorResponse(c, 'Erro ao listar lançamentos', 500);
  }
});

// GET /api/timesheets/week/:weekStart - Lançamentos de uma semana específica
timesheets.get('/week/:weekStart', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const weekStart = c.req.param('weekStart');
    const db = c.env.DB;
    
    const query = `
      SELECT 
        t.*,
        p.name as project_name,
        p.code as project_code,
        a.name as activity_name,
        a.type as activity_type
      FROM timesheet_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN activities a ON t.activity_id = a.id
      WHERE t.user_id = ? AND t.week_start_date = ?
      ORDER BY t.entry_date ASC, p.name ASC
    `;
    
    const result = await db.prepare(query).bind(user.userId, weekStart).all();
    
    // Calcular totais
    const entries = result.results as any[];
    const totalHours = entries.reduce((sum: number, e: any) => sum + (e.hours || 0), 0);
    
    return successResponse(c, {
      entries,
      week_start_date: weekStart,
      total_hours: totalHours,
      status: entries[0]?.status || 'RASCUNHO'
    });
  } catch (error) {
    console.error('Erro ao buscar semana:', error);
    return errorResponse(c, 'Erro ao buscar semana', 500);
  }
});

// POST /api/timesheets - Criar lançamento
timesheets.post('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const body: CreateTimesheetEntryRequest = await c.req.json();
    const db = c.env.DB;
    
    // Validações
    if (!body.project_id || !body.activity_id || !body.entry_date || body.hours === undefined) {
      return errorResponse(c, 'Campos obrigatórios: project_id, activity_id, entry_date, hours');
    }
    
    if (!isValidDate(body.entry_date)) {
      return errorResponse(c, 'Data inválida');
    }
    
    if (!isValidHours(body.hours)) {
      return errorResponse(c, 'Horas devem estar entre 0.25 e 24');
    }
    
    if (!isQuarterHour(body.hours)) {
      return errorResponse(c, 'Horas devem ser múltiplo de 0.25 (15 minutos)');
    }
    
    // Verifica se usuário está vinculado ao projeto
    const assignment = await db.prepare(`
      SELECT * FROM user_project_assignments 
      WHERE user_id = ? AND project_id = ?
      AND start_date <= ? AND (end_date IS NULL OR end_date >= ?)
    `).bind(user.userId, body.project_id, body.entry_date, body.entry_date).first();
    
    if (!assignment) {
      return errorResponse(c, 'Você não está vinculado a este projeto na data selecionada');
    }
    
    // Verifica se atividade pertence ao projeto e está ativa
    const activity = await db.prepare(
      'SELECT * FROM activities WHERE id = ? AND project_id = ? AND status = "ATIVA"'
    ).bind(body.activity_id, body.project_id).first();
    
    if (!activity) {
      return errorResponse(c, 'Atividade inválida ou inativa');
    }
    
    // Calcula início da semana
    const weekStart = getWeekStartDate(body.entry_date);
    
    // Verifica total de horas do dia
    const dayTotal = await db.prepare(`
      SELECT SUM(hours) as total FROM timesheet_entries 
      WHERE user_id = ? AND entry_date = ?
    `).bind(user.userId, body.entry_date).first() as any;
    
    const currentDayTotal = dayTotal?.total || 0;
    if (currentDayTotal + body.hours > 24) {
      return errorResponse(c, `Total de horas do dia excede 24h (atual: ${currentDayTotal}h)`);
    }
    
    // Cria lançamento
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO timesheet_entries (
        id, user_id, project_id, activity_id, entry_date, hours, description,
        week_start_date, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RASCUNHO', ?, ?)
    `).bind(
      id, user.userId, body.project_id, body.activity_id, body.entry_date,
      body.hours, body.description || null, weekStart, now, now
    ).run();
    
    const newEntry = await db.prepare(`
      SELECT t.*, p.name as project_name, a.name as activity_name
      FROM timesheet_entries t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN activities a ON t.activity_id = a.id
      WHERE t.id = ?
    `).bind(id).first();
    
    return successResponse(c, newEntry, 'Lançamento criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar lançamento:', error);
    return errorResponse(c, 'Erro ao criar lançamento', 500);
  }
});

// PUT /api/timesheets/:id - Atualizar lançamento (apenas RASCUNHO)
timesheets.put('/:id', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const id = c.req.param('id');
    const body = await c.req.json();
    const db = c.env.DB;
    
    const entry = await db.prepare(
      'SELECT * FROM timesheet_entries WHERE id = ? AND user_id = ?'
    ).bind(id, user.userId).first() as TimesheetEntry | null;
    
    if (!entry) {
      return notFoundResponse(c, 'Lançamento não encontrado');
    }
    
    if (entry.status !== 'RASCUNHO') {
      return errorResponse(c, 'Apenas lançamentos em RASCUNHO podem ser editados');
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.hours !== undefined) {
      if (!isValidHours(body.hours) || !isQuarterHour(body.hours)) {
        return errorResponse(c, 'Horas inválidas');
      }
      updates.push('hours = ?');
      params.push(body.hours);
    }
    
    if (body.description !== undefined) {
      updates.push('description = ?');
      params.push(body.description);
    }
    
    if (updates.length === 0) {
      return errorResponse(c, 'Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    await db.prepare(`UPDATE timesheet_entries SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    const updated = await db.prepare('SELECT * FROM timesheet_entries WHERE id = ?').bind(id).first();
    return successResponse(c, updated, 'Lançamento atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar lançamento:', error);
    return errorResponse(c, 'Erro ao atualizar lançamento', 500);
  }
});

// DELETE /api/timesheets/:id - Deletar lançamento (apenas RASCUNHO)
timesheets.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const entry = await db.prepare(
      'SELECT * FROM timesheet_entries WHERE id = ? AND user_id = ?'
    ).bind(id, user.userId).first() as TimesheetEntry | null;
    
    if (!entry) {
      return notFoundResponse(c, 'Lançamento não encontrado');
    }
    
    if (entry.status !== 'RASCUNHO') {
      return errorResponse(c, 'Apenas lançamentos em RASCUNHO podem ser excluídos');
    }
    
    await db.prepare('DELETE FROM timesheet_entries WHERE id = ?').bind(id).run();
    
    return successResponse(c, null, 'Lançamento excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir lançamento:', error);
    return errorResponse(c, 'Erro ao excluir lançamento', 500);
  }
});

// POST /api/timesheets/submit - Enviar semana para aprovação
timesheets.post('/submit', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const { week_start_date } = await c.req.json();
    const db = c.env.DB;
    
    if (!week_start_date) {
      return errorResponse(c, 'week_start_date é obrigatório');
    }
    
    // Busca lançamentos da semana
    const entries = await db.prepare(`
      SELECT * FROM timesheet_entries 
      WHERE user_id = ? AND week_start_date = ? AND status = 'RASCUNHO'
    `).bind(user.userId, week_start_date).all();
    
    if (!entries.results || entries.results.length === 0) {
      return errorResponse(c, 'Nenhum lançamento em rascunho para enviar');
    }
    
    // Atualiza status para ENVIADO
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE timesheet_entries 
      SET status = 'ENVIADO', submitted_at = ?, updated_at = ?
      WHERE user_id = ? AND week_start_date = ? AND status = 'RASCUNHO'
    `).bind(now, now, user.userId, week_start_date).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: user.userId,
      entity_type: 'TIMESHEET_WEEK',
      entity_id: week_start_date,
      action: 'SUBMIT',
      new_values: { week_start_date, count: entries.results.length }
    });
    
    return successResponse(c, { week_start_date, submitted_count: entries.results.length }, 'Semana enviada para aprovação');
  } catch (error) {
    console.error('Erro ao enviar semana:', error);
    return errorResponse(c, 'Erro ao enviar semana', 500);
  }
});

// POST /api/timesheets/approve - Aprovar semana (Gestor)
timesheets.post('/approve', requireManager, async (c) => {
  try {
    const currentUser = c.get('user') as JWTPayload;
    const { user_id, week_start_date, reason } = await c.req.json();
    const db = c.env.DB;
    
    if (!user_id || !week_start_date) {
      return errorResponse(c, 'user_id e week_start_date são obrigatórios');
    }
    
    // Verifica se é subordinado (para gestores)
    if (currentUser.role === 'GESTOR') {
      const subordinate = await db.prepare(
        'SELECT id FROM users WHERE id = ? AND manager_id = ?'
      ).bind(user_id, currentUser.userId).first();
      
      if (!subordinate) {
        return errorResponse(c, 'Você só pode aprovar timesheets de seus subordinados', 403);
      }
    }
    
    // Atualiza status
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE timesheet_entries 
      SET status = 'APROVADO_GESTOR', manager_approved_at = ?, manager_approved_by = ?, updated_at = ?
      WHERE user_id = ? AND week_start_date = ? AND status = 'ENVIADO'
    `).bind(now, currentUser.userId, now, user_id, week_start_date).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: currentUser.userId,
      affected_user_id: user_id,
      entity_type: 'TIMESHEET_WEEK',
      entity_id: week_start_date,
      action: 'APPROVE_MANAGER',
      new_values: { week_start_date, reason }
    });
    
    return successResponse(c, null, 'Semana aprovada com sucesso');
  } catch (error) {
    console.error('Erro ao aprovar semana:', error);
    return errorResponse(c, 'Erro ao aprovar semana', 500);
  }
});

// POST /api/timesheets/reject - Reprovar semana (Gestor)
timesheets.post('/reject', requireManager, async (c) => {
  try {
    const currentUser = c.get('user') as JWTPayload;
    const { user_id, week_start_date, reason } = await c.req.json();
    const db = c.env.DB;
    
    if (!user_id || !week_start_date || !reason) {
      return errorResponse(c, 'user_id, week_start_date e reason são obrigatórios');
    }
    
    if (reason.length < 10) {
      return errorResponse(c, 'Justificativa deve ter no mínimo 10 caracteres');
    }
    
    // Verifica se é subordinado (para gestores)
    if (currentUser.role === 'GESTOR') {
      const subordinate = await db.prepare(
        'SELECT id FROM users WHERE id = ? AND manager_id = ?'
      ).bind(user_id, currentUser.userId).first();
      
      if (!subordinate) {
        return errorResponse(c, 'Você só pode reprovar timesheets de seus subordinados', 403);
      }
    }
    
    // Atualiza status de volta para RASCUNHO
    const now = new Date().toISOString();
    await db.prepare(`
      UPDATE timesheet_entries 
      SET status = 'REPROVADO_GESTOR', manager_rejection_reason = ?, updated_at = ?
      WHERE user_id = ? AND week_start_date = ? AND status IN ('ENVIADO', 'APROVADO_GESTOR')
    `).bind(reason, now, user_id, week_start_date).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: currentUser.userId,
      affected_user_id: user_id,
      entity_type: 'TIMESHEET_WEEK',
      entity_id: week_start_date,
      action: 'REJECT_MANAGER',
      new_values: { week_start_date, reason },
      justification: reason
    });
    
    return successResponse(c, null, 'Semana reprovada');
  } catch (error) {
    console.error('Erro ao reprovar semana:', error);
    return errorResponse(c, 'Erro ao reprovar semana', 500);
  }
});

// GET /api/timesheets/pending-approvals - Pendências de aprovação (Gestor)
timesheets.get('/pending-approvals', requireManager, async (c) => {
  try {
    const currentUser = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    let query = `
      SELECT 
        t.user_id,
        t.week_start_date,
        u.full_name,
        u.email,
        COUNT(*) as entries_count,
        SUM(t.hours) as total_hours,
        MIN(t.submitted_at) as submitted_at
      FROM timesheet_entries t
      LEFT JOIN users u ON t.user_id = u.id
      WHERE t.status = 'ENVIADO'
    `;
    
    const params: any[] = [];
    
    // Gestor vê apenas subordinados
    if (currentUser.role === 'GESTOR') {
      query += ' AND u.manager_id = ?';
      params.push(currentUser.userId);
    }
    
    query += ' GROUP BY t.user_id, t.week_start_date ORDER BY submitted_at ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao buscar pendências:', error);
    return errorResponse(c, 'Erro ao buscar pendências', 500);
  }
});

export default timesheets;
