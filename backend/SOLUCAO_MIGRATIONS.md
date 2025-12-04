# 🔧 Solução para Problemas de Migration

## Problemas Identificados

1. **Migration duplicada**: Existe uma pasta `add_implantacao_module` sem timestamp que está causando conflito
2. **Prisma Client desatualizado**: Os modelos Resource, Permission, Role não foram gerados ainda
3. **Seed falhando**: Tentando usar modelos que não existem

## ✅ Solução Passo a Passo

### Passo 1: Remover Migration Duplicada

Execute no PowerShell (na pasta `backend`):

```powershell
# Remover a pasta duplicada manualmente
Remove-Item -Recurse -Force prisma\migrations\add_implantacao_module
```

OU execute o script de fix:

```powershell
npm run fix:migrations
```

### Passo 2: Regenerar Prisma Client

```powershell
npm run prisma:generate
```

Isso vai gerar os tipos TypeScript para os novos modelos (Resource, Permission, Role, etc.)

### Passo 3: Criar a Migration do Sistema de Permissões

```powershell
npx prisma migrate dev --name add_permissions_system
```

**IMPORTANTE**: Se der erro sobre shadow database, tente:

```powershell
npx prisma migrate dev --name add_permissions_system --skip-seed
```

### Passo 4: Popular o Banco com Dados Iniciais

```powershell
npm run prisma:seed
```

## 🚨 Se Ainda Der Erro

### Opção 1: Resetar o Banco (CUIDADO - apaga todos os dados!)

```powershell
npx prisma migrate reset
npm run prisma:seed
```

### Opção 2: Criar Migration Manualmente

Se a migration automática falhar, você pode criar as tabelas manualmente executando o SQL diretamente no banco.

## 📋 Verificar se Funcionou

Execute:

```powershell
npm run check:permissions
```

Deve mostrar que todas as tabelas existem e estão populadas.

