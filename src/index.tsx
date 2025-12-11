import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import type { Bindings } from './types';

// Import rotas
import auth from './routes/auth';
import users from './routes/users';
import projects from './routes/projects';
import activities from './routes/activities';
import timesheets from './routes/timesheets';
import dashboard from './routes/dashboard';
import reports from './routes/reports';
import templates from './routes/templates';

// Import middleware
import { authMiddleware } from './middleware/auth';

const app = new Hono<{ Bindings: Bindings }>();

// Middleware CORS para API
app.use('/api/*', cors());

// Middleware de autenticação para rotas protegidas (exceto /api/auth/login)
app.use('/api/*', async (c, next) => {
  const path = c.req.path;
  if (path === '/api/auth/login') {
    await next();
  } else {
    await authMiddleware(c, next);
  }
});

// Servir arquivos estáticos
app.use('/static/*', serveStatic({ root: './public' }));

// Rotas de autenticação (login é público, /me é protegido)
app.route('/api/auth', auth);

// Rotas protegidas
app.route('/api/users', users);
app.route('/api/projects', projects);
app.route('/api/activities', activities);
app.route('/api/timesheets', timesheets);
app.route('/api/dashboard', dashboard);
app.route('/api/reports', reports);
app.route('/api/templates', templates);

// Página principal
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sistema de Timesheet</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div id="app"></div>
        
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
        <script src="/static/timesheet-app.js"></script>
    </body>
    </html>
  `);
});

// Rota de healthcheck
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;
