@echo off
echo ================================================
echo    Sistema de Timesheet - Setup Windows
echo ================================================
echo.

REM Verificar Node.js
echo [1/5] Verificando Node.js...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: Node.js nao encontrado!
    echo Por favor, instale Node.js de https://nodejs.org/
    pause
    exit /b 1
)
echo OK: Node.js encontrado
echo.

REM Instalar dependencias
echo [2/5] Instalando dependencias...
call npm install
if %errorlevel% neq 0 (
    echo ERRO: Falha ao instalar dependencias
    pause
    exit /b 1
)
echo OK: Dependencias instaladas
echo.

REM Limpar banco
echo [3/5] Limpando banco de dados...
if exist .wrangler\state\v3\d1 (
    rmdir /s /q .wrangler\state\v3\d1
    echo OK: Banco limpo
) else (
    echo OK: Nenhum banco anterior encontrado
)
echo.

REM Aplicar migrations
echo [4/5] Aplicando migrations e seed...
call npm run db:migrate:local
if %errorlevel% neq 0 (
    echo ERRO: Falha ao aplicar migrations
    pause
    exit /b 1
)
call npm run db:seed
if %errorlevel% neq 0 (
    echo ERRO: Falha ao aplicar seed
    pause
    exit /b 1
)
echo OK: Banco configurado
echo.

REM Build
echo [5/5] Compilando projeto...
call npm run build
if %errorlevel% neq 0 (
    echo ERRO: Falha no build
    pause
    exit /b 1
)
echo OK: Projeto compilado
echo.

echo ================================================
echo    INSTALACAO COMPLETA!
echo ================================================
echo.
echo Para iniciar o servidor, execute:
echo   npm run dev:local
echo.
echo Depois acesse no navegador:
echo   http://localhost:3000
echo.
echo Credenciais de teste:
echo   Email: joao.oliveira@empresa.com.br
echo   Senha: senha123
echo.
pause
