# Plano de Deploy

## Arquitetura de Deploy

### Opção 1: AWS (Recomendado para Produção)

```
┌─────────────────────────────────────────┐
│         CloudFront (CDN)                │
│         (Frontend estático)              │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Application Load Balancer          │
└─────────────────┬───────────────────────┘
                  │
      ┌───────────┴───────────┐
      │                       │
┌─────▼─────┐         ┌───────▼──────┐
│  EC2 #1   │         │    EC2 #2    │
│  Backend  │         │   Backend    │
└───────────┘         └──────────────┘
      │                       │
      └───────────┬───────────┘
                  │
         ┌────────▼────────┐
         │   RDS PostgreSQL │
         │   (Multi-AZ)     │
         └──────────────────┘
```

#### Componentes AWS

1. **Frontend (Vercel ou S3 + CloudFront)**
   - Deploy do build React para S3
   - CloudFront para CDN global
   - Alternativa: Vercel (mais simples)

2. **Backend (Elastic Beanstalk ou ECS)**
   - Elastic Beanstalk: gerenciamento simplificado
   - ECS Fargate: containers escaláveis
   - Auto Scaling configurado

3. **Banco de Dados (RDS PostgreSQL)**
   - Multi-AZ para alta disponibilidade
   - Backups automáticos
   - Read replicas para performance

4. **Segurança**
   - Security Groups configurados
   - SSL/TLS via Certificate Manager
   - Secrets Manager para variáveis sensíveis

### Opção 2: Railway (Recomendado para MVP/Desenvolvimento)

```
┌─────────────────────────────────────────┐
│         Railway Platform                 │
│  ┌──────────────┐  ┌──────────────┐    │
│  │   Frontend   │  │   Backend    │    │
│  │   (Vite)     │  │  (Express)   │    │
│  └──────┬───────┘  └──────┬───────┘    │
│         │                 │            │
│         └────────┬─────────┘            │
│                  │                      │
│         ┌────────▼────────┐            │
│         │  PostgreSQL     │            │
│         │  (Railway DB)   │            │
│         └─────────────────┘            │
└─────────────────────────────────────────┘
```

**Vantagens Railway:**
- Deploy automático via Git
- SSL automático
- Banco de dados gerenciado
- Pricing simples
- Ideal para MVP

## Passos de Deploy

### 1. Preparação do Ambiente

#### Backend
```bash
cd backend
npm install
npm run build
```

#### Frontend
```bash
cd frontend
npm install
npm run build
```

### 2. Variáveis de Ambiente

#### Backend (.env)
```env
DATABASE_URL="postgresql://user:pass@host:5432/dbname"
JWT_SECRET="seu-secret-super-seguro-aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
NODE_ENV=production
CORS_ORIGIN="https://seu-dominio.com"
```

#### Frontend (.env)
```env
VITE_API_URL="https://api.seu-dominio.com"
```

### 3. Deploy no Railway

#### Backend
1. Conectar repositório Git ao Railway
2. Configurar variáveis de ambiente
3. Railway detecta automaticamente Node.js
4. Deploy automático a cada push

#### Frontend
1. Criar novo serviço no Railway
2. Configurar build command: `npm run build`
3. Configurar start command: `npx serve -s dist`
4. Configurar variáveis de ambiente

#### Banco de Dados
1. Criar serviço PostgreSQL no Railway
2. Copiar DATABASE_URL para variáveis do backend

### 4. Deploy na AWS

#### Frontend (S3 + CloudFront)
```bash
# Build
cd frontend
npm run build

# Upload para S3
aws s3 sync dist/ s3://seu-bucket-frontend --delete

# Invalidar cache CloudFront
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"
```

#### Backend (Elastic Beanstalk)
```bash
# Instalar EB CLI
pip install awsebcli

# Inicializar
eb init -p node.js edge2-backend

# Criar ambiente
eb create edge2-prod

# Deploy
eb deploy
```

#### Banco de Dados (RDS)
1. Criar instância RDS PostgreSQL via Console
2. Configurar Multi-AZ
3. Configurar Security Groups
4. Atualizar DATABASE_URL no backend

### 5. Configuração de Domínio

#### Railway
- Adicionar domínio customizado no painel
- SSL automático via Let's Encrypt

#### AWS
- Registrar domínio no Route 53
- Configurar certificado SSL no Certificate Manager
- Configurar CloudFront com certificado
- Configurar ALB com certificado

### 6. Monitoramento

#### Opções
- **Sentry**: Erros e performance
- **Datadog**: Métricas e logs
- **New Relic**: APM completo
- **CloudWatch** (AWS): Métricas nativas

### 7. CI/CD

#### GitHub Actions
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Railway
        run: |
          # Comandos de deploy
```

## Checklist de Deploy

- [ ] Variáveis de ambiente configuradas
- [ ] Banco de dados criado e migrado
- [ ] Build do frontend gerado
- [ ] Build do backend gerado
- [ ] SSL/HTTPS configurado
- [ ] CORS configurado corretamente
- [ ] Rate limiting ativo
- [ ] Backups do banco configurados
- [ ] Monitoramento configurado
- [ ] Logs configurados
- [ ] Testes de carga realizados
- [ ] Documentação atualizada

## Custos Estimados

### Railway (MVP)
- Frontend: $5/mês
- Backend: $5/mês
- PostgreSQL: $5/mês
- **Total: ~$15/mês**

### AWS (Produção)
- EC2 (t3.small x2): ~$30/mês
- RDS (db.t3.micro): ~$15/mês
- CloudFront: ~$5/mês
- S3: ~$1/mês
- **Total: ~$51/mês**

## Manutenção

### Atualizações
- Deploy automático via Git
- Migrações de banco via Prisma
- Rollback rápido via Railway/AWS

### Backup
- Backups automáticos do RDS
- Snapshots diários
- Retenção de 7 dias

### Escalabilidade
- Auto Scaling configurado
- Load Balancer para distribuição
- Read Replicas quando necessário

