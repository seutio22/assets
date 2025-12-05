Write-Host "🚀 Iniciando servidores..." -ForegroundColor Cyan
Write-Host ""

# Iniciar backend
Write-Host "📦 Iniciando Backend (porta 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev" -WindowStyle Normal

# Aguardar um pouco
Start-Sleep -Seconds 3

# Iniciar frontend
Write-Host "🎨 Iniciando Frontend (porta 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Servidores iniciando em janelas separadas!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 URLs:" -ForegroundColor Cyan
Write-Host "   Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "💡 Verifique as janelas do PowerShell para ver os logs" -ForegroundColor Yellow

