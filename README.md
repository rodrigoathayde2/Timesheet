# 🕐 Sistema de Timesheet

Sistema completo de controle de horas trabalhadas com fluxo de aprovação hierárquico (semanal e mensal), dashboards analíticos e gestão de recursos.

## 🌐 URLs

- **Aplicação**: https://3000-ikqpi6t4kj9pc9qlvfuky-c81df28e.sandbox.novita.ai
- **API Base**: https://3000-ikqpi6t4kj9pc9qlvfuky-c81df28e.sandbox.novita.ai/api
- **Health Check**: https://3000-ikqpi6t4kj9pc9qlvfuky-c81df28e.sandbox.novita.ai/health
- **GitHub**: (Aguardando push)

## 🎯 Visão Geral do Projeto

Sistema web full-stack desenvolvido para controle profissional de horas trabalhadas, com:

### ✅ Funcionalidades Implementadas (Fase 1 - MVP)

#### 🔐 Autenticação e Segurança
- ✅ Login com JWT (JSON Web Token)
- ✅ Sessões seguras com tempo de expiração (8 horas)
- ✅ Middleware de autenticação
- ✅ Controle de acesso baseado em roles (RBAC)
- ✅ Hash de senhas com bcrypt (12 rounds)
- ✅ Proteção contra acessos não autorizados

#### 👥 Gestão de Usuários
- ✅ CRUD completo de usuários
- ✅ Três perfis: COLABORADOR, GESTOR, DIRETOR
- ✅ Validação de CPF e email
- ✅ Hierarquia gestor-subordinado
- ✅ Soft delete (não deleta fisicamente)
- ✅ Filtros avançados (nome, CPF, role, status)
- ✅ Paginação (20 registros/página)
- ✅ Auditoria completa de alterações

#### 📊 Gestão de Projetos
- ✅ CRUD completo de projetos
- ✅ Vinculação com gestor responsável
- ✅ Status: PLANEJAMENTO, ATIVO, PAUSADO, CONCLUÍDO, CANCELADO
- ✅ Orçamento de horas e taxa horária
- ✅ Centro de custo e cliente
- ✅ Datas de início e fim
- ✅ Soft delete com validação

#### 🎨 Interface e Dashboards
- ✅ Dashboard responsivo para 3 perfis
- ✅ Cards com métricas principais:
  - Horas da semana
  - Horas do mês
  - Pendências
  - Resumo de status
- ✅ Interface moderna com TailwindCSS
- ✅ Ícones com Font Awesome
- ✅ Layout limpo e intuitivo
- ✅ Feedback visual em todas as ações

#### 📝 Auditoria e Logs
- ✅ Sistema completo de auditoria
- ✅ Registro de todas alterações críticas
- ✅ Justificativas obrigatórias para edições
- ✅ IP e user agent capturados
- ✅ Histórico completo versionado

### 🚧 Funcionalidades Planejadas (Próximas Fases)

#### Fase 2 - Timesheets e Aprovações
- ⏳ Lançamento de horas (interface de grade semanal)
- ⏳ Validações: 0.25h mínimo, 24h máximo/dia
- ⏳ Estados: RASCUNHO → ENVIADO → APROVADO/REPROVADO
- ⏳ Aprovação semanal (Gestor)
- ⏳ Aprovação mensal (Diretor)
- ⏳ Templates de semana
- ⏳ Copiar semana anterior
- ⏳ Notificações de aprovação/reprovação

#### Fase 3 - Relatórios e Analytics
- ⏳ Relatório individual
- ⏳ Relatório de equipe
- ⏳ Relatório de projeto
- ⏳ Relatório de centro de custo
- ⏳ Relatório de auditoria
- ⏳ Exportação XLSX/CSV/PDF
- ⏳ Dashboard gerencial avançado
- ⏳ Dashboard executivo

#### Fase 4 - Integrações
- ⏳ Envio de emails (SendGrid/Resend)
- ⏳ Notificações in-app
- ⏳ Integração com SSO (OAuth 2.0)
- ⏳ API pública para integrações
- ⏳ Webhooks

## 🗄️ Arquitetura de Dados

### Banco de Dados: Cloudflare D1 (SQLite)

#### Principais Tabelas:

1. **users** - Usuários do sistema
   - CPF, email, matrícula (únicos)
   - Role (COLABORADOR, GESTOR, DIRETOR)
   - Hierarquia (manager_id)
   - Carga horária semanal

