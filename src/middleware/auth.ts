import { Context, Next } from 'hono';
import { extractToken, verifyToken } from '../utils/auth';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response';
import type { Bindings, UserRole, JWTPayload } from '../types';

/**
 * Middleware de autenticação
 * Verifica se o token JWT é válido
 */
export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');
  const token = extractToken(authHeader);
  
  if (!token) {
    return unauthorizedResponse(c, 'Token não fornecido');
  }
  
  try {
    const payload = verifyToken(token);
    
    // Busca usuário no banco
    const db = c.env.DB;
    const user = await db.prepare(
      'SELECT id, email, role, status FROM users WHERE id = ? AND deleted_at IS NULL'
    ).bind(payload.userId).first();
    
    if (!user) {
      return unauthorizedResponse(c, 'Usuário não encontrado');
    }
    
    if (user.status !== 'ATIVO') {
      return unauthorizedResponse(c, 'Usuário inativo');
    }
    
    // Adiciona dados do usuário ao contexto
    c.set('user', {
      userId: user.id as string,
      email: user.email as string,
      role: user.role as UserRole
    });
    
    await next();
  } catch (error: any) {
    return unauthorizedResponse(c, error.message || 'Token inválido');
  }
}

/**
 * Middleware de autorização por role
 * Verifica se o usuário tem permissão baseada no role
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return async (c: Context<{ Bindings: Bindings }>, next: Next) => {
    const user = c.get('user') as JWTPayload | undefined;
    
    if (!user) {
      return unauthorizedResponse(c, 'Usuário não autenticado');
    }
    
    if (!allowedRoles.includes(user.role)) {
      return forbiddenResponse(c, 'Você não tem permissão para acessar este recurso');
    }
    
    await next();
  };
}

/**
 * Middleware para verificar se é gestor ou diretor
 */
export const requireManager = requireRole('GESTOR', 'DIRETOR');

/**
 * Middleware para verificar se é diretor
 */
export const requireDirector = requireRole('DIRETOR');

/**
 * Middleware para verificar se pode editar timesheet de outro usuário
 * Gestor pode editar de seus subordinados, Diretor pode editar de qualquer um
 */
export async function canEditTimesheetMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const user = c.get('user') as JWTPayload;
  const targetUserId = c.req.param('userId') || c.req.query('user_id');
  
  // Se é o próprio usuário, pode editar
  if (user.userId === targetUserId) {
    await next();
    return;
  }
  
  // Se é diretor, pode editar qualquer um
  if (user.role === 'DIRETOR') {
    await next();
    return;
  }
  
  // Se é gestor, verifica se é subordinado
  if (user.role === 'GESTOR') {
    const db = c.env.DB;
    const subordinate = await db.prepare(
      'SELECT id FROM users WHERE id = ? AND manager_id = ? AND deleted_at IS NULL'
    ).bind(targetUserId, user.userId).first();
    
    if (subordinate) {
      await next();
      return;
    }
  }
  
  return forbiddenResponse(c, 'Você não tem permissão para editar timesheet deste usuário');
}
