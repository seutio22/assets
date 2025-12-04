# 🚀 Instruções de Execução

## Problema Identificado
O terminal está com problemas de timeout ao executar comandos via ferramenta.

## ✅ Solução: Execute Manualmente

### Opção 1: Script Automático (Recomendado)

No PowerShell, na pasta `backend`, execute:

```powershell
npm run exec:fix
```

Ou diretamente:

```powershell
node exec-fix.js
```

### Opção 2: Comandos Individuais

Se o script não funcionar, execute um por um:

```powershell
# 1. Remover pasta problemática
Remove-Item -Recurse -Force prisma\migrations\add_implantacao_module -ErrorAction SilentlyContinue

# 2. Deletar banco
Remove-Item prisma\dev.db -ErrorAction SilentlyContinue

# 3. Regenerar Prisma Client
npm run prisma:generate

# 4. Aplicar migrations
npx prisma migrate dev

# 5. Popular dados
npm run prisma:seed

# 6. Verificar
npm run check:permissions
```

## 📋 O que o Script Faz

1. ✅ Remove a pasta `add_implantacao_module` que está causando conflito
2. ✅ Deleta o banco de dados antigo
3. ✅ Regenera o Prisma Client com os novos modelos
4. ✅ Aplica todas as migrations
5. ✅ Popula recursos, permissões e perfis padrão
6. ✅ Verifica se tudo está funcionando

## ⚠️ Se Der Erro

Envie a mensagem de erro completa para que eu possa ajustar.

