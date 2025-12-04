# Script PowerShell para resetar migrations

Write-Host "🔧 Resetando migrations..." -ForegroundColor Cyan
Write-Host ""

# 1. Remover pasta problemática
$duplicateDir = "prisma\migrations\add_implantacao_module"
if (Test-Path $duplicateDir) {
    Write-Host "❌ Removendo pasta duplicada: $duplicateDir" -ForegroundColor Yellow
    Remove-Item -Recurse -Force $duplicateDir
    Write-Host "✅ Pasta removida!" -ForegroundColor Green
} else {
    Write-Host "✅ Nenhuma pasta duplicada encontrada" -ForegroundColor Green
}

Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "   1. npm run prisma:generate" -ForegroundColor White
Write-Host "   2. npx prisma migrate dev --name add_permissions_system" -ForegroundColor White
Write-Host "   3. npm run prisma:seed" -ForegroundColor White
Write-Host ""

