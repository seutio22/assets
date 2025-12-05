# Script de Deploy Automatizado - Atlas Sistema Gestão
# Execute este script na raiz do projeto

Write-Host "🚀 Deploy Automatizado - Atlas Sistema Gestão" -ForegroundColor Cyan
Write-Host ""

# Verificar se Vercel CLI está instalado
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue

if (-not $vercelInstalled) {
    Write-Host "📦 Instalando Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
    Write-Host "✅ Vercel CLI instalado!" -ForegroundColor Green
    Write-Host ""
}

# Verificar se está logado
Write-Host "🔐 Verificando login no Vercel..." -ForegroundColor Yellow
Write-Host "Se não estiver logado, você será redirecionado para fazer login no navegador" -ForegroundColor Gray
Write-Host ""

# Deploy do Backend
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOY DO BACKEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location backend

Write-Host "📝 Configurações do Backend:" -ForegroundColor Yellow
Write-Host "  - Root Directory: backend" -ForegroundColor Gray
Write-Host "  - Build Command: npm run build" -ForegroundColor Gray
Write-Host "  - Output Directory: dist" -ForegroundColor Gray
Write-Host ""

$deployBackend = Read-Host "Deseja fazer deploy do backend agora? (S/N)"

if ($deployBackend -eq "S" -or $deployBackend -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando deploy do backend..." -ForegroundColor Green
    Write-Host ""
    
    vercel --prod
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Configure as variáveis de ambiente no Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "  - DATABASE_URL" -ForegroundColor Gray
    Write-Host "  - JWT_SECRET (gere com: openssl rand -base64 32)" -ForegroundColor Gray
    Write-Host "  - JWT_EXPIRES_IN=7d" -ForegroundColor Gray
    Write-Host "  - NODE_ENV=production" -ForegroundColor Gray
    Write-Host "  - CORS_ORIGIN (URL do frontend - configure depois)" -ForegroundColor Gray
    Write-Host "  - PORT=3000" -ForegroundColor Gray
    Write-Host ""
}

Set-Location ..

# Deploy do Frontend
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  DEPLOY DO FRONTEND" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Set-Location frontend

Write-Host "📝 Configurações do Frontend:" -ForegroundColor Yellow
Write-Host "  - Root Directory: frontend" -ForegroundColor Gray
Write-Host "  - Framework: Vite" -ForegroundColor Gray
Write-Host "  - Build Command: npm run build" -ForegroundColor Gray
Write-Host "  - Output Directory: dist" -ForegroundColor Gray
Write-Host ""

$deployFrontend = Read-Host "Deseja fazer deploy do frontend agora? (S/N)"

if ($deployFrontend -eq "S" -or $deployFrontend -eq "s") {
    Write-Host ""
    Write-Host "🚀 Iniciando deploy do frontend..." -ForegroundColor Green
    Write-Host ""
    
    $backendUrl = Read-Host "Digite a URL do backend (ex: https://atlas-backend.vercel.app)"
    
    vercel --prod
    
    Write-Host ""
    Write-Host "⚠️  IMPORTANTE: Configure a variável de ambiente no Vercel Dashboard:" -ForegroundColor Yellow
    Write-Host "  - VITE_API_URL=$backendUrl/api/v1" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Depois, atualize CORS_ORIGIN no backend com a URL do frontend!" -ForegroundColor Yellow
    Write-Host ""
}

Set-Location ..

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  ✅ Deploy concluído!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "📚 Documentação completa em:" -ForegroundColor Cyan
Write-Host "  - DEPLOY.md" -ForegroundColor Gray
Write-Host "  - DEPLOY_AUTOMATICO.md" -ForegroundColor Gray
Write-Host "  - CHECKLIST_DEPLOY.md" -ForegroundColor Gray
Write-Host ""


