import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response';
import { getWeekStartDate } from '../utils/date';
import type { Bindings, JWTPayload } from '../types';

const templates = new Hono<{ Bindings: Bindings }>();

// GET /api/templates - Lista templates do usuário
templates.get('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const db = c.env.DB;
    
    const result = await db.prepare(`
      SELECT * FROM weekly_templates 
      WHERE user_id = ? 
      ORDER BY is_default DESC, name ASC
    `).bind(user.userId).all();
    
    return successResponse(c, result.results);
  } catch (error) {
    console.error('Erro ao listar templates:', error);
    return errorResponse(c, 'Erro ao listar templates', 500);
  }
});

// POST /api/templates - Criar template da semana atual
templates.post('/', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const { name, week_start_date, set_as_default } = await c.req.json();
    const db = c.env.DB;
    
    if (!name || !week_start_date) {
      return errorResponse(c, 'name e week_start_date são obrigatórios');
    }
    
    // Busca lançamentos da semana
    const entries = await db.prepare(`
      SELECT project_id, activity_id, hours, description
      FROM timesheet_entries
      WHERE user_id = ? AND week_start_date = ?
    `).bind(user.userId, week_start_date).all();
    
    if (!entries.results || entries.results.length === 0) {
      return errorResponse(c, 'Nenhum lançamento encontrado nesta semana');
    }
    
    // Remove default de outros templates se necessário
    if (set_as_default) {
      await db.prepare(`
        UPDATE weekly_templates 
        SET is_default = 0 
        WHERE user_id = ?
      `).bind(user.userId).run();
    }
    
    // Cria template
    const id = uuidv4();
    const now = new Date().toISOString();
    const templateData = JSON.stringify(entries.results);
    
    await db.prepare(`
      INSERT INTO weekly_templates (id, user_id, name, is_default, template_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, user.userId, name, set_as_default ? 1 : 0, templateData, now, now).run();
    
    const newTemplate = await db.prepare(`
      SELECT * FROM weekly_templates WHERE id = ?
    `).bind(id).first();
    
    return successResponse(c, newTemplate, 'Template criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar template:', error);
    return errorResponse(c, 'Erro ao criar template', 500);
  }
});

// POST /api/templates/:id/apply - Aplicar template
templates.post('/:id/apply', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const templateId = c.req.param('id');
    const { week_start_date } = await c.req.json();
    const db = c.env.DB;
    
    if (!week_start_date) {
      return errorResponse(c, 'week_start_date é obrigatório');
    }
    
    // Busca template
    const template = await db.prepare(`
      SELECT * FROM weekly_templates 
      WHERE id = ? AND user_id = ?
    `).bind(templateId, user.userId).first() as any;
    
    if (!template) {
      return notFoundResponse(c, 'Template não encontrado');
    }
    
    // Verifica se semana já tem lançamentos
    const existing = await db.prepare(`
      SELECT COUNT(*) as count FROM timesheet_entries
      WHERE user_id = ? AND week_start_date = ?
    `).bind(user.userId, week_start_date).first() as any;
    
    if (existing?.count > 0) {
      return errorResponse(c, 'Esta semana já possui lançamentos. Exclua-os antes de aplicar o template.');
    }
    
    // Aplica template
    const templateData = JSON.parse(template.template_data);
    const now = new Date().toISOString();
    let created = 0;
    
    // Criar lançamentos para cada dia da semana
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const entryDate = new Date(week_start_date);
      entryDate.setDate(entryDate.getDate() + dayOffset);
      const dateStr = entryDate.toISOString().split('T')[0];
      
      for (const entry of templateData) {
        const id = uuidv4();
        
        try {
          await db.prepare(`
            INSERT INTO timesheet_entries (
              id, user_id, project_id, activity_id, entry_date, hours, description,
              week_start_date, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RASCUNHO', ?, ?)
          `).bind(
            id, user.userId, entry.project_id, entry.activity_id, dateStr,
            entry.hours, entry.description, week_start_date, now, now
          ).run();
          created++;
        } catch (e) {
          // Ignora erros de duplicação
          console.log('Erro ao criar entry do template:', e);
        }
      }
    }
    
    return successResponse(c, { created_entries: created }, 'Template aplicado com sucesso');
  } catch (error) {
    console.error('Erro ao aplicar template:', error);
    return errorResponse(c, 'Erro ao aplicar template', 500);
  }
});

// DELETE /api/templates/:id - Deletar template
templates.delete('/:id', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const templateId = c.req.param('id');
    const db = c.env.DB;
    
    const template = await db.prepare(`
      SELECT * FROM weekly_templates WHERE id = ? AND user_id = ?
    `).bind(templateId, user.userId).first();
    
    if (!template) {
      return notFoundResponse(c, 'Template não encontrado');
    }
    
    await db.prepare('DELETE FROM weekly_templates WHERE id = ?').bind(templateId).run();
    
    return successResponse(c, null, 'Template excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir template:', error);
    return errorResponse(c, 'Erro ao excluir template', 500);
  }
});

// POST /api/templates/copy-week - Copiar semana anterior
templates.post('/copy-week', async (c) => {
  try {
    const user = c.get('user') as JWTPayload;
    const { source_week, target_week } = await c.req.json();
    const db = c.env.DB;
    
    if (!source_week || !target_week) {
      return errorResponse(c, 'source_week e target_week são obrigatórios');
    }
    
    // Busca lançamentos da semana origem
    const sourceEntries = await db.prepare(`
      SELECT project_id, activity_id, hours, description
      FROM timesheet_entries
      WHERE user_id = ? AND week_start_date = ?
    `).bind(user.userId, source_week).all();
    
    if (!sourceEntries.results || sourceEntries.results.length === 0) {
      return errorResponse(c, 'Nenhum lançamento encontrado na semana origem');
    }
    
    // Verifica se semana destino já tem lançamentos
    const existing = await db.prepare(`
      SELECT COUNT(*) as count FROM timesheet_entries
      WHERE user_id = ? AND week_start_date = ?
    `).bind(user.userId, target_week).first() as any;
    
    if (existing?.count > 0) {
      return errorResponse(c, 'A semana destino já possui lançamentos');
    }
    
    // Copia lançamentos mantendo o mesmo dia da semana
    const now = new Date().toISOString();
    let created = 0;
    
    const sourceStart = new Date(source_week);
    const targetStart = new Date(target_week);
    
    for (const entry of sourceEntries.results as any[]) {
      // Busca a data original do entry
      const originalEntry = await db.prepare(`
        SELECT entry_date FROM timesheet_entries
        WHERE user_id = ? AND week_start_date = ? AND project_id = ? AND activity_id = ?
        LIMIT 1
      `).bind(user.userId, source_week, entry.project_id, entry.activity_id).first() as any;
      
      if (originalEntry) {
        const sourceDate = new Date(originalEntry.entry_date);
        const dayOffset = Math.floor((sourceDate.getTime() - sourceStart.getTime()) / (1000 * 60 * 60 * 24));
        
        const targetDate = new Date(targetStart);
        targetDate.setDate(targetDate.getDate() + dayOffset);
        const targetDateStr = targetDate.toISOString().split('T')[0];
        
        const id = uuidv4();
        
        try {
          await db.prepare(`
            INSERT INTO timesheet_entries (
              id, user_id, project_id, activity_id, entry_date, hours, description,
              week_start_date, status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'RASCUNHO', ?, ?)
          `).bind(
            id, user.userId, entry.project_id, entry.activity_id, targetDateStr,
            entry.hours, entry.description, target_week, now, now
          ).run();
          created++;
        } catch (e) {
          console.log('Erro ao copiar entry:', e);
        }
      }
    }
    
    return successResponse(c, { created_entries: created }, `${created} lançamentos copiados com sucesso`);
  } catch (error) {
    console.error('Erro ao copiar semana:', error);
    return errorResponse(c, 'Erro ao copiar semana', 500);
  }
});

export default templates;
