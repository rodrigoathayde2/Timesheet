import { v4 as uuidv4 } from 'uuid';
import type { AuditLog } from '../types';

/**
 * Cria log de auditoria
 */
export async function createAuditLog(
  db: D1Database,
  params: {
    user_id: string;
    affected_user_id?: string;
    entity_type: string;
    entity_id: string;
    action: string;
    old_values?: any;
    new_values?: any;
    justification?: string;
    ip_address?: string;
    user_agent?: string;
  }
): Promise<void> {
  const id = uuidv4();
  
  await db.prepare(`
    INSERT INTO audit_logs (
      id, user_id, affected_user_id, entity_type, entity_id,
      action, old_values, new_values, justification, ip_address, user_agent
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    params.user_id,
    params.affected_user_id || null,
    params.entity_type,
    params.entity_id,
    params.action,
    params.old_values ? JSON.stringify(params.old_values) : null,
    params.new_values ? JSON.stringify(params.new_values) : null,
    params.justification || null,
    params.ip_address || null,
    params.user_agent || null
  ).run();
}

/**
 * Busca logs de auditoria por filtros
 */
export async function getAuditLogs(
  db: D1Database,
  filters: {
    entity_type?: string;
    entity_id?: string;
    user_id?: string;
    affected_user_id?: string;
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }
): Promise<AuditLog[]> {
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params: any[] = [];
  
  if (filters.entity_type) {
    query += ' AND entity_type = ?';
    params.push(filters.entity_type);
  }
  
  if (filters.entity_id) {
    query += ' AND entity_id = ?';
    params.push(filters.entity_id);
  }
  
  if (filters.user_id) {
    query += ' AND user_id = ?';
    params.push(filters.user_id);
  }
  
  if (filters.affected_user_id) {
    query += ' AND affected_user_id = ?';
    params.push(filters.affected_user_id);
  }
  
  if (filters.start_date) {
    query += ' AND timestamp >= ?';
    params.push(filters.start_date);
  }
  
  if (filters.end_date) {
    query += ' AND timestamp <= ?';
    params.push(filters.end_date);
  }
  
  query += ' ORDER BY timestamp DESC';
  
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
    
    if (filters.offset) {
      query += ' OFFSET ?';
      params.push(filters.offset);
    }
  }
  
  const result = await db.prepare(query).bind(...params).all();
  return result.results as AuditLog[];
}
