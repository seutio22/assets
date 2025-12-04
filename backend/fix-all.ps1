Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Corrigindo Migrations e Banco" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/5] Removendo pasta problematica..." -ForegroundColor Yellow
if (Test-Path "prisma\migrations\add_implantacao_module") {
    Remove-Item "prisma\migrations\add_implantacao_module" -Recurse -Force
    Write-Host "   Pasta removida!" -ForegroundColor Green
} else {
    Write-Host "   Pasta nao encontrada (ok)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[2/5] Deletando banco de dados..." -ForegroundColor Yellow
if (Test-Path "prisma\dev.db") {
    Remove-Item "prisma\dev.db" -Force
    Write-Host "   Banco deletado!" -ForegroundColor Green
} else {
    Write-Host "   Banco nao encontrado (ok)" -ForegroundColor Gray
}
Write-Host ""

Write-Host "[3/5] Regenerando Prisma Client..." -ForegroundColor Yellow
npm run prisma:generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERRO ao gerar Prisma Client!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

Write-Host "[4/5] Aplicando migrations..." -ForegroundColor Yellow
npx prisma migrate dev
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERRO ao aplicar migrations!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

Write-Host "[5/5] Populando dados iniciais..." -ForegroundColor Yellow
npm run prisma:seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "   ERRO ao popular dados!" -ForegroundColor Red
    Read-Host "Pressione Enter para sair"
    exit 1
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  CONCLUIDO COM SUCESSO!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verificando sistema de permissoes..." -ForegroundColor Cyan
npm run check:permissions
Write-Host ""
Read-Host "Pressione Enter para sair"

