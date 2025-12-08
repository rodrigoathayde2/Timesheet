import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { requireManager } from '../middleware/auth';
import type { Bindings, CreateActivityRequest, UpdateActivityRequest, JWTPayload } from '../types';

const activities = new Hono<{ Bindings: Bindings }>();

// GET /api/activities - Lista atividades (com filtro por projeto)
activities.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const projectId = c.req.query('project_id');
    
    let query = 'SELECT * FROM activities WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (projectId) {
      query += ' AND project_id = ?';
      params.push(projectId);
    }
    
    query += ' ORDER BY display_order ASC, name ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar atividades:', error);
    return errorResponse(c, 'Erro ao listar atividades', 500);
  }
});

// GET /api/activities/:id
activities.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const activity = await db.prepare(
      'SELECT * FROM activities WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!activity) {
      return notFoundResponse(c, 'Atividade não encontrada');
    }
    
    return successResponse(c, activity);
  } catch (error) {
    console.error('Erro ao buscar atividade:', error);
    return errorResponse(c, 'Erro ao buscar atividade', 500);
  }
});

// POST /api/activities (Gestor/Diretor)
activities.post('/', requireManager, async (c) => {
  try {
    const body: CreateActivityRequest = await c.req.json();
    
    if (!body.project_id || !body.name || !body.type) {
      return errorResponse(c, 'Campos obrigatórios: project_id, name, type');
    }
    
    const db = c.env.DB;
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO activities (
        id, project_id, name, code, type, description, status, display_order, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'ATIVA', ?, ?, ?)
    `).bind(
      id, body.project_id, body.name, body.code || null, body.type,
      body.description || null, body.display_order || 999, now, now
    ).run();
    
    const newActivity = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
    return successResponse(c, newActivity, 'Atividade criada com sucesso', 201);
  } catch (error: any) {
    console.error('Erro ao criar atividade:', error);
    if (error.message?.includes('UNIQUE')) {
      return errorResponse(c, 'Já existe uma atividade com este nome neste projeto');
    }
    return errorResponse(c, 'Erro ao criar atividade', 500);
  }
});

// PUT /api/activities/:id (Gestor/Diretor)
activities.put('/:id', requireManager, async (c) => {
  try {
    const id = c.req.param('id');
    const body: UpdateActivityRequest = await c.req.json();
    const db = c.env.DB;
    
    const existing = await db.prepare(
      'SELECT * FROM activities WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!existing) {
      return notFoundResponse(c, 'Atividade não encontrada');
    }
    
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.name !== undefined) { updates.push('name = ?'); params.push(body.name); }
    if (body.code !== undefined) { updates.push('code = ?'); params.push(body.code); }
    if (body.type !== undefined) { updates.push('type = ?'); params.push(body.type); }
    if (body.description !== undefined) { updates.push('description = ?'); params.push(body.description); }
    if (body.status !== undefined) { updates.push('status = ?'); params.push(body.status); }
    if (body.display_order !== undefined) { updates.push('display_order = ?'); params.push(body.display_order); }
    
    if (updates.length === 0) {
      return errorResponse(c, 'Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    await db.prepare(`UPDATE activities SET ${updates.join(', ')} WHERE id = ?`).bind(...params).run();
    
    const updated = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
    return successResponse(c, updated, 'Atividade atualizada com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar atividade:', error);
    return errorResponse(c, 'Erro ao atualizar atividade', 500);
  }
});

export default activities;
