import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { createAuditLog } from '../utils/audit';
import { requireManager, requireDirector } from '../middleware/auth';
import type { Bindings, CreateProjectRequest, UpdateProjectRequest, JWTPayload } from '../types';

const projects = new Hono<{ Bindings: Bindings }>();

// GET /api/projects - Lista projetos
projects.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const user = c.get('user') as JWTPayload;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    const status = c.req.query('status');
    
    let query = `
      SELECT
          projects.id,
          projects.name,
          projects.code,
          projects.description,
          projects.manager_id,
          users.full_name manager_name,
          projects.client,
          projects.cost_center,
          projects.start_date,
          projects.end_date,
          projects.status,
          projects.budget_hours,
          projects.hourly_rate,
          projects.created_at,
          projects.updated_at,
          projects.deleted_at
      FROM projects
      LEFT JOIN users ON
          projects.manager_id = users.id
      WHERE projects.deleted_at IS NULL
    `;
    const params: any[] = [];
    
    // Colaborador vê apenas projetos que está vinculado
    if (user.role === 'COLABORADOR') {
      query += ' AND projects.id IN (SELECT project_id FROM user_project_assignments WHERE user_id = ?)';
      params.push(user.userId);
    }
    
    if (status) {
      query += ' AND projects.status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY projects.name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM projects WHERE deleted_at IS NULL';
    const countParams: any[] = [];
    
    if (user.role === 'COLABORADOR') {
      countQuery += ' AND id IN (SELECT project_id FROM user_project_assignments WHERE user_id = ?)';
      countParams.push(user.userId);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = (countResult?.total as number) || 0;
    
    return successResponse(c, {
      data: result.results,
      pagination: { page, limit, total, total_pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Erro ao listar projetos:', error);
    return errorResponse(c, 'Erro ao listar projetos', 500);
  }
});

// GET /api/projects/:id - Busca projeto por ID
projects.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const project = await db.prepare(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!project) {
      return notFoundResponse(c, 'Projeto não encontrado');
    }
    
    return successResponse(c, project);
  } catch (error) {
    console.error('Erro ao buscar projeto:', error);
    return errorResponse(c, 'Erro ao buscar projeto', 500);
  }
});

// POST /api/projects - Cria projeto (apenas Gestor/Diretor)
projects.post('/', requireManager, async (c) => {
  try {
    const body: CreateProjectRequest = await c.req.json();
    const currentUser = c.get('user') as JWTPayload;
    
    if (!body.name || !body.code || !body.manager_id || !body.start_date) {
      return errorResponse(c, 'Campos obrigatórios: name, code, manager_id, start_date');
    }
    
    const db = c.env.DB;
    
    // Verifica duplicidade
    const existing = await db.prepare(
      'SELECT id FROM projects WHERE (name = ? OR code = ?) AND deleted_at IS NULL'
    ).bind(body.name, body.code).first();
    
    if (existing) {
      return errorResponse(c, 'Nome ou código já cadastrados');
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO projects (
        id, name, code, description, manager_id, client, cost_center,
        start_date, end_date, status, budget_hours, hourly_rate, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'ATIVO', ?, ?, ?, ?)
    `).bind(
      id, body.name, body.code, body.description || null, body.manager_id,
      body.client || null, body.cost_center || null, body.start_date,
      body.end_date || null, body.budget_hours || null, body.hourly_rate || null,
      now, now
    ).run();
    
    await createAuditLog(db, {
      user_id: currentUser.userId,
      entity_type: 'PROJECT',
      entity_id: id,
      action: 'CREATE',
      new_values: body
    });
    
    const newProject = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return successResponse(c, newProject, 'Projeto criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar projeto:', error);
    return errorResponse(c, 'Erro ao criar projeto', 500);
  }
});

// PUT /api/projects/:id - Atualiza projeto
projects.put('/:id', requireManager, async (c) => {
  try {
    const id = c.req.param('id');
    const body: UpdateProjectRequest = await c.req.json();
    const currentUser = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    const existing = await db.prepare(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!existing) {
      return notFoundResponse(c, 'Projeto não encontrado');
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.code !== undefined) { updates.push('code = ?'); params.push(body.code); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
    if (body.manager_id !== undefined) { updates.push('manager_id = ?'); params.push(body.manager_id); }
    if (body.client !== undefined) { updates.push('client = ?'); params.push(body.client); }
    if (body.cost_center !== undefined) { updates.push('cost_center = ?'); params.push(body.cost_center); }
    if (body.start_date !== undefined) { updates.push('start_date = ?'); params.push(body.start_date); }
    if (body.end_date !== undefined) { updates.push('end_date = ?'); params.push(body.end_date); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.budget_hours !== undefined) { updates.push('budget_hours = ?'); params.push(body.budget_hours); }
    if (body.hourly_rate !== undefined) { updates.push('hourly_rate = ?'); params.push(body.hourly_rate); }
    
    if (updates.length === 0) {
      return errorResponse(c, 'Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    await db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    await createAuditLog(db, {
      user_id: currentUser.userId,
      entity_type: 'PROJECT',
      entity_id: id,
      action: 'UPDATE',
      old_values: existing,
      new_values: body
    });
    
    const updated = await db.prepare('SELECT * FROM projects WHERE id = ?').bind(id).first();
    return successResponse(c, updated, 'Projeto atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar projeto:', error);
    return errorResponse(c, 'Erro ao atualizar projeto', 500);
  }
});

// DELETE /api/projects/:id - Remove projeto (soft delete, apenas Diretor)
projects.delete('/:id', requireDirector, async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    const project = await db.prepare(
      'SELECT * FROM projects WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!project) {
      return notFoundResponse(c, 'Projeto não encontrado');
    }
    
    // Verifica se tem horas lançadas
    const hasEntries = await db.prepare(
      'SELECT id FROM timesheet_entries WHERE project_id = ? LIMIT 1'
    ).bind(id).first();
    
    if (hasEntries) {
      return errorResponse(c, 'Não é possível excluir projeto com horas lançadas. Considere inativar o projeto.');
    }
    
    const now = new Date().toISOString();
    await db.prepare(
      'UPDATE projects SET deleted_at = ?, updated_at = ? WHERE id = ?'
    ).bind(now, now, id).run();
    
    await createAuditLog(db, {
      user_id: currentUser.userId,
      entity_type: 'PROJECT',
      entity_id: id,
      action: 'DELETE',
      old_values: project
    });
    
    return successResponse(c, null, 'Projeto removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover projeto:', error);
    return errorResponse(c, 'Erro ao remover projeto', 500);
  }
});

export default projects;
