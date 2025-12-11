import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/auth';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { isValidEmail, isValidCPF, isStrongPassword } from '../utils/validation';
import { createAuditLog } from '../utils/audit';
import { requireDirector } from '../middleware/auth';
import type { Bindings, CreateUserRequest, UpdateUserRequest, User, JWTPayload } from '../types';

const users = new Hono<{ Bindings: Bindings }>();

// Todas as rotas de usuários requerem autenticação
// e apenas DIRETOR pode gerenciar usuários

/**
 * GET /api/users
 * Lista todos os usuários (com paginação e filtros)
 */

users.get('/', requireDirector, async (c) => {
  try {
    const db = c.env.DB;
    const page = parseInt(c.req.query('page') || '1');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = (page - 1) * limit;
    
    const name = c.req.query('name');
    const role = c.req.query('role');
    const status = c.req.query('status');
    const departmentId = c.req.query('department_id');
    
    let query = `SELECT
        users.id,
        users.full_name,
        users.email,
        users.cpf,
        users.matricula,
        users.role,
        users.status,
        users.department_id,
        departments.name department_name,
        users.manager_id,
        manager.full_name manager_name,
        users.avatar_url,
        users.timezone,
        users.weekly_hours,
        users.admission_date,
        users.created_at 
    FROM users
    LEFT JOIN departments ON
        users.department_id = departments.id
    LEFT JOIN users manager ON
        users.manager_id = manager.id
    WHERE users.deleted_at IS NULL`;

    const params: any[] = [];
    
    if (name) {
      query += ' AND users.full_name LIKE ?';
      params.push(`%${name}%`);
    }
    
    if (role) {
      query += ' AND users.role = ?';
      params.push(role);
    }
    
    if (status) {
      query += ' AND users.status = ?';
      params.push(status);
    }
    
    if (departmentId) {
      query += ' AND users.department_id = ?';
      params.push(departmentId);
    }
    
    query += ' ORDER BY users.full_name ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const result = await db.prepare(query).bind(...params).all();
    
    // Count total
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL';
    const countParams: any[] = [];
    
    if (name) {
      countQuery += ' AND full_name LIKE ?';
      countParams.push(`%${name}%`);
    }
    
    if (role) {
      countQuery += ' AND role = ?';
      countParams.push(role);
    }
    
    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }
    
    if (departmentId) {
      countQuery += ' AND department_id = ?';
      countParams.push(departmentId);
    }
    
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const total = (countResult?.total as number) || 0;
    
    return successResponse(c, {
      data: result.results,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return errorResponse(c, 'Erro ao listar usuários', 500);
  }
});

users.get('/managers', requireDirector, async (c) => {
  try {
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT id, full_name, email, cpf, matricula, role, status, department_id, avatar_url, created_at
      FROM users
      WHERE role in ('GESTOR', 'DIRETOR')
      ORDER BY full_name ASC
    `).all();
    
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar superiores:', error);
    return errorResponse(c, 'Erro ao listar superiores', 500);
  }
});

/**
 * GET /api/users/:id
 * Busca usuário por ID
 */
users.get('/:id', requireDirector, async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const user = await db.prepare(
      'SELECT id, full_name, email, cpf, matricula, role, status, department_id, manager_id, avatar_url, timezone, weekly_hours, admission_date, termination_date, created_at, updated_at FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!user) {
      return notFoundResponse(c, 'Usuário não encontrado');
    }
    
    return successResponse(c, user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return errorResponse(c, 'Erro ao buscar usuário', 500);
  }
});

/**
 * POST /api/users
 * Cria novo usuário
 */
users.post('/', requireDirector, async (c) => {
  try {
    const body: CreateUserRequest = await c.req.json();
    const currentUser = c.get('user') as JWTPayload;
    
    // Validações
    if (!body.full_name || !body.email || !body.cpf || !body.matricula || !body.password || !body.role) {
      return errorResponse(c, 'Campos obrigatórios: full_name, email, cpf, matricula, password, role');
    }
    
    if (!isValidEmail(body.email)) {
      return errorResponse(c, 'Email inválido');
    }
    
    if (!isValidCPF(body.cpf)) {
      return errorResponse(c, 'CPF inválido');
    }
    
    if (!isStrongPassword(body.password)) {
      return errorResponse(c, 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números');
    }
    
    const db = c.env.DB;
    
    // Verifica duplicidade
    const existing = await db.prepare(
      'SELECT id FROM users WHERE (email = ? OR cpf = ? OR matricula = ?) AND deleted_at IS NULL'
    ).bind(body.email, body.cpf, body.matricula).first();
    
    if (existing) {
      return errorResponse(c, 'Email, CPF ou matrícula já cadastrados');
    }
    
    // Hash da senha
    const password_hash = await hashPassword(body.password);
    
    // Cria usuário
    const id = uuidv4();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO users (
        id, full_name, email, cpf, matricula, password_hash, role, status,
        department_id, manager_id, timezone, weekly_hours, admission_date,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ATIVO', ?, ?, 'America/Sao_Paulo', ?, ?, ?, ?)
    `).bind(
      id,
      body.full_name,
      body.email,
      body.cpf.replace(/\D/g, ''),
      body.matricula,
      password_hash,
      body.role,
      body.department_id || null,
      body.manager_id || null,
      body.weekly_hours || 40.00,
      body.admission_date || null,
      now,
      now
    ).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: currentUser.userId,
      entity_type: 'USER',
      entity_id: id,
      action: 'CREATE',
      new_values: { ...body, password: '[REDACTED]' }
    });
    
    // Busca usuário criado
    const newUser = await db.prepare(
      'SELECT id, full_name, email, cpf, matricula, role, status, department_id, manager_id, timezone, weekly_hours, admission_date, created_at FROM users WHERE id = ?'
    ).bind(id).first();
    
    return successResponse(c, newUser, 'Usuário criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    return errorResponse(c, 'Erro ao criar usuário', 500);
  }
});

