import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { authRoutes } from './routes/auth.routes';
import { grupoEconomicoRoutes } from './routes/grupo-economico.routes';
import { empresaRoutes } from './routes/empresa.routes';
import { contatoRoutes } from './routes/contato.routes';
import { enderecoRoutes } from './routes/endereco.routes';
import { fornecedorRoutes } from './routes/fornecedor.routes';
import { enderecoFornecedorRoutes } from './routes/endereco-fornecedor.routes';
import { contatoFornecedorRoutes } from './routes/contato-fornecedor.routes';
import { apoliceRoutes } from './routes/apolice.routes';
import { subEstipulanteRoutes } from './routes/sub-estipulante.routes';
import { planoRoutes } from './routes/plano.routes';
import { relacionamentoRoutes } from './routes/relacionamento.routes';
import { reembolsoPlanoRoutes } from './routes/reembolso-plano.routes';
import { coparticipacaoPlanoRoutes } from './routes/coparticipacao-plano.routes';
import { elegibilidadeRoutes } from './routes/elegibilidade.routes';
import { enderecoApoliceRoutes } from './routes/endereco-apolice.routes';
import { contatoApoliceRoutes } from './routes/contato-apolice.routes';
import { enderecoSubEstipulanteRoutes } from './routes/endereco-sub-estipulante.routes';
import { contatoSubEstipulanteRoutes } from './routes/contato-sub-estipulante.routes';
import { comissionamentoApoliceRoutes } from './routes/comissionamento-apolice.routes';
import { feeApoliceRoutes } from './routes/fee-apolice.routes';
import { reajusteRoutes } from './routes/reajuste.routes';
import { coberturaRoutes } from './routes/cobertura.routes';
import { coberturaItemRoutes } from './routes/cobertura-item.routes';
import { usuarioRoutes } from './routes/usuario.routes';
import { moduloRoutes } from './routes/modulo.routes';
import { configuracaoCampoRoutes } from './routes/configuracao-campo.routes';
import { dadoDinamicoRoutes } from './routes/dado-dinamico.routes';
import { documentoApoliceRoutes } from './routes/documento-apolice.routes';
import { servicoApoliceRoutes } from './routes/servico-apolice.routes';
import { agrupamentoFaturamentoRoutes } from './routes/agrupamento-faturamento.routes';
import { chamadoImplantacaoRoutes } from './routes/chamado-implantacao.routes';
import { implantacaoRoutes } from './routes/implantacao.routes';
import { cronogramaItemRoutes } from './routes/cronograma-item.routes';
import { solicitacaoRoutes } from './routes/solicitacao.routes';
import { placementRoutes } from './routes/placement.routes';
import { usuarioClienteRoutes } from './routes/usuario-cliente.routes';
import { portalAuthRoutes } from './routes/portal-auth.routes';
import { portalAtendimentoRoutes } from './routes/portal-atendimento.routes';
import { permissionsRoutes } from './routes/permissions.routes';
import { dashboardRoutes } from './routes/dashboard.routes';
import { errorHandler } from './middlewares/errorHandler';
import { rateLimiter } from './middlewares/rateLimiter';
import { config } from './config/env';

const app = express();
const PORT = config.server.port;

// Configurar trust proxy para Railway (necessário para rate limiting funcionar)
// Deve ser configurado ANTES de qualquer middleware
app.set('trust proxy', 1); // Confiar no primeiro proxy (Railway)

