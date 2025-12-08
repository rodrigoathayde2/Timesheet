import type { Context } from 'hono';
import type { ApiResponse } from '../types';

/**
 * Resposta de sucesso
 */
export function successResponse<T>(c: Context, data: T, message?: string, status: number = 200) {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message
  };
  return c.json(response, status);
}

/**
 * Resposta de erro
 */
export function errorResponse(c: Context, error: string, status: number = 400) {
  const response: ApiResponse = {
    success: false,
    error
  };
  return c.json(response, status);
}

/**
 * Resposta 404
 */
export function notFoundResponse(c: Context, message: string = 'Recurso não encontrado') {
  return errorResponse(c, message, 404);
}

/**
 * Resposta 401
 */
export function unauthorizedResponse(c: Context, message: string = 'Não autorizado') {
  return errorResponse(c, message, 401);
}

/**
 * Resposta 403
 */
export function forbiddenResponse(c: Context, message: string = 'Acesso negado') {
  return errorResponse(c, message, 403);
}

/**
 * Resposta 500
 */
export function serverErrorResponse(c: Context, message: string = 'Erro interno do servidor') {
  return errorResponse(c, message, 500);
}
