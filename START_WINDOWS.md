# 🚀 Início Rápido - Windows

## 📋 Pré-requisitos

✅ **Node.js v18+**: https://nodejs.org/  
✅ **Git**: https://git-scm.com/download/win

---

## ⚡ Instalação Rápida (3 minutos)

### **Opção 1: Script Automático (Recomendado)**

#### **PowerShell:**
```powershell
# Clone o repositório
git clone https://github.com/rodrigoathayde2/Timesheet.git
cd Timesheet

# Execute o script de setup
.\setup-windows.ps1
```

#### **Command Prompt (CMD):**
```cmd
REM Clone o repositório
git clone https://github.com/rodrigoathayde2/Timesheet.git
cd Timesheet

REM Execute o script de setup
setup-windows.bat
```

---

### **Opção 2: Manual**

```bash
# 1. Clone
git clone https://github.com/rodrigoathayde2/Timesheet.git
cd Timesheet

# 2. Instale dependências
npm install

# 3. Configure banco
npm run db:reset

# 4. Build
npm run build

# 5. Inicie
npm run dev:local
```

---

## 🌐 Acessar Sistema

Abra no navegador: **http://localhost:3000**

---

## 👤 Login de Teste

| Email | Senha |
|-------|-------|
| joao.oliveira@empresa.com.br | senha123 |
| ana.santos@empresa.com.br | senha123 |
| carlos.silva@empresa.com.br | senha123 |

---

## 🔧 Comandos Principais

```bash
npm run dev:local    # Iniciar servidor
npm run build        # Compilar
npm run db:reset     # Resetar banco
npm start            # Build + Dev
```

---

## ❓ Problemas?

Consulte: **INSTALACAO_WINDOWS.md** (guia completo)

---

## 📦 Repositório

https://github.com/rodrigoathayde2/Timesheet

---

**✅ Sistema testado no Windows 10/11**
