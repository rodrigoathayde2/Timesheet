import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { JWTPayload } from '../types';

// Chave secreta para JWT (em produção, usar variável de ambiente)
const JWT_SECRET = process.env.JWT_SECRET || 'timesheet-secret-key-2024';
const JWT_EXPIRES_IN = '8h'; // Token expira em 8 horas

/**
 * Hash de senha usando bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = bcrypt.genSaltSync(12);
  return bcrypt.hashSync(password, salt);
}

/**
 * Verifica se a senha está correta
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return bcrypt.compareSync(password, hash);
  } catch (error) {
    console.error('Erro ao verificar senha:', error);
    return false;
  }
}

/**
 * Gera token JWT
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verifica e decodifica token JWT
 */
export function verifyToken(token: string): JWTPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Token inválido ou expirado');
  }
}

/**
 * Extrai token do header Authorization
 */
export function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;
  
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
  
  return parts[1];
}
