# Sistema de Permissões RBAC - EDGE 2.0

## 📋 Visão Geral

O sistema implementa um modelo **RBAC (Role-Based Access Control)** robusto e flexível, permitindo controle granular de acesso aos recursos do sistema através de perfis de acesso e permissões.

## 🏗️ Arquitetura do Modelo

### Componentes Principais

1. **Resources (Recursos)** - Módulos/entidades do sistema
2. **Permissions (Permissões)** - Ações que podem ser executadas
3. **Roles (Perfis)** - Grupos de permissões atribuídos a usuários
4. **UserRoles** - Relação many-to-many entre usuários e perfis
5. **RolePermissions** - Relação many-to-many entre perfis e permissões
6. **UserResourceFilters** - Filtros específicos de acesso por recurso

## 📊 Modelo de Dados

### Resource (Recurso)
Representa um módulo ou entidade do sistema.

**Exemplos:**
- `GRUPOS_ECONOMICOS` - Gestão de grupos econômicos
- `EMPRESAS` - Gestão de empresas
- `APOLICES` - Gestão de apólices
- `SOLICITACOES` - Módulo de solicitações
- `PLACEMENT` - Módulo de placement
- `IMPLANTACAO` - Módulo de implantação
- `USUARIOS` - Gestão de usuários
- `PERFIS` - Gestão de perfis de acesso

### Permission (Permissão)
Representa uma ação que pode ser executada.

**Permissões Padrão:**
- `CREATE` - Criar novos registros
- `READ` - Visualizar registros
- `UPDATE` - Editar registros
- `DELETE` - Excluir registros
- `APPROVE` - Aprovar processos
- `REJECT` - Rejeitar processos
- `MANAGE` - Acesso completo ao recurso
- `EXPORT` - Exportar dados
- `IMPORT` - Importar dados

### Role (Perfil)
Grupo de permissões que pode ser atribuído a usuários.

**Características:**
- Pode ser **global** (tenantId = null) ou **específico do tenant**
- Pode ser marcado como **sistema** (isSystem = true) - não pode ser deletado
- Um usuário pode ter **múltiplos perfis**

**Perfis Padrão:**
- `ADMIN` - Administrador (global, sistema)
- `GESTOR` - Gestor (tenant específico)
- `OPERADOR` - Operador (tenant específico)
- `ANALISTA` - Analista (tenant específico)

## 🔐 Como Funciona

### 1. Hierarquia de Permissões

```
Usuário
  └── Perfis (Roles)
        └── Permissões (Permissions)
              └── Recursos (Resources)
```

### 2. Verificação de Permissões

O sistema verifica permissões na seguinte ordem:

1. **Permissão específica do recurso** - Ex: `READ` em `APOLICES`
2. **Permissão MANAGE** - Acesso total ao recurso
3. **Permissão global** - Permissão sem recurso específico

### 3. Filtros de Recurso

Permite restringir acesso a recursos específicos:

**Exemplo:**
- Usuário pode ver apenas apólices de um grupo econômico específico
- Usuário pode gerenciar apenas empresas de uma região

## 📝 Uso no Código

### Middleware de Permissões

```typescript
import { requirePermission } from '../middlewares/permissions.middleware';

// Proteger rota com permissão específica
router.post('/apolices', 
  requirePermission('APOLICES', 'CREATE'),
  async (req, res) => {
    // ...
  }
);
```

### Verificação Programática

```typescript
import { checkPermission } from '../middlewares/permissions.middleware';

const canEdit = await checkPermission(userId, 'APOLICES', 'UPDATE');
if (canEdit) {
  // Permitir edição
}
```

## 🛠️ API Endpoints

### Recursos
- `GET /api/v1/permissions/resources` - Listar recursos

### Permissões
- `GET /api/v1/permissions/permissions` - Listar permissões

### Perfis
- `GET /api/v1/permissions/roles` - Listar perfis
- `GET /api/v1/permissions/roles/:id` - Buscar perfil
- `POST /api/v1/permissions/roles` - Criar perfil
- `PUT /api/v1/permissions/roles/:id` - Atualizar perfil
- `DELETE /api/v1/permissions/roles/:id` - Deletar perfil

### Permissões de Perfis
- `GET /api/v1/permissions/roles/:id/permissions` - Listar permissões do perfil
- `POST /api/v1/permissions/roles/:id/permissions` - Adicionar permissão
- `DELETE /api/v1/permissions/roles/:id/permissions/:permissionId` - Remover permissão

### Usuários e Perfis
- `GET /api/v1/permissions/users/:id/roles` - Listar perfis do usuário
- `POST /api/v1/permissions/users/:id/roles` - Adicionar perfil ao usuário
- `DELETE /api/v1/permissions/users/:id/roles/:roleId` - Remover perfil do usuário

### Permissões do Usuário Atual
- `GET /api/v1/permissions/me` - Listar permissões do usuário logado

## 🎯 Exemplos de Uso

### Criar um Novo Perfil

```json
POST /api/v1/permissions/roles
{
  "codigo": "COORDENADOR",
  "nome": "Coordenador",
  "descricao": "Coordena processos de placement",
  "ativo": true
}
```

### Adicionar Permissões ao Perfil

```json
POST /api/v1/permissions/roles/{roleId}/permissions
{
  "permissionId": "permission-uuid",
  "resourceId": "resource-uuid" // ou null para permissão global
}
```

### Atribuir Perfil a Usuário

```json
POST /api/v1/permissions/users/{userId}/roles
{
  "roleId": "role-uuid"
}
```

## 🔄 Migração e Seed

### Executar Migration

```bash
cd backend
npm run prisma:migrate
```

### Executar Seed (popula dados iniciais)

```bash
npm run prisma:seed
```

O seed cria:
- ✅ Recursos padrão do sistema
- ✅ Permissões padrão
- ✅ Perfis padrão (ADMIN, GESTOR, OPERADOR, ANALISTA)
- ✅ Atribuição de permissões aos perfis
- ✅ Usuário administrador inicial

## 💡 Boas Práticas

1. **Sempre verifique permissões** antes de operações sensíveis
2. **Use permissões específicas** ao invés de MANAGE quando possível
3. **Documente perfis customizados** criados para o tenant
4. **Revise permissões periodicamente** para manter segurança
5. **Use filtros de recurso** para restrições granulares

## 🔒 Segurança

- Permissões são verificadas em **cada requisição**
- Perfis do sistema não podem ser deletados
- Apenas usuários com permissão `PERFIS:UPDATE` podem gerenciar perfis
- Apenas usuários com permissão `USUARIOS:UPDATE` podem atribuir perfis

## 📚 Recursos Adicionais

- [Documentação Prisma](https://www.prisma.io/docs)
- [RBAC Pattern](https://en.wikipedia.org/wiki/Role-based_access_control)

