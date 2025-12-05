# Script para aplicar índices no banco de dados PostgreSQL
# Os índices já estão definidos no schema.prisma, este script apenas verifica e aplica via db push

Write-Host "========================================" -ForegroundColor Green
Write-Host "  APLICANDO ÍNDICES NO BANCO DE DADOS" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Verificar se DATABASE_URL está configurada
if (-not $env:DATABASE_URL) {
    Write-Host "ERRO: DATABASE_URL não está configurada!" -ForegroundColor Red
    Write-Host "Configure a variável de ambiente DATABASE_URL antes de executar este script." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo:" -ForegroundColor Cyan
    Write-Host '  $env:DATABASE_URL = "postgresql://user:password@host:port/database?sslmode=require"' -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

Write-Host "DATABASE_URL configurada: $($env:DATABASE_URL.Substring(0, [Math]::Min(50, $env:DATABASE_URL.Length)))..." -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao gerar Prisma Client!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "2. Aplicando schema (incluindo índices) via db push..." -ForegroundColor Cyan
Write-Host "   Nota: db push aplica todos os índices definidos no schema.prisma" -ForegroundColor Gray
npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO ao aplicar schema!" -ForegroundColor Red
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  ÍNDICES APLICADOS COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Os seguintes índices foram aplicados:" -ForegroundColor Cyan
Write-Host "  - @@index([tenantId]) em todas as tabelas principais" -ForegroundColor Gray
Write-Host "  - @@index([clienteId]) em Apolice" -ForegroundColor Gray
Write-Host "  - @@index([fornecedorId]) em Apolice" -ForegroundColor Gray
Write-Host "  - @@index([status]) em Apolice" -ForegroundColor Gray
Write-Host ""
Write-Host "As queries devem estar mais rápidas agora!" -ForegroundColor Green
Write-Host ""

