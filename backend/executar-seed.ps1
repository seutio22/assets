# Script para executar seed no banco Neon
# Execute: .\executar-seed.ps1

Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  EXECUTAR SEED NO BANCO NEON" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

# Solicitar DATABASE_URL
$databaseUrl = Read-Host "Cole a DATABASE_URL do Neon aqui"

if ([string]::IsNullOrWhiteSpace($databaseUrl)) {
    Write-Host "❌ DATABASE_URL não fornecida!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🔄 Configurando variável de ambiente..." -ForegroundColor Yellow
$env:DATABASE_URL = $databaseUrl

Write-Host "🔄 Gerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate

Write-Host "🔄 Executando seed..." -ForegroundColor Yellow
npm run prisma:seed

Write-Host ""
Write-Host "✅ Seed executado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Credenciais de acesso:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Email:    admin@atlas.com" -ForegroundColor White
Write-Host "Senha:    admin123" -ForegroundColor White
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

