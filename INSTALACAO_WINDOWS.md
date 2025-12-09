# 🪟 Instalação e Configuração - Windows

Guia completo para instalar e executar o Sistema de Timesheet no Windows.

---

## ⚙️ Pré-requisitos

Antes de começar, instale as seguintes ferramentas:

### **1. Node.js (v18 ou superior)**
- 📥 Download: https://nodejs.org/
- Escolha a versão **LTS (Long Term Support)**
- Após instalar, verifique:
```cmd
node --version
npm --version
```

### **2. Git para Windows**
- 📥 Download: https://git-scm.com/download/win
- Use as configurações padrão durante a instalação
- Após instalar, verifique:
```cmd
git --version
```

---

## 📦 Instalação

### **Passo 1: Clonar o Repositório**

Abra o **PowerShell** ou **Git Bash** e execute:

```bash
# Navegue até a pasta onde deseja clonar (ex: C:\Projects)
cd C:\Projects

# Clone o repositório
git clone https://github.com/rodrigoathayde2/Timesheet.git

# Entre na pasta
cd Timesheet
```

---

### **Passo 2: Instalar Dependências**

```bash
npm install
```

⏳ **Aguarde**: Este processo pode levar 1-3 minutos dependendo da sua conexão.

---

### **Passo 3: Configurar Banco de Dados Local**

O sistema usa **Cloudflare D1** (SQLite) que funciona perfeitamente no Windows.

```bash
# Limpar banco (se existir) e aplicar migrations + seed
npm run db:reset
```

**Alternativa para Windows (se o comando acima falhar):**
```cmd
npm run db:reset:win
```

✅ **Sucesso**: Você verá mensagens indicando que as migrations foram aplicadas.

---

### **Passo 4: Build do Projeto**

```bash
npm run build
```

⏳ **Aguarde**: ~3-5 segundos. Você verá:
```
✓ built in 1.5s
dist/_worker.js  148.44 kB
```

---

### **Passo 5: Iniciar o Servidor**

#### **Opção 1: Usando Wrangler (Recomendado)**

```bash
npm run dev:local
```

#### **Opção 2: Build + Dev em um comando**

```bash
npm start
```

✅ **Sucesso**: Você verá:
```
Ready on http://127.0.0.1:3000
Ready on http://localhost:3000
```

---

### **Passo 6: Acessar o Sistema**

Abra seu navegador e acesse:

🔗 **http://localhost:3000**

---

## 👤 Login - Credenciais de Teste

Use qualquer um destes usuários para testar:

| Perfil | Email | Senha |
|--------|-------|-------|
| 👔 **Diretor** | carlos.silva@empresa.com.br | senha123 |
| 👨‍💼 **Gestor TI** | ana.santos@empresa.com.br | senha123 |
| 👤 **Colaborador** | joao.oliveira@empresa.com.br | senha123 |

---

## 🔧 Scripts Disponíveis (Windows)

### **Desenvolvimento**
```bash
npm run dev:local          # Inicia servidor local (porta 3000)
npm run build              # Compila o projeto
npm start                  # Build + Dev (tudo em um comando)
```

### **Banco de Dados**
```bash
npm run db:reset           # Limpa e recria banco (Linux/Mac/Win)
npm run db:reset:win       # Limpa e recria banco (somente Windows)
npm run db:clean           # Limpa apenas o banco
npm run db:migrate:local   # Aplica migrations
npm run db:seed            # Insere dados de teste
npm run db:console:local   # Console SQL interativo
```

### **Teste**
```bash
# Após iniciar o servidor, abra no navegador:
http://localhost:3000
```

---

## 🐛 Solução de Problemas

### **Erro: "npm: command not found"**
- ❌ **Problema**: Node.js não está instalado ou não está no PATH
- ✅ **Solução**: Instale o Node.js e reinicie o terminal

### **Erro: "git: command not found"**
- ❌ **Problema**: Git não está instalado ou não está no PATH
- ✅ **Solução**: Instale o Git para Windows e reinicie o terminal

### **Erro: "Cannot find module 'X'"**
- ❌ **Problema**: Dependências não foram instaladas
- ✅ **Solução**: Execute `npm install` novamente

### **Erro: "Port 3000 is already in use"**
- ❌ **Problema**: Outra aplicação está usando a porta 3000
- ✅ **Solução 1**: Feche a aplicação que está usando a porta
- ✅ **Solução 2**: Mate o processo:
  ```cmd
  # PowerShell (como Administrador)
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process
  ```

