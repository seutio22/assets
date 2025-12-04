# 🔒 Fechar Processos que Estão Bloqueando o Banco

## O Problema
O banco está sendo usado por outro processo (provavelmente Node.js, Prisma Studio, ou servidor backend).

## Solução Rápida

### 1. Identificar processos

```powershell
npm run find:lock
```

Ou execute diretamente:

```powershell
powershell -ExecutionPolicy Bypass -File find-locking-process.ps1
```

### 2. Fechar TODOS os processos Node.js

```powershell
Stop-Process -Name node -Force
```

**CUIDADO**: Isso fecha TODOS os processos Node.js, incluindo:
- Servidor backend (se estiver rodando)
- Prisma Studio
- Qualquer outro script Node.js

### 3. Verificar se desbloqueou

```powershell
npm run find:lock
```

### 4. Tentar deletar o banco novamente

```powershell
Remove-Item prisma\dev.db -Force
```

### 5. Recriar tudo

```powershell
npx prisma migrate dev
npm run prisma:seed
npm run check:permissions
```

## Solução Manual

### Passo a passo:

1. **Feche Prisma Studio** (se estiver aberto)
   - Procure na barra de tarefas
   - Feche a janela

2. **Pare o servidor backend**
   - Vá no terminal onde está rodando `npm run dev`
   - Pressione `Ctrl+C`

3. **Feche todos os terminais PowerShell/CMD** que possam estar usando o banco

4. **Reinicie o PowerShell** (fechar e abrir novamente)

5. **Tente deletar o banco novamente**

```powershell
Remove-Item prisma\dev.db -Force
```

## Se AINDA não funcionar

### Último recurso: Reiniciar o computador

Às vezes o Windows mantém locks mesmo depois de fechar processos. Reiniciar resolve.

## Comandos Completos

```powershell
# 1. Fechar todos os processos Node.js
Stop-Process -Name node -Force

# 2. Aguardar 5 segundos
Start-Sleep -Seconds 5

# 3. Remover locks
Remove-Item prisma\dev.db-journal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-wal -ErrorAction SilentlyContinue
Remove-Item prisma\dev.db-shm -ErrorAction SilentlyContinue

# 4. Deletar banco
Remove-Item prisma\dev.db -Force

# 5. Recriar
npx prisma migrate dev
npm run prisma:seed
npm run check:permissions
```

