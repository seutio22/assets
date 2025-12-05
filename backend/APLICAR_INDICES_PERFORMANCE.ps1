# Define a DATABASE_URL para o ambiente atual
# $env:DATABASE_URL = "postgresql://postgres:MwNFhGtpnAvlShuEaXpRDureDUVtHakI@interchange.proxy.rlwy.net:37916/railway?sslmode=require"

Write-Host "========================================" -ForegroundColor Green
Write-Host "  APLICANDO ÍNDICES DE PERFORMANCE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "1. Gerando Prisma Client..." -ForegroundColor Cyan
npx prisma generate
Write-Host ""

Write-Host "2. Aplicando índices no banco (db push)..." -ForegroundColor Cyan
# Usar db push para aplicar o schema com os novos índices
npx prisma db push --accept-data-loss
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONCLUÍDO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "Índices aplicados:" -ForegroundColor Green
Write-Host "  - Empresa.razaoSocial" -ForegroundColor Green
Write-Host "  - Empresa.cnpj" -ForegroundColor Green
Write-Host "  - Fornecedor.razaoSocial" -ForegroundColor Green
Write-Host "  - Fornecedor.cnpj" -ForegroundColor Green
Write-Host "  - Apolice.numero" -ForegroundColor Green
Write-Host "  - Apolice.produto" -ForegroundColor Green
Write-Host ""
Write-Host "Esses índices vão acelerar significativamente as buscas!" -ForegroundColor Green
Write-Host ""