### **Erro: "EPERM: operation not permitted"**
- ❌ **Problema**: Permissões do Windows bloqueando operações
- ✅ **Solução**: Execute o PowerShell como Administrador

### **Erro ao executar db:reset**
- ❌ **Problema**: Comando Unix `rm -rf` não funciona no Windows
- ✅ **Solução**: Use `npm run db:reset:win` ou `npm run db:clean`

---

## 📁 Estrutura de Pastas (após instalação)

```
Timesheet/
├── node_modules/           ✅ Criado após npm install
├── .wrangler/              ✅ Criado após db:reset
│   └── state/v3/d1/        # Banco SQLite local
├── dist/                   ✅ Criado após build
│   ├── _worker.js          # Worker compilado
│   └── static/             # Assets estáticos
├── src/                    # Código fonte TypeScript
├── public/                 # JavaScript frontend
├── migrations/             # Migrations SQL
├── seed.sql                # Dados de teste
├── package.json            # Configuração npm
└── README.md               # Documentação
```

---

## 🚀 Fluxo Completo de Setup (Windows)

Execute estes comandos em sequência:

```bash
# 1. Clone
git clone https://github.com/rodrigoathayde2/Timesheet.git
cd Timesheet

# 2. Instale dependências
npm install

# 3. Configure banco (escolha um)
npm run db:reset        # Funciona na maioria dos casos
npm run db:reset:win    # Se o comando acima falhar

# 4. Build
npm run build

# 5. Inicie o servidor
npm run dev:local

# 6. Abra no navegador
# http://localhost:3000
```

---

## 🎯 Testando Funcionalidades

### **1. Login e Dashboard**
1. Acesse http://localhost:3000
2. Login: `joao.oliveira@empresa.com.br` / `senha123`
3. Veja dashboard com métricas reais

### **2. Lançamento de Horas**
1. Clique em "Lançar Horas"
2. Selecione data, projeto, atividade
3. Digite horas (ex: 8)
4. Clique "Adicionar"
5. Veja total em tempo real

### **3. Relatórios**
1. Clique em "Meus Relatórios"
2. Selecione período (ex: último mês)
3. Clique "Buscar"
4. Veja relatório detalhado
5. Clique "Exportar CSV"

### **4. Aprovações (Gestor)**
1. Logout
2. Login: `ana.santos@empresa.com.br` / `senha123`
3. Clique "Aprovar Timesheets"
4. Veja pendências
5. Aprove ou reprove

---

## 📊 Comandos Úteis

### **Ver logs do Wrangler**
Os logs aparecem automaticamente no terminal onde você executou `npm run dev:local`

### **Resetar tudo**
```bash
# Limpar node_modules e reinstalar
rmdir /s /q node_modules
npm install

# Limpar banco e recriar
npm run db:reset:win
npm run build
```

### **Atualizar código do GitHub**
```bash
git pull origin main
npm install
npm run db:reset
npm run build
```

---

## 🔗 Links Úteis

- 📦 **Repositório**: https://github.com/rodrigoathayde2/Timesheet
- 📖 **Documentação Completa**: README.md
- 📁 **Estrutura do Projeto**: ESTRUTURA.md
- 🪟 **Este Guia**: INSTALACAO_WINDOWS.md

---

## ✅ Checklist de Instalação

Marque conforme avança:

- [ ] Node.js instalado (v18+)
- [ ] Git instalado
- [ ] Repositório clonado
- [ ] `npm install` executado com sucesso
- [ ] `npm run db:reset` executado sem erros
- [ ] `npm run build` executado com sucesso
- [ ] `npm run dev:local` iniciou o servidor
- [ ] Consegui acessar http://localhost:3000
- [ ] Consegui fazer login
- [ ] Dashboard carrega corretamente

---

## 💡 Dicas para Windows

1. **Use PowerShell ou Git Bash**: CMD pode ter problemas com alguns comandos
2. **Execute como Administrador**: Se tiver problemas de permissão
3. **Antivírus**: Adicione a pasta do projeto às exceções se houver lentidão
4. **Firewall**: Permita conexões na porta 3000
5. **Path longo**: Se der erro de path muito longo, mova para `C:\Timesheet`

---

**Desenvolvido com Hono + Cloudflare Pages + D1**  
**Versão**: 2.0.0  
**Data**: 2025-12-08

✅ **Sistema testado e funcionando perfeitamente no Windows 10/11**
