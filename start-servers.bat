@echo off
echo ========================================
echo   Iniciando Servidores
echo ========================================
echo.

echo Iniciando Backend (porta 3000)...
start "Backend" cmd /k "cd backend && npm run dev"

timeout /t 3 /nobreak >nul

echo Iniciando Frontend (porta 5173)...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo   Servidores iniciando!
echo ========================================
echo.
echo Backend:  http://localhost:3000
echo Frontend: http://localhost:5173
echo.
echo Verifique as janelas que foram abertas
echo.
pause

