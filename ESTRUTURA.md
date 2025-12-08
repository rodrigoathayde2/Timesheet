# 📁 Estrutura do Projeto - Sistema de Timesheet

## 📂 Diretórios Principais

```
Timesheet/
├── src/                      # Código fonte TypeScript
│   ├── middleware/          # Middlewares (autenticação, etc)
│   ├── routes/              # Rotas da API (8 módulos)
│   ├── types/               # Tipos TypeScript
│   └── utils/               # Utilitários (auth, validação, etc)
├── public/                  # Assets estáticos
│   └── static/              # JavaScript frontend
├── migrations/              # Migrations do banco D1
├── dist/                    # Build de produção (gerado)
└── node_modules/            # Dependências (gerado)
```

---

## 📄 Arquivos Principais

### **Configuração do Projeto**
- `package.json` - Dependências e scripts npm
- `package-lock.json` - Lock de versões
- `tsconfig.json` - Configuração TypeScript
- `vite.config.ts` - Build com Vite
- `wrangler.jsonc` - Configuração Cloudflare Workers/D1
- `ecosystem.config.cjs` - Configuração PM2 para desenvolvimento
- `.gitignore` - Arquivos ignorados pelo Git

### **Documentação**
- `README.md` - Documentação completa do sistema (448 linhas)
- `ESTRUTURA.md` - Este arquivo

---

## 🎯 Backend (src/)

### **Middleware** (`src/middleware/`)
- `auth.ts` - Autenticação JWT e RBAC

### **Rotas da API** (`src/routes/`)
| Arquivo | Descrição | Rotas |
|---------|-----------|-------|
| `auth.ts` | Autenticação (login, me) | 2 |
| `users.ts` | CRUD de usuários (Diretor) | 6 |
| `projects.ts` | CRUD de projetos | 5 |
| `activities.ts` | CRUD de atividades | 4 |
| `timesheets.ts` | Lançamento e aprovações | 7 |
| `dashboard.ts` | Dashboards (colaborador, gestor, diretor) | 3 |
| `reports.ts` | Relatórios + exportação CSV | 4 |
| `templates.ts` | Templates de semana | 4 |

**Total de Rotas API**: 35+

### **Utilitários** (`src/utils/`)
- `auth.ts` - Geração/verificação JWT, hash bcrypt
- `validation.ts` - Validações (CPF, email, horas, datas)
- `response.ts` - Padronização de respostas API
- `audit.ts` - Sistema de auditoria
- `date.ts` - Manipulação de datas

### **Tipos** (`src/types/`)
- `index.ts` - TypeScript interfaces completas (6946 linhas)

---

## 🎨 Frontend (public/static/)

### **JavaScript Frontend**
| Arquivo | Descrição | Linhas |
|---------|-----------|--------|
| `app.js` | Sistema principal (login, dashboard, relatórios) | 700+ |
| `timesheet-app.js` | Interface de lançamento de horas | 1200+ |

**Total Frontend**: 1900+ linhas JavaScript vanilla

---

## 🗄️ Banco de Dados

### **Migrations** (`migrations/`)
- `0001_initial_schema.sql` - Schema inicial (8 tabelas)
- `0002_allow_multiple_entries.sql` - Permite múltiplos lançamentos

### **Seed Data**
- `seed.sql` - Dados de teste (usuários, projetos, atividades)

### **Tabelas**
1. `departments` - Departamentos
2. `users` - Usuários (3 perfis)
3. `projects` - Projetos
4. `activities` - Atividades
5. `timesheet_entries` - Lançamentos de horas
6. `user_project_assignments` - Vínculos usuário-projeto
7. `audit_logs` - Auditoria completa
8. `weekly_templates` - Templates de semana

---

## 📦 Scripts npm

```json
{
  "dev": "vite",
  "dev:sandbox": "wrangler pages dev dist --ip 0.0.0.0 --port 3000",
  "dev:d1": "wrangler pages dev dist --d1=webapp-production --local --ip 0.0.0.0 --port 3000",
  "build": "vite build",
  "preview": "wrangler pages dev dist",
  "deploy": "npm run build && wrangler pages deploy dist",
  "deploy:prod": "npm run build && wrangler pages deploy dist --project-name webapp",
  "cf-typegen": "wrangler types --env-interface CloudflareBindings",
  "clean-port": "fuser -k 3000/tcp 2>/dev/null || true",
  "test": "curl http://localhost:3000",
  "db:migrate:local": "wrangler d1 migrations apply webapp-production --local",
  "db:migrate:prod": "wrangler d1 migrations apply webapp-production",
  "db:seed": "wrangler d1 execute webapp-production --local --file=./seed.sql",
  "db:reset": "rm -rf .wrangler/state/v3/d1 && npm run db:migrate:local && npm run db:seed",
  "db:console:local": "wrangler d1 execute webapp-production --local",
  "db:console:prod": "wrangler d1 execute webapp-production",
  "git:init": "git init && git add . && git commit -m 'Initial commit'",
  "git:commit": "git add . && git commit -m",
  "git:status": "git status",
  "git:log": "git log --oneline"
}
```

---

## 🔧 Tecnologias

### **Backend**
- **Hono** 4.10+ - Framework web ultrarrápido
- **Cloudflare Workers** - Edge runtime
- **Cloudflare D1** - SQLite distribuído
- **TypeScript** 5.x - Tipagem estática
- **bcryptjs** 3.0 - Hash de senhas
- **jsonwebtoken** 9.0 - Autenticação JWT
- **uuid** 13.0 - Geração de IDs

### **Frontend**
- **Vanilla JavaScript** - Sem frameworks pesados
- **TailwindCSS** 3.x - Estilização via CDN
- **Axios** 1.6 - Cliente HTTP
- **Font Awesome** 6.4 - Ícones

### **Build & Deploy**
- **Vite** 6.4 - Build tool moderno
- **Wrangler** 4.53 - CLI Cloudflare
- **PM2** - Process manager para dev

---

## 📊 Estatísticas

| Métrica | Valor |
|---------|-------|
| **Total de Arquivos TypeScript** | 14 |
| **Total de Arquivos JavaScript** | 2 |
| **Rotas API** | 35+ |
| **Tabelas do Banco** | 8 |
| **Migrations** | 2 |
| **Linhas de Código (src/)** | ~10.000 |
| **Linhas de Código (frontend)** | ~2.000 |
| **Linhas de Documentação** | ~450 |
| **Total Geral** | ~15.000 linhas |

---

## 🚀 Deploy

### **Desenvolvimento Local**
```bash
npm install
npm run db:reset
npm run build
pm2 start ecosystem.config.cjs
```

### **Produção (Cloudflare Pages)**
```bash
npm run build
wrangler pages deploy dist --project-name webapp
```

---

## 🔗 Links Importantes

- **GitHub**: https://github.com/rodrigoathayde2/Timesheet
- **Documentação Completa**: README.md
- **Estrutura**: ESTRUTURA.md (este arquivo)

---

**Desenvolvido com Hono + Cloudflare Pages + D1**  
**Versão**: 2.0.0  
**Data**: 2025-12-08
