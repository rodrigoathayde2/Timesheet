import { Hono } from 'hono';
import { verifyPassword, generateToken } from '../utils/auth';
import { successResponse, errorResponse } from '../utils/response';
import { isValidEmail } from '../utils/validation';
import type { Bindings, LoginRequest, LoginResponse, User, JWTPayload } from '../types';

const auth = new Hono<{ Bindings: Bindings }>();

/**
 * POST /api/auth/login
 * Autenticação de usuário
 */
auth.post('/login', async (c) => {
  try {
    const body: LoginRequest = await c.req.json();
    const { email, password } = body;
    
    // Validações
    if (!email || !password) {
      return errorResponse(c, 'Email e senha são obrigatórios');
    }
    
    if (!isValidEmail(email)) {
      return errorResponse(c, 'Email inválido');
    }
    
    // Busca usuário
    const db = c.env.DB;
    const user = await db.prepare(
      'SELECT * FROM users WHERE email = ? AND deleted_at IS NULL'
    ).bind(email).first() as User | null;
    
    if (!user) {
      return errorResponse(c, 'Email ou senha incorretos', 401);
    }
    
    if (user.status !== 'ATIVO') {
      return errorResponse(c, 'Usuário inativo', 401);
    }
    
    // Verifica senha
    const isPasswordValid = await verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      return errorResponse(c, 'Email ou senha incorretos', 401);
    }
    
    // Gera token
    const payload: JWTPayload = {
      userId: user.id,
      email: user.email,
      role: user.role
    };
    const token = generateToken(payload);
    
    // Resposta
    const response: LoginResponse = {
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        cpf: user.cpf,
        matricula: user.matricula,
        role: user.role,
        status: user.status,
        department_id: user.department_id,
        manager_id: user.manager_id,
        avatar_url: user.avatar_url,
        timezone: user.timezone,
        weekly_hours: user.weekly_hours,
        admission_date: user.admission_date,
        created_at: user.created_at
      }
    };
    
    return successResponse(c, response, 'Login realizado com sucesso');
  } catch (error: any) {
    console.error('Erro no login:', error);
    return errorResponse(c, 'Erro ao realizar login', 500);
  }
});

/**
 * GET /api/auth/me
 * Retorna dados do usuário autenticado
 */
auth.get('/me', async (c) => {
  try {
    const userPayload = c.get('user') as JWTPayload;
    
    const db = c.env.DB;
    const user = await db.prepare(
      'SELECT id, full_name, email, cpf, matricula, role, status, department_id, manager_id, avatar_url, timezone, weekly_hours, admission_date, created_at FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(userPayload.userId).first();
    
    if (!user) {
      return errorResponse(c, 'Usuário não encontrado', 404);
    }
    
    return successResponse(c, user);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return errorResponse(c, 'Erro ao buscar usuário', 500);
  }
});

export default auth;
