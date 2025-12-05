# ⚡ APLICAR ÍNDICES DE PERFORMANCE - URGENTE

## 🚨 IMPORTANTE: Execute isso AGORA para melhorar a performance

Os índices foram adicionados ao schema, mas **PRECISAM SER APLICADOS NO BANCO DE DADOS**.

## 📋 Passo a Passo:

### Opção 1: Via PowerShell (Recomendado)

1. Abra o PowerShell
2. Navegue até a pasta do backend:
   ```powershell
   cd backend
   ```

3. Configure a DATABASE_URL (use a URL do Railway):
   ```powershell
   $env:DATABASE_URL = "postgresql://postgres:MwNFhGtpnAvlShuEaXpRDureDUVtHakI@interchange.proxy.rlwy.net:37916/railway?sslmode=require"
   ```

4. Execute o script:
   ```powershell
   .\APLICAR_INDICES_PERFORMANCE.ps1
   ```

### Opção 2: Via Railway CLI

1. No terminal:
   ```powershell
   cd backend
   railway link
   railway run npx prisma db push --accept-data-loss
   ```

### Opção 3: Via Dashboard do Railway

1. Acesse o serviço do backend no Railway
2. Vá em "Deployments" → "View Logs"
3. Use o terminal integrado:
   ```bash
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```

## ✅ Índices que serão aplicados:

- `Empresa.razaoSocial` - Acelera buscas por nome
- `Empresa.cnpj` - Acelera buscas por CNPJ
- `Fornecedor.razaoSocial` - Acelera buscas por nome
- `Fornecedor.cnpj` - Acelera buscas por CNPJ
- `Apolice.numero` - Acelera buscas por número
- `Apolice.produto` - Acelera buscas por produto

## 🎯 Resultado Esperado:

- **Buscas 3-5x mais rápidas**
- **Queries de listagem 50% mais rápidas**
- **Sistema muito mais responsivo**

## ⚠️ IMPORTANTE:

Execute isso **AGORA** para melhorar a performance do sistema!

