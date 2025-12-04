Write-Host "🔍 Procurando processos que podem estar usando o banco...`n" -ForegroundColor Cyan

# Procurar processos Node.js
$nodeProcesses = Get-Process -Name node -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "⚠️  Processos Node.js encontrados:" -ForegroundColor Yellow
    $nodeProcesses | ForEach-Object {
        Write-Host "   PID: $($_.Id) - $($_.Path)" -ForegroundColor White
    }
    Write-Host "`n💡 Para fechar: Stop-Process -Id <PID> -Force" -ForegroundColor Cyan
} else {
    Write-Host "✅ Nenhum processo Node.js encontrado" -ForegroundColor Green
}

# Procurar processos Prisma
$prismaProcesses = Get-Process | Where-Object { $_.ProcessName -like "*prisma*" -or $_.MainWindowTitle -like "*prisma*" }
if ($prismaProcesses) {
    Write-Host "`n⚠️  Processos Prisma encontrados:" -ForegroundColor Yellow
    $prismaProcesses | ForEach-Object {
        Write-Host "   PID: $($_.Id) - $($_.ProcessName)" -ForegroundColor White
    }
    Write-Host "`n💡 Para fechar: Stop-Process -Id <PID> -Force" -ForegroundColor Cyan
} else {
    Write-Host "`n✅ Nenhum processo Prisma encontrado" -ForegroundColor Green
}

# Verificar se o arquivo está realmente bloqueado
$dbPath = "prisma\dev.db"
if (Test-Path $dbPath) {
    try {
        $file = [System.IO.File]::Open($dbPath, 'Open', 'ReadWrite', 'None')
        $file.Close()
        Write-Host "`n✅ Banco NÃO está bloqueado agora!" -ForegroundColor Green
    } catch {
        Write-Host "`n❌ Banco AINDA está bloqueado!" -ForegroundColor Red
        Write-Host "   Erro: $($_.Exception.Message)" -ForegroundColor Yellow
        Write-Host "`n💡 Soluções:" -ForegroundColor Cyan
        Write-Host "   1. Feche Prisma Studio" -ForegroundColor White
        Write-Host "   2. Pare o servidor backend (Ctrl+C)" -ForegroundColor White
        Write-Host "   3. Feche todos os terminais que possam estar usando o banco" -ForegroundColor White
        Write-Host "   4. Reinicie o PowerShell" -ForegroundColor White
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "Para fechar TODOS os processos Node.js:" -ForegroundColor Yellow
Write-Host "Stop-Process -Name node -Force" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan

