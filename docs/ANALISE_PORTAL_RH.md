# Análise: Portal do RH para Clientes

## 📋 Resumo Executivo

Este documento apresenta a análise para implementação de um **Portal do RH** destinado aos clientes, conectado ao sistema principal, permitindo:

1. **Visualização limitada de Apólices** - Cliente visualiza apenas campos permitidos
2. **Módulo de Atendimento** - Cliente abre solicitações que são recepcionadas pelo time interno
3. **Mesmo template visual** - Mantém identidade visual do sistema principal

---

## 🎯 Objetivos

### Portal do RH
- Área exclusiva para clientes (separada do sistema interno)
- Autenticação independente
- Visualização limitada e controlada de dados
- Interface amigável e intuitiva

### Módulo de Atendimento
- Cliente abre solicitações/tickets
- Time interno recepciona e gerencia
- Integração com módulo de Solicitações existente
- Histórico e acompanhamento

---

## 🔍 Análise da Estrutura Atual

### Sistema Interno (Atual)
- **Usuários**: Funcionários/operadores do sistema
- **Autenticação**: JWT com roles (ADMIN, OPERADOR, etc)
- **Acesso**: Completo ao sistema
- **Tenant**: Multi-tenant por organização

### Necessidades do Portal RH
- **Usuários Cliente**: Representantes do cliente (RH, gestores)
- **Autenticação**: Separada, mas conectada ao mesmo tenant
- **Acesso**: Limitado e controlado
- **Visualização**: Apenas dados permitidos da apólice

---

## 🎨 Arquitetura Proposta

### 1. Modelagem de Dados

#### Novo Modelo: `UsuarioCliente` (Portal RH)
```prisma
model UsuarioCliente {
  id                String   @id @default(uuid())
  tenantId          String
  nome              String
  email             String
  senha             String   // Hash bcrypt
  cargo             String?  // Ex: "Gerente de RH", "Analista de Benefícios"
  telefone          String?
  ativo             Boolean  @default(true)
  criadoPor         String?  // ID do usuário interno que criou
  ultimoAcesso      DateTime?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant                Tenant                      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  criador               User?                       @relation("UsuariosClienteCriados", fields: [criadoPor], references: [id], onDelete: SetNull)
  apolices              UsuarioClienteApolice[]     // Relação many-to-many com apólices
  subEstipulantes       UsuarioClienteSubEstipulante[] // Relação many-to-many com sub-estipulantes
  solicitacoesAtendimento SolicitacaoAtendimento[]

  @@unique([tenantId, email])
  @@map("usuarios_cliente")
}
```

#### Modelo de Relação: `UsuarioClienteApolice` (Many-to-Many)
```prisma
model UsuarioClienteApolice {
  id              String   @id @default(uuid())
  tenantId        String
  usuarioClienteId String
  apoliceId       String
  createdAt       DateTime @default(now())

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  usuarioCliente UsuarioCliente @relation(fields: [usuarioClienteId], references: [id], onDelete: Cascade)
  apolice        Apolice       @relation(fields: [apoliceId], references: [id], onDelete: Cascade)

  @@unique([usuarioClienteId, apoliceId])
  @@map("usuarios_cliente_apolices")
}
```

#### Modelo de Relação: `UsuarioClienteSubEstipulante` (Many-to-Many)
```prisma
model UsuarioClienteSubEstipulante {
  id              String   @id @default(uuid())
  tenantId        String
  usuarioClienteId String
  subEstipulanteId String
  createdAt       DateTime @default(now())

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  usuarioCliente UsuarioCliente @relation(fields: [usuarioClienteId], references: [id], onDelete: Cascade)
  subEstipulante SubEstipulante @relation(fields: [subEstipulanteId], references: [id], onDelete: Cascade)

  @@unique([usuarioClienteId, subEstipulanteId])
  @@map("usuarios_cliente_sub_estipulantes")
}
```

**Delimitação de Acesso:**
- **Por Múltiplas Apólices**: Usuário pode estar vinculado a várias apólices
- **Por Sub-Estipulantes Específicos**: Usuário pode estar vinculado a sub-estipulantes específicos (mesmo que de apólices diferentes)
- **Lógica de Acesso**: 
  - Se tem apólices vinculadas → acessa todas essas apólices
  - Se tem sub-estipulantes vinculados → acessa apenas esses sub-estipulantes (mais restritivo)
  - Se tem ambos → acessa sub-estipulantes E apólices (sem sub-estipulantes específicos)
- **Por Tenant**: Isolamento multi-tenant mantido
- **Campos Visíveis**: Configurável por apólice (futuro)

#### Novo Modelo: `SolicitacaoAtendimento` (Módulo de Atendimento)
```prisma
model SolicitacaoAtendimento {
  id                String   @id @default(uuid())
  tenantId          String
  apoliceId         String?  // Apólice relacionada (opcional - pode ser sobre sub-estipulante)
  subEstipulanteId  String?  // Sub-estipulante relacionado (opcional)
  usuarioClienteId String   // Cliente que abriu
  numero            String   // Ex: ATD-000001
  tipo              String   // "DUVIDA", "SOLICITACAO", "RECLAMACAO", "SUGESTAO"
  assunto           String
  descricao         String
  prioridade        String   @default("MEDIA") // BAIXA, MEDIA, ALTA, URGENTE
  status            String   @default("ABERTA") // ABERTA, EM_ATENDIMENTO, RESOLVIDA, FECHADA
  responsavelId     String?  // Usuário interno responsável
  dataAbertura      DateTime @default(now())
  dataResolucao     DateTime?
  observacoesResolucao String?
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant         Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  apolice        Apolice?       @relation(fields: [apoliceId], references: [id], onDelete: Cascade)
  subEstipulante SubEstipulante? @relation(fields: [subEstipulanteId], references: [id], onDelete: Cascade)
  usuarioCliente UsuarioCliente @relation(fields: [usuarioClienteId], references: [id], onDelete: Cascade)
  responsavel    User?          @relation("SolicitacoesAtendimento", fields: [responsavelId], references: [id], onDelete: SetNull)
  
  anexos         AnexoSolicitacaoAtendimento[]
  historico      HistoricoSolicitacaoAtendimento[]

  @@map("solicitacoes_atendimento")
}
```

#### Modelos de Anexos e Histórico
```prisma
model AnexoSolicitacaoAtendimento {
  id                    String   @id @default(uuid())
  tenantId              String
  solicitacaoAtendimentoId String
  nomeArquivo           String
  caminhoArquivo        String
  tipoArquivo           String?
  tamanho               Int?
  createdAt             DateTime @default(now())

  tenant              Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitacaoAtendimento SolicitacaoAtendimento @relation(fields: [solicitacaoAtendimentoId], references: [id], onDelete: Cascade)

  @@map("anexos_solicitacao_atendimento")
}

model HistoricoSolicitacaoAtendimento {
  id                    String   @id @default(uuid())
  tenantId              String
  solicitacaoAtendimentoId String
  acao                  String   // "ABERTA", "ATRIBUIDA", "RESOLVIDA", "FECHADA", "REABERTA"
  usuarioId             String?  // Usuário interno ou cliente
  observacoes           String?
  createdAt             DateTime @default(now())

  tenant              Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitacaoAtendimento SolicitacaoAtendimento @relation(fields: [solicitacaoAtendimentoId], references: [id], onDelete: Cascade)
  usuario              User?               @relation("HistoricoSolicitacoesAtendimento", fields: [usuarioId], references: [id], onDelete: SetNull)

  @@map("historico_solicitacao_atendimento")
}
```

### 2. Estrutura de Rotas Backend

#### Autenticação Portal RH
```
POST   /api/portal/auth/login          - Login do cliente
POST   /api/portal/auth/logout         - Logout
POST   /api/portal/auth/refresh        - Refresh token
POST   /api/portal/auth/recuperar-senha - Recuperação de senha
```

#### Portal RH - Apólice (Visualização Limitada)
```
GET    /api/portal/apolices            - Listar apólices do usuário (todas as vinculadas)
GET    /api/portal/apolices/:id        - Visualizar apólice específica (campos permitidos)
GET    /api/portal/apolices/:id/planos - Listar planos da apólice (se permitido)
GET    /api/portal/apolices/:id/coberturas - Listar coberturas (se permitido)

GET    /api/portal/sub-estipulantes   - Listar sub-estipulantes do usuário (se vinculados)
GET    /api/portal/sub-estipulantes/:id - Visualizar sub-estipulante específico
```

#### Portal RH - Atendimento
```
GET    /api/portal/atendimento                    - Listar solicitações do cliente
GET    /api/portal/atendimento/:id                - Detalhes da solicitação
POST   /api/portal/atendimento                    - Abrir nova solicitação
PUT    /api/portal/atendimento/:id                - Atualizar solicitação (se permitido)
POST   /api/portal/atendimento/:id/anexos          - Adicionar anexos
GET    /api/portal/atendimento/:id/historico      - Histórico da solicitação
```

#### Sistema Interno - Gestão de Usuários do Portal
```
GET    /api/v1/usuarios-cliente                   - Listar usuários do portal
GET    /api/v1/usuarios-cliente/:id                - Detalhes do usuário (com apólices e sub-estipulantes)
POST   /api/v1/usuarios-cliente                    - Criar novo usuário do portal
PUT    /api/v1/usuarios-cliente/:id                - Atualizar usuário
DELETE /api/v1/usuarios-cliente/:id                - Desativar/Excluir usuário
PUT    /api/v1/usuarios-cliente/:id/resetar-senha  - Resetar senha

# Gestão de Vínculos
POST   /api/v1/usuarios-cliente/:id/apolices       - Vincular apólice(s) ao usuário
DELETE /api/v1/usuarios-cliente/:id/apolices/:apoliceId - Desvincular apólice
POST   /api/v1/usuarios-cliente/:id/sub-estipulantes - Vincular sub-estipulante(s) ao usuário
DELETE /api/v1/usuarios-cliente/:id/sub-estipulantes/:subEstipulanteId - Desvincular sub-estipulante

# Filtros
GET    /api/v1/usuarios-cliente?apoliceId=:id      - Listar usuários por apólice
GET    /api/v1/usuarios-cliente?subEstipulanteId=:id - Listar usuários por sub-estipulante
```

#### Sistema Interno - Gestão de Atendimento
```
GET    /api/v1/atendimento                        - Listar todas (time interno)
GET    /api/v1/atendimento/:id                    - Detalhes
PUT    /api/v1/atendimento/:id/atribuir           - Atribuir a responsável
PUT    /api/v1/atendimento/:id/resolver           - Marcar como resolvida
PUT    /api/v1/atendimento/:id/fechar             - Fechar solicitação
```

### 3. Estrutura Frontend

#### Rotas do Portal RH (Cliente)
```
/portal/login                    - Login do cliente
/portal/dashboard                - Dashboard do portal
/portal/apolice                  - Visualização da apólice
/portal/atendimento              - Lista de solicitações
/portal/atendimento/nova         - Nova solicitação
/portal/atendimento/:id          - Detalhes da solicitação
```

#### Rotas do Sistema Interno - Gestão de Usuários Portal
```
/usuarios-portal                 - Lista de usuários do portal
/usuarios-portal/novo            - Criar novo usuário
/usuarios-portal/:id             - Detalhes/Editar usuário
/usuarios-portal/:id/resetar     - Resetar senha
```

#### Componentes Portal RH
- `PortalLayout.tsx` - Layout do portal (mesmo template, cores diferentes?)
- `PortalLogin.tsx` - Tela de login
- `PortalDashboard.tsx` - Dashboard
- `PortalApolice.tsx` - Visualização limitada da apólice
- `AtendimentoList.tsx` - Lista de solicitações
- `AtendimentoForm.tsx` - Formulário de nova solicitação
- `AtendimentoDetalhes.tsx` - Detalhes e histórico

#### Componentes Sistema Interno
- `UsuariosPortal.tsx` - Lista de usuários do portal
- `UsuarioPortalForm.tsx` - Formulário de criação/edição
- `UsuarioPortalDetalhes.tsx` - Detalhes do usuário

### 4. Controle de Acesso e Permissões

#### Delimitação de Usuários

**Por Múltiplas Apólices:**
- ✅ Usuário pode estar vinculado a **várias apólices**
- Usuário acessa dados de todas as apólices vinculadas
- Não pode ver dados de apólices não vinculadas
- Gestão: Sistema interno pode adicionar/remover apólices

**Por Sub-Estipulantes Específicos:**
- ✅ Usuário pode estar vinculado a **sub-estipulantes específicos**
- Pode ser de apólices diferentes
- Se vinculado a sub-estipulante, acesso é mais restrito
- Usuário só vê dados daquele sub-estipulante específico
- Gestão: Sistema interno pode adicionar/remover sub-estipulantes

**Lógica de Acesso Combinada:**
- **Cenário 1**: Usuário com apólices (sem sub-estipulantes)
  - Acessa todas as apólices vinculadas
- **Cenário 2**: Usuário com sub-estipulantes (sem apólices diretas)
  - Acessa apenas os sub-estipulantes vinculados
- **Cenário 3**: Usuário com apólices E sub-estipulantes
  - Acessa sub-estipulantes vinculados + apólices vinculadas (sem sub-estipulantes específicos)

**Por Tenant:**
- Isolamento multi-tenant mantido
- Usuário só acessa dados do seu tenant

**Gestão pelo Sistema Interno:**
- ✅ Usuários internos podem criar usuários do portal
- ✅ Vincular múltiplas apólices ao usuário
- ✅ Vincular múltiplos sub-estipulantes ao usuário
- ✅ Adicionar/remover vínculos dinamicamente
- ✅ Ativar/desativar usuários
- ✅ Resetar senhas
- ✅ Visualizar último acesso
- ✅ Filtrar por apólice, sub-estipulante, status

#### Campos da Apólice - Visibilidade
- **Sempre visível**: Número da apólice, Status, Datas de vigência
- **Configurável**: Planos, Coberturas, Valores, Documentos
- **Nunca visível**: Dados financeiros sensíveis, Comissionamentos, Fees

#### Permissões do Cliente
- ✅ Visualizar apólice (campos permitidos, apenas da sua apólice)
- ✅ Abrir solicitações de atendimento
- ✅ Visualizar suas próprias solicitações
- ✅ Adicionar anexos
- ❌ Editar dados da apólice
- ❌ Ver solicitações de outros clientes
- ❌ Ver dados de outras apólices
- ❌ Acessar sistema interno

#### Permissões do Sistema Interno
- ✅ Criar/editar/excluir usuários do portal
- ✅ Definir apólice e sub-estipulante
- ✅ Ativar/desativar usuários
- ✅ Resetar senhas
- ✅ Visualizar todos os usuários do portal
- ✅ Filtrar por apólice, sub-estipulante, status
- ✅ Ver histórico de acessos

---

## 🔄 Fluxos de Trabalho

### Fluxo 1: Cliente acessa Portal RH
1. Cliente acessa `/portal/login`
2. Informa email e senha
3. Sistema valida e retorna token JWT (com role: CLIENTE)
4. Redireciona para `/portal/dashboard`

### Fluxo 2: Cliente visualiza Apólices/Sub-Estipulantes
1. Cliente acessa `/portal/apolices`
2. Sistema busca todas as apólices vinculadas ao usuário
3. Sistema busca todos os sub-estipulantes vinculados (se houver)
4. Cliente pode escolher qual apólice/sub-estipulante visualizar
5. Sistema filtra e retorna apenas campos permitidos
6. Exibe em interface amigável

### Fluxo 3: Cliente abre Solicitação de Atendimento
1. Cliente acessa `/portal/atendimento/nova`
2. Sistema mostra lista de apólices/sub-estipulantes vinculados
3. Cliente seleciona apólice ou sub-estipulante relacionado (opcional)
4. Preenche formulário (tipo, assunto, descrição, prioridade)
5. Opcionalmente anexa arquivos
6. Submete solicitação
7. Sistema cria registro com status "ABERTA"
8. Notifica time interno (futuro: email/notificação)

### Fluxo 4: Sistema Interno gerencia vínculos de usuário
1. Usuário interno acessa `/usuarios-portal/:id`
2. Visualiza apólices e sub-estipulantes vinculados
3. Pode adicionar novas apólices
4. Pode adicionar novos sub-estipulantes
5. Pode remover vínculos existentes
6. Alterações são salvas e refletem imediatamente no portal

### Fluxo 4: Time Interno recepciona Solicitação
1. Time interno acessa `/atendimento` (sistema interno)
2. Visualiza solicitações abertas
3. Atribui a um responsável
4. Status muda para "EM_ATENDIMENTO"
5. Responsável trabalha na resolução
6. Marca como "RESOLVIDA" ou "FECHADA"
7. Cliente visualiza atualização no portal

---

## 🎨 Identidade Visual

### Template
- **Mesmo template** do sistema principal
- **Cores**: Pode manter ou usar variação (ex: azul mais claro)
- **Layout**: Mesma estrutura (sidebar, header, etc)
- **Componentes**: Reutilizar componentes existentes

### Diferenças Visuais
- Logo/branding pode ser diferente
- Mensagens mais amigáveis
- Menos opções de menu (apenas o necessário)
- Interface mais simplificada

---

## 🔐 Segurança

### Autenticação
- JWT separado para clientes
- Token com expiração mais curta
- Refresh token implementado

### Autorização
- Middleware específico para portal (`authenticatePortal`)
- Validação de tenant e apólice
- Isolamento de dados por cliente

### Validação
- Cliente só acessa sua própria apólice
- Cliente só vê suas próprias solicitações
- Campos sensíveis nunca expostos

---

## 📊 Integração com Sistema Existente

### Conexão com Sistema Principal
✅ **SIM, o portal está totalmente conectado ao sistema principal:**
- Mesmo banco de dados
- Mesmo tenant
- Mesmas apólices
- Dados compartilhados (com controle de acesso)

### Módulo Apólice
- **Leitura**: Portal acessa dados das apólices vinculadas (limitado)
- **Escrita**: Apenas sistema interno pode editar
- **Delimitação**: Usuário vê todas as apólices vinculadas
- **Múltiplas Apólices**: Um usuário pode ter acesso a várias apólices

### Módulo Sub-Estipulante
- **Leitura**: Portal acessa dados dos sub-estipulantes vinculados
- **Escrita**: Apenas sistema interno pode editar
- **Delimitação**: Usuário vê apenas sub-estipulantes vinculados
- **Múltiplos Sub-Estipulantes**: Um usuário pode ter acesso a vários sub-estipulantes
- **Prioridade**: Se vinculado a sub-estipulante, acesso é mais restrito

### Módulo Sub-Estipulante
- **Vinculação**: Usuário pode ser vinculado a um sub-estipulante específico
- **Filtro**: Sistema interno pode filtrar usuários por sub-estipulante
- **Acesso**: Se vinculado, acesso ainda mais restrito

### Módulo Solicitações
- **Solicitações de Atendimento** podem ser convertidas em **Solicitações** internas
- Ou manter separado (atendimento é diferente de solicitação de placement/implantacao)
- Time interno visualiza todas as solicitações de atendimento

### Módulo Placement/Implantacao
- Cliente não tem acesso direto
- Time interno gerencia baseado nas solicitações de atendimento

### Gestão de Usuários Portal
- **Criação**: Sistema interno cria usuários do portal
- **Vinculação**: Define apólice e sub-estipulante
- **Controle**: Ativa/desativa, reseta senha
- **Visualização**: Lista todos os usuários com filtros

---

## ✅ Vantagens da Solução

1. **Isolamento**: Portal separado do sistema interno
2. **Segurança**: Controle granular de acesso
3. **Experiência**: Interface amigável para cliente
4. **Integração**: Conectado ao sistema principal
5. **Escalabilidade**: Fácil adicionar novos recursos
6. **Manutenção**: Reutiliza componentes existentes

---

## 📝 Próximos Passos

1. **Fase 1**: Criar modelos de dados e autenticação
2. **Fase 2**: Implementar rotas backend do portal
3. **Fase 3**: Criar páginas frontend do portal
4. **Fase 4**: Implementar módulo de atendimento
5. **Fase 5**: Configurar permissões e campos visíveis
6. **Fase 6**: Testes e ajustes

---

## ❓ Questões para Definir

1. **URL do Portal**: Subdomínio (`portal.empresa.com`) ou rota (`/portal`)?
2. **Cores/Branding**: Mesmo visual ou variação?
3. **Notificações**: Email quando solicitação é respondida?
4. **Campos Visíveis**: Quais campos da apólice o cliente pode ver?
5. **Múltiplos Usuários**: ✅ SIM - Um cliente pode ter vários usuários no portal (já previsto)
6. **Integração**: Solicitações de atendimento viram solicitações internas ou ficam separadas?
7. **Delimitação por Sub-Estipulante**: ✅ SIM - Já implementado na análise
8. **Gestão pelo Sistema Interno**: ✅ SIM - Sistema interno gerencia todos os usuários do portal

---

## 🎯 Conclusão

**SIM, é totalmente possível!** A solução proposta:
- ✅ Mantém o mesmo template visual
- ✅ Conecta ao sistema principal (módulo Apólice)
- ✅ Permite visualização controlada
- ✅ Implementa módulo de atendimento
- ✅ Mantém segurança e isolamento
- ✅ É escalável e manutenível

A arquitetura é sólida e pode ser implementada de forma incremental.

