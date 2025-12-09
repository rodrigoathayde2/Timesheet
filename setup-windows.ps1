# Sistema de Timesheet - Setup PowerShell
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   Sistema de Timesheet - Setup Windows" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/5] Verificando Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ OK: Node.js encontrado ($nodeVersion)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERRO: Node.js não encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale Node.js de https://nodejs.org/" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

# Instalar dependências
Write-Host "[2/5] Instalando dependências..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha ao instalar dependências" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✅ OK: Dependências instaladas" -ForegroundColor Green
Write-Host ""

# Limpar banco
Write-Host "[3/5] Limpando banco de dados..." -ForegroundColor Yellow
$dbPath = ".wrangler\state\v3\d1"
if (Test-Path $dbPath) {
    Remove-Item -Path $dbPath -Recurse -Force
    Write-Host "✅ OK: Banco limpo" -ForegroundColor Green
} else {
    Write-Host "✅ OK: Nenhum banco anterior encontrado" -ForegroundColor Green
}
Write-Host ""

# Aplicar migrations
Write-Host "[4/5] Aplicando migrations e seed..." -ForegroundColor Yellow
npm run db:migrate:local
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha ao aplicar migrations" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
npm run db:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha ao aplicar seed" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✅ OK: Banco configurado" -ForegroundColor Green
Write-Host ""

# Build
Write-Host "[5/5] Compilando projeto..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ERRO: Falha no build" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host "✅ OK: Projeto compilado" -ForegroundColor Green
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "   INSTALAÇÃO COMPLETA!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Para iniciar o servidor, execute:" -ForegroundColor Yellow
Write-Host "  npm run dev:local" -ForegroundColor White
Write-Host ""
Write-Host "Depois acesse no navegador:" -ForegroundColor Yellow
Write-Host "  http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "Credenciais de teste:" -ForegroundColor Yellow
Write-Host "  Email: joao.oliveira@empresa.com.br" -ForegroundColor White
Write-Host "  Senha: senha123" -ForegroundColor White
Write-Host ""
Read-Host "Pressione Enter para sair"
