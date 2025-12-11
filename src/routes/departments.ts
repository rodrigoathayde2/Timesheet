import { Hono } from 'hono';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import type { Bindings } from '../types';

const departments = new Hono<{ Bindings: Bindings }>();

departments.get('/', async (c) => {
  try {
    const db = c.env.DB;
    const departmentId = c.req.query('department_id');
    
    let query = 'SELECT * FROM departments WHERE deleted_at IS NULL';
    const params: any[] = [];
    
    if (departmentId) {
      query += ' AND id = ?';
      params.push(departmentId);
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await db.prepare(query).bind(...params).all();
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar departamentos:', error);
    return errorResponse(c, 'Erro ao listar departamentos', 500);
  }
});

departments.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const db = c.env.DB;
    
    const activity = await db.prepare(
      'SELECT * FROM departments WHERE id = ? AND deleted_at IS NULL'
    ).bind(id).first();
    
    if (!activity) {
      return notFoundResponse(c, 'Departamento não encontrado');
    }
    
    return successResponse(c, activity);
  } catch (error) {
    console.error('Erro ao buscar departamento:', error);
    return errorResponse(c, 'Erro ao buscar departamento', 500);
  }
});

export default departments;
