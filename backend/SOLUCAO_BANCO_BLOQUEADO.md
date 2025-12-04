# 🔓 Solução: Banco Bloqueado

## O Problema
O SQLite está bloqueado porque algum processo está usando o banco.

## Solução Rápida

### Passo 1: Fechar TODOS os processos

1. **Feche o Prisma Studio** (se estiver aberto)
2. **Pare o servidor backend** (Ctrl+C no terminal onde está rodando)
3. **Feche qualquer outra aplicação** que possa estar usando o banco

### Passo 2: Remover arquivos de lock

```powershell
Remove-Item prisma\dev.db-journal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-wal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-shm -ErrorAction SilentlyContinue
```

Ou use o script:

```powershell
npm run unlock
```

### Passo 3: Aguardar 10 segundos

### Passo 4: Tentar novamente

```powershell
npx prisma migrate dev --name add_permissions_system
```

## Se AINDA der erro

### Opção 1: Deletar e recriar o banco

```powershell
# Fazer backup (opcional)
Copy-Item prisma\dev.db prisma\dev.db.backup -ErrorAction SilentlyContinue

# Deletar banco
Remove-Item prisma\dev.db -Force

# Recriar todas as migrations
npx prisma migrate dev

# Popular dados
npm run prisma:seed
```

### Opção 2: Verificar processos

```powershell
# Ver processos usando o banco (Windows)
Get-Process | Where-Object {$_.Path -like "*prisma*" -or $_.Path -like "*node*"}
```

### Opção 3: Reiniciar o terminal

Às vezes ajuda fechar e abrir o PowerShell novamente.

## Comandos Completos (Último Recurso)

```powershell
# 1. Parar tudo
# Feche Prisma Studio, servidor backend, etc.

# 2. Remover locks
Remove-Item prisma\dev.db-journal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-wal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-shm -ErrorAction SilentlyContinue

# 3. Deletar banco
Remove-Item prisma\dev.db -Force

# 4. Recriar tudo
npx prisma migrate dev

# 5. Popular dados
npm run prisma:seed

# 6. Verificar
npm run check:permissions
```

