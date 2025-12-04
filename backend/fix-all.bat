@echo off
echo ========================================
echo   Corrigindo Migrations e Banco
echo ========================================
echo.

echo [1/5] Removendo pasta problematica...
if exist "prisma\migrations\add_implantacao_module" (
    rmdir /s /q "prisma\migrations\add_implantacao_module"
    echo    Pasta removida!
) else (
    echo    Pasta nao encontrada (ok)
)
echo.

echo [2/5] Deletando banco de dados...
if exist "prisma\dev.db" (
    del /q "prisma\dev.db"
    echo    Banco deletado!
) else (
    echo    Banco nao encontrado (ok)
)
echo.

echo [3/5] Regenerando Prisma Client...
call npm run prisma:generate
if %errorlevel% neq 0 (
    echo    ERRO ao gerar Prisma Client!
    pause
    exit /b 1
)
echo.

echo [4/5] Aplicando migrations...
call npx prisma migrate dev
if %errorlevel% neq 0 (
    echo    ERRO ao aplicar migrations!
    pause
    exit /b 1
)
echo.

echo [5/5] Populando dados iniciais...
call npm run prisma:seed
if %errorlevel% neq 0 (
    echo    ERRO ao popular dados!
    pause
    exit /b 1
)
echo.

echo ========================================
echo   CONCLUIDO COM SUCESSO!
echo ========================================
echo.
echo Verificando sistema de permissoes...
call npm run check:permissions
echo.
pause