2. **projects** - Projetos
   - Nome e código únicos
   - Gestor responsável
   - Status, orçamento, taxa horária
   - Datas de início/fim

3. **activities** - Atividades dos projetos
   - Vinculadas a projetos
   - Tipos: DESENVOLVIMENTO, REUNIÃO, TESTES, etc.

4. **timesheet_entries** - Lançamentos de horas
   - Horas por data/projeto/atividade
   - Estados de aprovação
   - Histórico completo

5. **audit_logs** - Auditoria
   - Todas alterações críticas
   - Old/new values em JSON
   - Justificativas

6. **user_project_assignments** - Vínculos
   - Usuário ↔ Projeto
   - Período de vigência
   - Atividades permitidas

### Modelo de Dados Completo

```
users (id, full_name, email, cpf, matricula, role, manager_id, ...)
  └─ manages → users (subordinados)
  └─ assigned_to → projects
  └─ creates → timesheet_entries

projects (id, name, code, manager_id, status, ...)
  └─ has → activities
  └─ assigned_to → users
  └─ has → timesheet_entries

activities (id, project_id, name, type, ...)
  └─ belongs_to → projects
  └─ used_in → timesheet_entries

timesheet_entries (id, user_id, project_id, activity_id, hours, status, ...)
  └─ belongs_to → users
  └─ belongs_to → projects
  └─ belongs_to → activities
  └─ approved_by → users (manager/director)

audit_logs (id, user_id, entity_type, entity_id, action, ...)
  └─ created_by → users
```

## 👤 Usuários de Teste

### Diretor
- **Email**: carlos.silva@empresa.com.br
- **Senha**: senha123
- **Permissões**: Acesso total ao sistema

### Gestores
- **Email**: ana.santos@empresa.com.br (TI)
- **Email**: roberto.lima@empresa.com.br (RH)
- **Email**: mariana.costa@empresa.com.br (Financeiro)
- **Senha**: senha123 (todos)
- **Permissões**: Gestão de equipe e aprovações semanais

### Colaboradores
- **Email**: joao.oliveira@empresa.com.br (TI - subordinado de Ana)
- **Email**: maria.souza@empresa.com.br (TI - subordinada de Ana)
- **Email**: lucas.ferreira@empresa.com.br (RH - subordinado de Roberto)
- **Senha**: senha123 (todos)
- **Permissões**: Lançamento de horas próprias

## 🚀 Tecnologias Utilizadas

### Backend
- **Hono** - Framework web lightweight para Edge
- **Cloudflare Pages** - Plataforma de deploy
- **Cloudflare D1** - Banco de dados SQLite distribuído
- **TypeScript** - Tipagem estática
- **bcryptjs** - Hash de senhas
- **jsonwebtoken** - Autenticação JWT
- **uuid** - Geração de IDs únicos

### Frontend
- **TailwindCSS** - Framework CSS via CDN
- **Font Awesome** - Ícones via CDN
- **Axios** - Cliente HTTP
- **JavaScript Vanilla** - SPA simples e performática

### DevOps
- **Vite** - Build tool
- **Wrangler** - CLI do Cloudflare
- **PM2** - Process manager (desenvolvimento)
- **Git** - Controle de versão

## 📦 Estrutura do Projeto

```
webapp/
├── src/
│   ├── index.tsx              # Entry point principal
│   ├── types/
│   │   └── index.ts           # TypeScript types
│   ├── utils/
│   │   ├── auth.ts            # Autenticação JWT/bcrypt
│   │   ├── date.ts            # Manipulação de datas
│   │   ├── validation.ts      # Validações
│   │   ├── audit.ts           # Auditoria
│   │   └── response.ts        # Respostas padronizadas
│   ├── middleware/
│   │   └── auth.ts            # Middleware de autenticação
│   └── routes/
│       ├── auth.ts            # Login e /me
│       ├── users.ts           # CRUD usuários
│       └── projects.ts        # CRUD projetos
├── public/
│   └── static/
│       └── app.js             # Frontend SPA
├── migrations/
│   └── 0001_initial_schema.sql # Schema do banco
├── seed.sql                   # Dados de teste
├── ecosystem.config.cjs       # Configuração PM2
├── wrangler.jsonc            # Configuração Cloudflare
├── package.json              # Dependências
└── README.md                 # Esta documentação
```