/**
 * PUT /api/users/:id
 * Atualiza usuário
 */
users.put('/:id', requireDirector, async (c) => {
  try {
    const id = c.req.param('id');
    const body: UpdateUserRequest = await c.req.json();
    const currentUser = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    // Busca usuário existente
    const existingUser = await db.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first() as User | null;
    
    if (!existingUser) {
      return notFoundResponse(c, 'Usuário não encontrado');
    }
    
    if (body.password && !isStrongPassword(body.password)) {
      return errorResponse(c, 'Senha deve ter no mínimo 8 caracteres, incluindo maiúsculas, minúsculas e números');
    }
        
    const updates: string[] = [];
    const params: any[] = [];
    
    if (body.full_name !== undefined) {
      updates.push('full_name = ?');
      params.push(body.full_name);
    }
    
    if (body.password !== undefined) {
      updates.push('password_hash = ?');
      params.push(await hashPassword(body.password));
    }
    
    if (body.role !== undefined) {
      updates.push('role = ?');
      params.push(body.role);
    }
    
    if (body.status !== undefined) {
      updates.push('status = ?');
      params.push(body.status);
    }
    
    if (body.department_id !== undefined) {
      updates.push('department_id = ?');
      params.push(body.department_id);
    }
    
    if (body.manager_id !== undefined) {
      updates.push('manager_id = ?');
      params.push(body.manager_id);
    }
    
    if (body.weekly_hours !== undefined) {
      updates.push('weekly_hours = ?');
      params.push(body.weekly_hours);
    }
    
    if (body.termination_date) {
      updates.push('termination_date = ?');
      params.push(body.termination_date);
    }
    
    if (updates.length === 0) {
      return errorResponse(c, 'Nenhum campo para atualizar');
    }
    
    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);
    
    // Atualiza
    await db.prepare(`
      UPDATE users SET ${updates.join(', ')} WHERE id = ?
    `).bind(...params).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: currentUser.userId,
      affected_user_id: id,
      entity_type: 'USER',
      entity_id: id,
      action: 'UPDATE',
      old_values: existingUser,
      new_values: body
    });
    
    // Busca usuário atualizado
    const updatedUser = await db.prepare(
      'SELECT id, full_name, email, cpf, matricula, role, status, department_id, manager_id, avatar_url, timezone, weekly_hours, admission_date, termination_date, created_at, updated_at FROM users WHERE id = ?'
    ).bind(id).first();
    
    return successResponse(c, updatedUser, 'Usuário atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return errorResponse(c, 'Erro ao atualizar usuário', 500);
  }
});

/**
 * DELETE /api/users/:id
 * Remove usuário (soft delete)
 */
users.delete('/:id', requireDirector, async (c) => {
  try {
    const id = c.req.param('id');
    const currentUser = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    // Busca usuário
    const user = await db.prepare(
      'SELECT * FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!user) {
      return notFoundResponse(c, 'Usuário não encontrado');
    }
    
    // Soft delete
    const now = new Date().toISOString();
    await db.prepare(
      'UPDATE users SET deleted_at = ?, status = \'INATIVO\', updated_at = ? WHERE id = ?'
    ).bind(now, now, id).run();
    
    // Audit log
    await createAuditLog(db, {
      user_id: currentUser.userId,
      affected_user_id: id,
      entity_type: 'USER',
      entity_id: id,
      action: 'DELETE',
      old_values: user
    });
    
    return successResponse(c, null, 'Usuário removido com sucesso');
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    return errorResponse(c, 'Erro ao remover usuário', 500);
  }
});

/**
 * GET /api/users/subordinates/:managerId
 * Lista subordinados de um gestor
 */
users.get('/subordinates/:managerId', requireDirector, async (c) => {
  try {
    const managerId = c.req.param('managerId');
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT id, full_name, email, cpf, matricula, role, status, department_id, avatar_url, created_at
      FROM users
      WHERE manager_id = ? AND deleted_at IS NULL
      ORDER BY full_name ASC
    `).bind(managerId).all();
    
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar subordinados:', error);
    return errorResponse(c, 'Erro ao listar subordinados', 500);
  }
});

export default users;