// Middlewares - CORS configurado para aceitar TUDO
// Nota: No Vercel, o OPTIONS é tratado no handler api/index.ts antes de chegar aqui
app.use(cors({
  origin: function (origin, callback) {
    // Aceitar qualquer origem
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  credentials: false
}));

// Middleware adicional para garantir CORS em todas as respostas
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
  } else {
    res.header('Access-Control-Allow-Origin', '*');
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  
  // Responder imediatamente para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Helmet configurado para não bloquear CORS
// Helmet desabilitado temporariamente para garantir CORS funciona
// app.use(helmet());

// Compressão HTTP - Reduz drasticamente o tamanho das respostas (60-80% menor)
// Deve ser configurado ANTES do express.json para comprimir todas as respostas
app.use(compression({
  filter: (req, res) => {
    // Comprimir todas as respostas JSON e texto
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Nível de compressão (0-9, 6 é um bom equilíbrio)
  threshold: 1024, // Comprimir apenas respostas maiores que 1KB
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/', rateLimiter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Health check com teste de banco
app.get('/health/db', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - start;
    await prisma.$disconnect();
    res.json({ 
      status: 'ok', 
      database: 'connected',
      responseTime: `${duration}ms`,
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// Endpoint temporário para executar seed (REMOVER EM PRODUÇÃO)
app.post('/api/v1/seed', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const bcrypt = await import('bcryptjs');
    const prisma = new PrismaClient();
    
    // Executar seed manualmente
    const tenant = await prisma.tenant.upsert({
      where: { id: '00000000-0000-0000-0000-000000000001' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'MDS Brasil',
        domain: 'mdsbrasil'
      }
    });

    const hashedPassword = await bcrypt.default.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: {
        tenantId_email: {
          tenantId: tenant.id,
          email: 'admin@atlas.com'
        }
      },
      update: {
        password: hashedPassword,
        role: 'ADMIN',
        active: true
      },
      create: {
        tenantId: tenant.id,
        email: 'admin@atlas.com',
        password: hashedPassword,
        name: 'Administrador',
        role: 'ADMIN',
        active: true
      }
    });

    await prisma.$disconnect();
    res.json({ success: true, message: 'Usuário admin criado com sucesso!', email: 'admin@atlas.com', password: 'admin123' });
  } catch (error: any) {
    console.error('Erro ao executar seed:', error);
    res.status(500).json({ error: 'Erro ao executar seed', details: error.message });
  }
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/grupos-economicos', grupoEconomicoRoutes);
app.use('/api/v1/empresas', empresaRoutes);
app.use('/api/v1/contatos', contatoRoutes);
app.use('/api/v1/enderecos', enderecoRoutes);
app.use('/api/v1/fornecedores', fornecedorRoutes);
app.use('/api/v1/enderecos-fornecedores', enderecoFornecedorRoutes);
app.use('/api/v1/contatos-fornecedores', contatoFornecedorRoutes);
app.use('/api/v1/apolices', apoliceRoutes);
app.use('/api/v1/sub-estipulantes', subEstipulanteRoutes);
app.use('/api/v1/planos', planoRoutes);
app.use('/api/v1/relacionamentos', relacionamentoRoutes);
app.use('/api/v1/reembolsos-plano', reembolsoPlanoRoutes);
app.use('/api/v1/coparticipacoes-plano', coparticipacaoPlanoRoutes);
app.use('/api/v1/elegibilidades', elegibilidadeRoutes);
app.use('/api/v1/enderecos-apolice', enderecoApoliceRoutes);
app.use('/api/v1/contatos-apolice', contatoApoliceRoutes);
app.use('/api/v1/enderecos-sub-estipulante', enderecoSubEstipulanteRoutes);
app.use('/api/v1/contatos-sub-estipulante', contatoSubEstipulanteRoutes);
app.use('/api/v1/comissionamentos-apolice', comissionamentoApoliceRoutes);
app.use('/api/v1/fees-apolice', feeApoliceRoutes);
app.use('/api/v1/reajustes', reajusteRoutes);
app.use('/api/v1/coberturas', coberturaRoutes);
app.use('/api/v1/cobertura-items', coberturaItemRoutes);
app.use('/api/v1/usuarios', usuarioRoutes);
app.use('/api/v1/modulos', moduloRoutes);
app.use('/api/v1/configuracoes-campos', configuracaoCampoRoutes);
app.use('/api/v1/dados-dinamicos', dadoDinamicoRoutes);
app.use('/api/v1/documentos-apolice', documentoApoliceRoutes);
app.use('/api/v1/servicos-apolice', servicoApoliceRoutes);
app.use('/api/v1/agrupamentos-faturamento', agrupamentoFaturamentoRoutes);
app.use('/api/v1/chamados-implantacao', chamadoImplantacaoRoutes);
app.use('/api/v1/implantacoes', implantacaoRoutes);
app.use('/api/v1/cronograma-itens', cronogramaItemRoutes);
app.use('/api/v1/solicitacoes', solicitacaoRoutes);
app.use('/api/v1/placements', placementRoutes);
app.use('/api/v1/usuarios-cliente', usuarioClienteRoutes);
app.use('/api/v1/portal/auth', portalAuthRoutes);
app.use('/api/v1/portal', portalAtendimentoRoutes);
app.use('/api/v1/permissions', permissionsRoutes);

// Error handler
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Exportar para Vercel serverless
export default app;

// Também exportar como CommonJS para compatibilidade
if (typeof module !== 'undefined' && module.exports) {
  module.exports = app;
}

// Tratamento de erros não capturados para evitar crash
process.on('uncaughtException', (error) => {
  console.error('⚠️  Uncaught Exception:', error);
  // Não finalizar o processo imediatamente
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection at:', promise, 'reason:', reason);
  // Não finalizar o processo imediatamente
});

// Iniciar servidor (Railway ou desenvolvimento local)
// No Railway, sempre iniciar o servidor
// No Vercel, não iniciar (usa serverless functions)
if (!process.env.VERCEL) {
  try {
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Tratamento de erros no servidor
    server.on('error', (error: any) => {
      console.error('❌ Erro no servidor:', error);
      if (error.code === 'EADDRINUSE') {
        console.log(`⚠️  Porta ${PORT} já está em uso`);
      }
    });
  } catch (error: any) {
    console.error('❌ Erro ao iniciar servidor:', error);
    process.exit(1);
  }
}