## 🔧 Instalação e Desenvolvimento

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Conta Cloudflare (para deploy)

### Setup Local

```bash
# Clone o repositório
git clone <repo-url>
cd webapp

# Instale dependências
npm install

# Configure banco D1 local
npm run db:reset

# Build do projeto
npm run build

# Inicie desenvolvimento
npm run dev:sandbox

# Ou com PM2
pm2 start ecosystem.config.cjs
```

### Scripts Disponíveis

```bash
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler Pages dev
npm run build            # Build para produção
npm run preview          # Preview local

# Banco de Dados
npm run db:migrate:local # Aplica migrations
npm run db:seed          # Popula dados teste
npm run db:reset         # Reset completo
npm run db:console:local # Console SQL

# Utilitários
npm run clean-port       # Limpa porta 3000
npm run test             # Testa API
```

## 🌍 Deploy para Produção

### Deploy no Cloudflare Pages

```bash
# 1. Autentique no Cloudflare
wrangler login

# 2. Crie banco de dados D1
wrangler d1 create webapp-production

# 3. Atualize database_id no wrangler.jsonc

# 4. Aplique migrations
npm run db:migrate:prod

# 5. Deploy
npm run deploy:prod
```

### Variáveis de Ambiente

Produção requer:
- `JWT_SECRET` - Chave secreta para JWT

Configure com:
```bash
wrangler pages secret put JWT_SECRET --project-name webapp
```

## 📊 Endpoints da API

### Autenticação

**POST /api/auth/login**
```json
{
  "email": "usuario@empresa.com.br",
  "password": "senha123"
}
```

**GET /api/auth/me** (requer autenticação)

### Usuários (apenas DIRETOR)

- **GET** `/api/users` - Lista usuários
- **GET** `/api/users/:id` - Busca usuário
- **POST** `/api/users` - Cria usuário
- **PUT** `/api/users/:id` - Atualiza usuário
- **DELETE** `/api/users/:id` - Remove usuário
- **GET** `/api/users/subordinates/:managerId` - Lista subordinados

### Projetos (GESTOR/DIRETOR)

- **GET** `/api/projects` - Lista projetos
- **GET** `/api/projects/:id` - Busca projeto
- **POST** `/api/projects` - Cria projeto (Gestor/Diretor)
- **PUT** `/api/projects/:id` - Atualiza projeto (Gestor/Diretor)
- **DELETE** `/api/projects/:id` - Remove projeto (Diretor)

## 🔒 Segurança

### Implementado
- ✅ Autenticação JWT com expiração
- ✅ Hash de senhas bcrypt (12 rounds)
- ✅ Validação de CPF/email
- ✅ CORS configurado
- ✅ Soft delete (não deleta fisicamente)
- ✅ Auditoria de todas ações críticas
- ✅ Middleware de autorização por role

### Recomendações para Produção
- [ ] Rate limiting (5 tentativas/15min)
- [ ] HTTPS obrigatório
- [ ] CSP headers
- [ ] Renovação de tokens (refresh token)
- [ ] Bloqueio de conta após múltiplas tentativas
- [ ] 2FA (Two-Factor Authentication)
- [ ] Logs centralizados

## 🎯 Próximos Passos

1. **Módulo de Lançamento de Horas**
   - Interface de grade semanal
   - Validações de horas
   - Copiar semana anterior
   - Templates

2. **Fluxo de Aprovações**
   - Aprovação semanal (Gestor)
   - Aprovação mensal (Diretor)
   - Notificações
   - Histórico de aprovações

3. **Relatórios**
   - Relatórios individuais
   - Relatórios gerenciais
   - Exportação XLSX/PDF
   - Dashboards analíticos

4. **Integrações**
   - Envio de emails
   - SSO (Single Sign-On)
   - API pública
   - Webhooks

## 📄 Licença

Projeto desenvolvido como MVP de Sistema de Timesheet completo.

## 👨‍💻 Desenvolvimento

Sistema desenvolvido com foco em:
- **Performance**: Edge computing com Cloudflare
- **Escalabilidade**: Arquitetura stateless
- **Segurança**: RBAC e auditoria completa
- **Manutenibilidade**: Código limpo e tipado
- **User Experience**: Interface moderna e intuitiva

---

**Status**: ✅ MVP Fase 1 Completo e Funcional  
**Versão**: 1.0.0  
**Última Atualização**: 2025-12-08
