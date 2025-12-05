# Análise dos Módulos: Solicitações, Placement e Implantação

## 📋 Resumo Executivo

Este documento apresenta a análise completa para implementação de 3 módulos integrados:
1. **Módulo Solicitações** - Abertura de chamados
2. **Módulo Placement** - Gestão de cotações (3 submódulos)
3. **Módulo Implantação** - Expansão do módulo existente com fluxo de aprovação

---

## 🔍 Análise da Estrutura Atual

### Módulo de Implantação Existente

**Modelos de Dados:**
- `ChamadoImplantacao` - Chamados de implantação
- `Implantacao` - Processos de implantação
- `CronogramaItem` - Itens do cronograma

**Rotas Backend:**
- `/chamados-implantacao` - CRUD de chamados
- `/implantacoes` - CRUD de implantações

**Frontend:**
- `pages/Chamados.tsx` - Listagem de chamados
- `pages/Implantacoes.tsx` - Listagem de implantações
- `components/ChamadoForm.tsx` - Formulário de chamados

**Observações:**
- O modelo `ChamadoImplantacao` está vinculado apenas a `Apolice`
- Não há distinção entre tipos de solicitação (Placement vs Implantação)
- Não há histórico de movimentações/auditoria
- Não há sistema de aprovação/rejeição

---

## 🎯 Modelagem de Dados Necessária

### 1. MÓDULO: Solicitações

#### ❓ Questionamentos Prévios (Antes do Formulário)

**Objetivo:** Coletar informações iniciais para direcionar o usuário ao formulário correto e pré-preencher dados.

**Para Placement:**
- [ ] Pergunta 1: [A definir]
- [ ] Pergunta 2: [A definir]
- [ ] Pergunta 3: [A definir]
- [ ] Outras perguntas específicas...

**Para Implantação:**
- [ ] Pergunta 1: Qual o tipo de implantação? (Nomeação / Nova Apólice)
- [ ] Pergunta 2: [A definir]
- [ ] Pergunta 3: [A definir]
- [ ] Outras perguntas específicas...

**Fluxo:**
1. Usuário clica em "Nova Solicitação"
2. Sistema apresenta questionamentos baseados no tipo escolhido (Placement ou Implantação)
3. Usuário responde os questionamentos
4. Sistema carrega formulário pré-preenchido com base nas respostas
5. Usuário completa o formulário e submete

#### 📝 Campos para Abertura de Solicitação

**Campos Mínimos Obrigatórios (comuns para Placement e Implantação):**
- **ID da Solicitação** - Gerado automaticamente (SOL-000001)
- **Tipo de solicitação** - Placement OU Implantação (obrigatório)
- **Data e hora da abertura** - Automático (now())
- **Solicitante** - Perfil Relacionamento (obrigatório)
- **Descrição detalhada da necessidade** - Texto longo (obrigatório)
- **Nível de urgência** - BAIXA, MEDIA, ALTA, URGENTE (padrão: MEDIA)

**Campos Opcionais (comuns):**
- **Itens ou serviços solicitados** - JSON ou texto estruturado
- **Arquivos anexos** - Upload múltiplo
- **Observações adicionais** - Texto livre
- **Apólice relacionada** - Opcional (pode criar sem apólice)

**Campos Específicos para Placement:**
- **Itens para cotação** - Lista detalhada de itens/serviços a cotar
- **Prazo desejado para cotação** - Data opcional

**Campos Específicos para Implantação Direta:**
- **Tipo de Implantação** - Obrigatório: "NOMEACAO" ou "NOVA_APOLICE"
  - **Se NOMEACAO**: Apólice é obrigatória (implantação em apólice existente)
  - **Se NOVA_APOLICE**: Apólice é opcional (vai criar nova apólice durante implantação)
- **Dados técnicos iniciais** - JSON com informações preliminares
- **Prazo desejado para implantação** - Data opcional

**Tabela Comparativa de Campos:**

| Campo | Placement | Implantação (Nomeação) | Implantação (Nova Apólice) | Observações |
|-------|-----------|------------------------|----------------------------|-------------|
| ID da Solicitação | ✅ Auto | ✅ Auto | ✅ Auto | Gerado automaticamente (SOL-000001) |
| Tipo de solicitação | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório | Seleção: Placement OU Implantação |
| Tipo de Implantação | ❌ N/A | ✅ Obrigatório | ✅ Obrigatório | NOMEACAO ou NOVA_APOLICE |
| Data e hora da abertura | ✅ Auto | ✅ Auto | ✅ Auto | Timestamp automático |
| Solicitante (Relacionamento) | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório | Perfil Relacionamento |
| Descrição detalhada | ✅ Obrigatório | ✅ Obrigatório | ✅ Obrigatório | Texto longo |
| Nível de urgência | ✅ Opcional | ✅ Opcional | ✅ Opcional | Padrão: MEDIA |
| Itens/serviços | ✅ Opcional | ✅ Opcional | ✅ Opcional | JSON ou texto estruturado |
| Arquivos anexos | ✅ Opcional | ✅ Opcional | ✅ Opcional | Upload múltiplo |
| Observações adicionais | ✅ Opcional | ✅ Opcional | ✅ Opcional | Texto livre |
| **Apólice relacionada** | ⚠️ **Opcional** | ✅ **Obrigatório** | ⚠️ **Opcional** | **Diferença principal** |
| Prazo desejado | ✅ Opcional | ✅ Opcional | ✅ Opcional | Data futura |

**Observações Importantes:**
- Se tipo = **PLACEMENT**: Apólice é opcional (pode criar solicitação sem apólice, criar depois)
- Se tipo = **IMPLANTACAO**:
  - **Sub-tipo NOMEACAO**: Apólice é obrigatória (implantação em apólice existente)
  - **Sub-tipo NOVA_APOLICE**: Apólice é opcional (vai criar nova apólice durante implantação)
- O destino final de ambos os fluxos é o **módulo Apólice** (dados consolidados)
- Campos com ✅ são comuns aos tipos
- Campo com ⚠️ tem comportamento diferente conforme o tipo/sub-tipo

#### Modelo: `Solicitacao`

```prisma
model Solicitacao {
  id                String   @id @default(uuid())
  tenantId          String
  numero            String   // ID da solicitação (ex: SOL-000001) - gerado automaticamente
  tipo              String   // "PLACEMENT" ou "IMPLANTACAO" - OBRIGATÓRIO
  tipoImplantacao   String?  // "NOMEACAO" ou "NOVA_APOLICE" - Obrigatório se tipo=IMPLANTACAO
  solicitanteId     String   // ID do usuário (perfil Relacionamento) - OBRIGATÓRIO
  apoliceId         String?  // Regras:
                             // - Se tipo=PLACEMENT: Opcional
                             // - Se tipo=IMPLANTACAO e tipoImplantacao=NOMEACAO: Obrigatório
                             // - Se tipo=IMPLANTACAO e tipoImplantacao=NOVA_APOLICE: Opcional
  descricao         String   // Descrição detalhada da necessidade - OBRIGATÓRIO
  itensServicos     String?  // JSON com lista de itens/serviços solicitados (opcional)
  nivelUrgencia     String   @default("MEDIA") // BAIXA, MEDIA, ALTA, URGENTE
  observacoes       String?  // Observações adicionais (opcional)
  prazoDesejado     DateTime? // Prazo desejado (opcional)
  status            String   @default("ABERTA") // ABERTA, ENVIADA_PLACEMENT, ENVIADA_IMPLANTACAO, CANCELADA
  placementId       String?  // ID do placement relacionado (se tipo = PLACEMENT)
  implantacaoId     String?  // ID da implantação relacionada (se tipo = IMPLANTACAO)
  dataAbertura      DateTime @default(now()) // Data e hora da abertura - automático
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitante User?        @relation("SolicitacoesCriadas", fields: [solicitanteId], references: [id], onDelete: SetNull)
  apolice     Apolice?    @relation(fields: [apoliceId], references: [id], onDelete: SetNull)
  placement   Placement?  @relation(fields: [placementId], references: [id], onDelete: SetNull)
  implantacao Implantacao? @relation(fields: [implantacaoId], references: [id], onDelete: SetNull)
  anexos      AnexoSolicitacao[]
  historico   HistoricoSolicitacao[]
}
```

#### Modelo: `AnexoSolicitacao`

```prisma
model AnexoSolicitacao {
  id            String   @id @default(uuid())
  tenantId      String
  solicitacaoId String
  nomeArquivo   String
  caminhoArquivo String
  tipoArquivo   String?
  tamanho       Int?
  createdAt     DateTime @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitacao Solicitacao @relation(fields: [solicitacaoId], references: [id], onDelete: Cascade)
}
```

#### Modelo: `HistoricoSolicitacao`

```prisma
model HistoricoSolicitacao {
  id            String   @id @default(uuid())
  tenantId      String
  solicitacaoId String
  acao          String   // "CRIADA", "ENVIADA_PLACEMENT", "CANCELADA", etc
  usuarioId     String?  // ID do usuário que executou a ação
  observacoes   String?
  dadosAnteriores String? // JSON com dados anteriores (para auditoria)
  dadosNovos    String?  // JSON com dados novos
  createdAt     DateTime @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitacao Solicitacao @relation(fields: [solicitacaoId], references: [id], onDelete: Cascade)
  usuario     User?       @relation("HistoricoSolicitacoes", fields: [usuarioId], references: [id], onDelete: SetNull)
}
```

---

### 2. MÓDULO: Placement

#### Modelo: `Placement`

```prisma
model Placement {
  id                String   @id @default(uuid())
  tenantId          String
  solicitacaoId     String?  // ID da solicitação que originou
  numero            String   // ID do placement (ex: PL-000001)
  status            String   @default("TRIAGEM") // TRIAGEM, EM_ANDAMENTO, ENTREGUE, FECHADO, REJEITADO
  gestorId          String?  // ID do gestor responsável
  analistaId        String?  // ID do analista responsável
  solicitanteId     String?  // ID do solicitante
  dataTriagem       DateTime?
  dataInicio        DateTime?
  dataEntrega       DateTime?
  dataFechamento    DateTime?
  responsavelFechamento String? // Nome do responsável pelo fechamento
  observacoesFechamento  String?
  itensFinais       String?  // JSON com itens finais da cotação
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  tenant      Tenant              @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  solicitacao Solicitacao?        @relation(fields: [solicitacaoId], references: [id], onDelete: SetNull)
  gestor      User?               @relation("PlacementsGerenciados", fields: [gestorId], references: [id], onDelete: SetNull)
  analista    User?               @relation("PlacementsAnalisados", fields: [analistaId], references: [id], onDelete: SetNull)
  solicitante User?               @relation("PlacementsSolicitados", fields: [solicitanteId], references: [id], onDelete: SetNull)
  itens       ItemPlacement[]
  anexos      AnexoPlacement[]
  historico   HistoricoPlacement[]
  demanda     Demanda?
}
```

#### Modelo: `ItemPlacement`

```prisma
model ItemPlacement {
  id            String   @id @default(uuid())
  tenantId      String
  placementId   String
  descricao     String
  quantidade    Float?
  valorUnitario Float?
  valorTotal    Float?
  observacoes   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  placement Placement @relation(fields: [placementId], references: [id], onDelete: Cascade)
}
```

#### Modelo: `AnexoPlacement`

```prisma
model AnexoPlacement {
  id            String   @id @default(uuid())
  tenantId      String
  placementId   String
  nomeArquivo   String
  caminhoArquivo String
  tipoArquivo   String?
  tamanho       Int?
  etapa         String?  // "TRIAGEM", "COTACAO", "ENTREGA", "FECHAMENTO"
  createdAt     DateTime @default(now())

  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  placement Placement @relation(fields: [placementId], references: [id], onDelete: Cascade)
}
```

#### Modelo: `HistoricoPlacement`

```prisma
model HistoricoPlacement {
  id            String   @id @default(uuid())
  tenantId      String
  placementId   String
  acao          String   // "APROVADO_TRIAGEM", "REJEITADO_TRIAGEM", "ASSUMIDO_ANALISTA", "ENTREGUE", "APROVADO_SOLICITANTE", "REPIQUE", "FECHADO"
  usuarioId     String?  // ID do usuário que executou a ação
  observacoes   String?
  dadosAnteriores String? // JSON
  dadosNovos    String?  // JSON
  createdAt     DateTime @default(now())

  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  placement Placement @relation(fields: [placementId], references: [id], onDelete: Cascade)
  usuario   User?     @relation("HistoricoPlacements", fields: [usuarioId], references: [id], onDelete: SetNull)
}
```

#### Modelo: `Demanda`

```prisma
model Demanda {
  id                    String   @id @default(uuid())
  tenantId              String
  placementId           String   @unique
  status                String   @default("FECHADO") // FECHADO, ENVIADO_IMPLANTACAO
  dataFechamento        DateTime
  responsavelFechamento String
  observacoesEncerramento String?
  itensFinais           String?  // JSON
  anexosFinais          String?  // JSON com referências aos anexos
  logsEtapas            String?  // JSON com histórico completo
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt

  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  placement Placement @relation(fields: [placementId], references: [id], onDelete: Cascade)
  implantacao Implantacao?
}
```

---

### 3. MÓDULO: Implantação (Expansão)

#### Alterações no Modelo: `Implantacao`

```prisma
model Implantacao {
  // ... campos existentes ...
  
  // NOVOS CAMPOS:
  solicitacaoId        String?  @unique // ID da solicitação (se veio direto da solicitação)
  demandaId            String?  @unique // ID da demanda relacionada (se veio do Placement)
  statusTriagem        String?  // "PENDENTE", "APROVADO", "REJEITADO", "SOLICITAR_INFO"
  gestorTriagemId      String?  // ID do gestor que fez a triagem
  dataTriagem          DateTime?
  observacoesTriagem   String?
  responsavelImplantacao String? // Nome do responsável pela implantação
  dataConclusao        DateTime? // Data de conclusão
  evidencias           String?  // JSON com evidências
  itensImplantados     String?  // JSON com itens implantados
  validacaoDemandante  String?  // "APROVADO", "PENDENTE", "REJEITADO"
  
  // ... relações existentes ...
  solicitacao          Solicitacao? @relation(fields: [solicitacaoId], references: [id], onDelete: SetNull)
  demanda              Demanda? @relation(fields: [demandaId], references: [id], onDelete: SetNull)
  historico            HistoricoImplantacao[]
  
  // OBSERVAÇÃO: Após finalizar, os dados são consolidados na Apólice (módulo final)
}
```

#### Modelo: `HistoricoImplantacao`

```prisma
model HistoricoImplantacao {
  id            String   @id @default(uuid())
  tenantId      String
  implantacaoId String
  acao          String   // "APROVADO_TRIAGEM", "REJEITADO_TRIAGEM", "INICIADO", "CONCLUIDO", etc
  usuarioId     String?
  observacoes   String?
  dadosAnteriores String?
  dadosNovos    String?
  createdAt     DateTime @default(now())

  tenant      Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  implantacao Implantacao @relation(fields: [implantacaoId], references: [id], onDelete: Cascade)
  usuario     User?       @relation("HistoricoImplantacoes", fields: [usuarioId], references: [id], onDelete: SetNull)
}
```

---

## 🔄 Fluxos de Trabalho

### Fluxo 0: Questionamentos Prévios (Antes do Formulário)

**Antes de carregar o formulário de abertura**, o sistema deve apresentar questionamentos para:

#### Para Placement:
- [ ] Definir perguntas específicas para Placement
- [ ] Coletar informações preliminares
- [ ] Determinar se precisa de apólice ou não
- [ ] Identificar tipo de cotação necessária

#### Para Implantação:
- [ ] Definir perguntas específicas para Implantação
- [ ] Identificar se é Nomeação ou Nova Apólice
- [ ] Coletar informações preliminares sobre a necessidade
- [ ] Determinar se já existe apólice ou precisa criar

**Após responder os questionamentos:**
- Sistema direciona para o formulário apropriado
- Formulário já vem pré-preenchido com informações dos questionamentos
- Usuário completa os campos restantes

### Fluxo 1: Solicitação → Placement OU Implantação

1. **Solicitante** (perfil Relacionamento) responde questionamentos prévios
2. Sistema carrega formulário baseado nas respostas
3. **Solicitante** preenche o formulário de abertura:
   - **Campos obrigatórios**: Tipo (PLACEMENT ou IMPLANTACAO), Descrição, Solicitante
   - **Se tipo = IMPLANTACAO**: 
     - Deve escolher **Tipo de Implantação**: NOMEACAO ou NOVA_APOLICE
     - **Se NOMEACAO**: Apólice é obrigatória (implantação em apólice existente)
     - **Se NOVA_APOLICE**: Apólice é opcional (vai criar nova apólice durante implantação)
   - **Se tipo = PLACEMENT**: Apólice é opcional
   - **Campos opcionais**: Itens/serviços, Anexos, Observações, Nível de urgência, Prazo desejado
2. Sistema gera ID da solicitação automaticamente (SOL-000001)
3. **Se tipo = PLACEMENT**: 
   - Solicitação é **automaticamente enviada** para Placement → Triagem
   - Se não tiver apólice, pode criar durante o processo
4. **Se tipo = IMPLANTACAO**: 
   - Solicitação é **automaticamente enviada** para Implantação → Triagem
   - **Se NOMEACAO**: Deve ter apólice vinculada (obrigatório)
   - **Se NOVA_APOLICE**: Pode criar apólice durante o processo de implantação
5. **Gestor** (Placement ou Implantação) avalia na coluna Triagem:
   - Aprovar → vai para "Em andamento"
   - Rejeitar → retorna ao solicitante
   - Solicitar mais informações → notifica solicitante

### Fluxo 1.1: Solicitação → Placement

1. **Solicitante** cria solicitação (tipo: PLACEMENT)
2. Sistema gera ID da solicitação (SOL-000001)
3. Solicitação é **automaticamente enviada** para Placement → Triagem
4. **Gestor Placement** avalia na coluna Triagem:
   - Aprovar → vai para "Em andamento" (submódulo Gestão)
   - Rejeitar → retorna ao solicitante
   - Solicitar mais informações → notifica solicitante

### Fluxo 2: Placement - Gestão (Kanban)

**Coluna: Triagem**
- Recebe solicitações aprovadas
- Gestor pode delegar para analista

**Coluna: Em Andamento**
- Lista de placements em cotação
- Analistas trabalham nas cotações

**Coluna: Entregue**
- Cotações finalizadas
- Solicitante pode:
  - Aprovar → processo encerrado (vai para Demandas)
  - Solicitar Repique → retorna para "Fila de Processos - Entrada"

### Fluxo 3: Placement - Fila de Processos

**Coluna: Entrada**
- Processos delegados pelo gestor
- Processos devolvidos (Repique)
- Analista assume o processo

**Coluna: Em Andamento**
- Analista trabalha na cotação
- Após finalizar → envia para "Entregue" (submódulo Gestão)

### Fluxo 4: Placement - Demandas

- Armazena placements com status FECHADO
- Campos obrigatórios ao fechar:
  - Data do fechamento
  - Responsável
  - Observações
  - Itens finais
  - Documentos anexos finais
- Após fechar → **automaticamente cria Implantação** (que será vinculada à Apólice)

### Fluxo 5: Implantação - Triagem

1. Recebe demandas fechadas do Placement
2. **Gestor Implantação** avalia na coluna Triagem:
   - Aprovar → vai para "Em andamento"
   - Rejeitar → notifica
   - Solicitar mais informações

### Fluxo 6: Implantação - Execução

**Coluna: Em Andamento**
- Projetos sendo executados
- Registro de dados técnicos e recursos

**Coluna: Finalizado**
- Implantação concluída
- Campos obrigatórios:
  - Responsável pela implantação
  - Data de conclusão
  - Evidências
  - Itens implantados
  - Validação do demandante
- **Após finalizar → dados são consolidados na Apólice** (módulo final)

---

## 📊 Estrutura de Rotas Backend

### Solicitações
```
GET    /solicitacoes                      - Listar solicitações
GET    /solicitacoes/:id                  - Buscar solicitação
POST   /solicitacoes                      - Criar solicitação
PUT    /solicitacoes/:id                  - Atualizar solicitação
DELETE /solicitacoes/:id                  - Excluir solicitação
GET    /solicitacoes/:id/historico         - Histórico da solicitação
POST   /solicitacoes/:id/anexos           - Upload de anexos
GET    /solicitacoes/questionarios/placement - Obter questionários para Placement
GET    /solicitacoes/questionarios/implantacao - Obter questionários para Implantação
POST   /solicitacoes/pre-processar        - Processar respostas do questionário e retornar dados pré-preenchidos
```

### Placement - Gestão
```
GET    /placements/gestao              - Listar placements (Kanban)
GET    /placements/gestao/:id          - Buscar placement
PUT    /placements/gestao/:id/triagem  - Ações de triagem (aprovar/rejeitar)
PUT    /placements/gestao/:id/entregue - Ações de entrega (aprovar/repique)
GET    /placements/gestao/:id/historico - Histórico
```

### Placement - Fila de Processos
```
GET    /placements/fila              - Listar fila (Entrada/Em Andamento)
POST   /placements/fila/:id/assumir  - Analista assume processo
PUT    /placements/fila/:id/finalizar - Finalizar cotação
```

### Placement - Demandas
```
GET    /placements/demandas          - Listar demandas
GET    /placements/demandas/:id      - Buscar demanda
POST   /placements/demandas/:id/fechar - Fechar demanda (cria implantação)
```

### Implantação (Expandido)
```
GET    /implantacoes/triagem         - Listar em triagem
PUT    /implantacoes/:id/triagem     - Ações de triagem
PUT    /implantacoes/:id/finalizar   - Finalizar implantação
GET    /implantacoes/:id/historico   - Histórico
```

---

## 🎨 Estrutura Frontend

### ⚠️ IMPORTANTE: Manter Template do Módulo Apólice

**Todos os novos módulos devem seguir o mesmo template visual do módulo de Apólice:**

#### Padrões Visuais a Manter:

1. **Estrutura de Páginas:**
   - Mesmo layout com `page-header` (título + botões de ação)
   - Mesma estrutura de tabs (se aplicável)
   - Mesmo sistema de cards/containers com `border-radius: 12px` e `box-shadow`

2. **Sistema de Grid:**
   - Usar o mesmo sistema de grid de 6 colunas do `ApoliceDetalhes.css`
   - Campos pequenos: `span 2` (3 por linha)
   - Campos normais: `span 3` (2 por linha)
   - Campos full-width: `span 6` (1 por linha)
   - Responsivo: 2 colunas em telas menores

3. **Componentes Visuais:**
   - Mesmos botões (`btn`, `btn-primary`, `btn-outline`)
   - Mesmos inputs (`input` com mesmo estilo)
   - Mesmos badges de status (`status-badge` com cores padronizadas)
   - Mesmas tabelas (`data-table` com header `#00225f`)
   - Mesmos modais (usar componente `Modal` existente)

4. **Cores e Identidade Visual:**
   - Vermelho Escuro/Borgonha (`#a42340`) - Ações primárias
   - Verde-água/Teal (`#3d9b8e`) - Ações secundárias
   - Azul Escuro (`#00225f`) - Headers, navegação
   - Branco (`#ffffff`) - Backgrounds
   - Cinza Claro (`#f5f5f5`) - Backgrounds alternativos

5. **Tipografia:**
   - Fonte Inter (mesma do sistema)
   - Tamanhos: 14px (texto), 18px (títulos de seção), 24px (títulos principais)
   - Pesos: 500 (labels), 600 (títulos)

6. **Espaçamentos:**
   - Padding padrão: 24px
   - Gaps: 20px (grid), 12px (botões), 8px (form groups)
   - Margins: 24px entre seções

7. **Animações:**
   - `fadeIn` para transições de conteúdo
   - Transições suaves (0.2s) em hover

#### Arquivos CSS de Referência:
- `frontend/src/pages/ApoliceDetalhes.css` - Template principal
- `frontend/src/pages/Apolices.css` - Listagem
- `frontend/src/components/Form.css` - Formulários
- `frontend/src/index.css` - Variáveis CSS globais

#### Componentes Reutilizáveis:
- `Modal` - Para modais
- `SearchableSelect` - Para selects pesquisáveis
- `Layout` - Layout principal com sidebar
- Formulários seguindo padrão `Form.css`

### Páginas Necessárias

1. **Solicitações**
   - `pages/Solicitacoes.tsx` - Listagem
   - `pages/SolicitacaoDetalhes.tsx` - Detalhes e histórico
   - `pages/SolicitacaoQuestionario.tsx` - Questionamentos prévios (antes do formulário)
   - `components/SolicitacaoForm.tsx` - Formulário de abertura
   - `components/PlacementQuestionario.tsx` - Questionamentos específicos para Placement
   - `components/ImplantacaoQuestionario.tsx` - Questionamentos específicos para Implantação

2. **Placement - Gestão**
   - `pages/PlacementGestao.tsx` - Kanban (Triagem, Em Andamento, Entregue)

3. **Placement - Fila de Processos**
   - `pages/PlacementFila.tsx` - Kanban (Entrada, Em Andamento)

4. **Placement - Demandas**
   - `pages/PlacementDemandas.tsx` - Listagem e fechamento

5. **Implantação (Expandido)**
   - `pages/Implantacoes.tsx` - Atualizar com Kanban (Triagem, Em Andamento, Finalizado)
   - `pages/ImplantacaoDetalhes.tsx` - Detalhes expandidos

### Componentes Necessários

- `components/KanbanBoard.tsx` - Componente genérico de Kanban
- `components/KanbanColumn.tsx` - Coluna do Kanban
- `components/KanbanCard.tsx` - Card do Kanban
- `components/HistoricoTimeline.tsx` - Timeline de histórico
- `components/AnexosList.tsx` - Lista de anexos
- `components/PlacementForm.tsx` - Formulário de placement
- `components/ItemPlacementForm.tsx` - Formulário de itens
- `components/QuestionarioWizard.tsx` - Wizard de questionamentos prévios
- `components/PlacementQuestionario.tsx` - Questionamentos para Placement
- `components/ImplantacaoQuestionario.tsx` - Questionamentos para Implantação

---

## 🔐 Perfis de Usuário

### Perfil: Relacionamento (Solicitante)
- Pode criar solicitações
- Pode visualizar suas solicitações
- Pode aprovar/rejeitar cotações entregues
- Pode solicitar repique

### Perfil: Gestor Placement
- Acesso ao submódulo Gestão
- Pode aprovar/rejeitar na triagem
- Pode delegar processos
- Pode visualizar todas as colunas

### Perfil: Analista Placement
- Acesso ao submódulo Fila de Processos
- Pode assumir processos
- Pode finalizar cotações
- Pode visualizar processos atribuídos

### Perfil: Gestor Implantação
- Acesso ao módulo Implantação
- Pode aprovar/rejeitar na triagem
- Pode visualizar todas as implantações

---

## 📝 Observações Importantes

1. **Questionamentos Prévios**: Antes de carregar o formulário, o sistema deve apresentar questionamentos específicos para Placement e Implantação
2. **Fluxo de Questionários**: Questionários → Respostas → Formulário pré-preenchido → Submissão
3. **Histórico Completo**: Todas as ações devem ser registradas no histórico
4. **Anexos**: Devem seguir o processo até o fim (solicitação → placement → demanda → implantação → apólice)
5. **Filtros**: Cada submódulo deve ter filtros por status, solicitante, analista, data, tipo
6. **IDs Sequenciais**: Solicitações e Placements devem ter IDs sequenciais (SOL-000001, PL-000001)
7. **Integração**: O módulo de Implantação existente deve ser expandido, não recriado
8. **Auditoria**: Todas as mudanças de status devem registrar quem fez e quando
9. **Destino Final**: O destino final de ambos os fluxos (Placement e Implantação direta) é o **módulo Apólice**, onde os dados são consolidados
10. **Campos de Abertura**:
   - **Placement**: Apólice opcional, foco em itens para cotação
   - **Implantação - Nomeação**: Apólice obrigatória, foco em implantação em apólice existente
   - **Implantação - Nova Apólice**: Apólice opcional, foco em criar nova apólice durante implantação
11. **Validação**: 
   - Ao criar solicitação tipo IMPLANTACAO, validar se tipoImplantacao foi informado
   - Se tipoImplantacao = NOMEACAO, validar se apólice foi informada (obrigatório)
   - Se tipoImplantacao = NOVA_APOLICE, apólice é opcional
12. **Questionários**: Os questionários devem ser configuráveis e podem variar conforme o tipo de solicitação
13. **Template Visual**: **CRÍTICO** - Todos os novos módulos devem seguir o mesmo template visual do módulo de Apólice:
    - Mesmo sistema de grid (6 colunas)
    - Mesmas cores e identidade visual
    - Mesmos componentes (botões, inputs, tabelas, modais)
    - Mesma estrutura de páginas (header, tabs, cards)
    - Mesma tipografia e espaçamentos
    - Mesma responsividade

---

## ✅ Checklist de Implementação

### Backend
- [ ] Criar modelos Prisma (Solicitacao, Placement, ItemPlacement, etc)
- [ ] Criar migration
- [ ] Criar rotas de Solicitações
- [ ] Criar rotas de Questionários (Placement e Implantação)
- [ ] Criar rotas de Placement (Gestão, Fila, Demandas)
- [ ] Expandir rotas de Implantação
- [ ] Implementar lógica de histórico
- [ ] Implementar upload de anexos
- [ ] Implementar geração de IDs sequenciais
- [ ] Implementar lógica de pré-processamento de questionários

### Frontend
- [ ] **Manter template visual do módulo Apólice** (CRÍTICO)
- [ ] Criar página de Solicitações (seguindo `ApoliceDetalhes.css`)
- [ ] Criar página de Questionários Prévios (SolicitacaoQuestionario.tsx)
- [ ] Criar componentes de questionários (Placement e Implantação)
- [ ] Criar páginas de Placement (Gestão, Fila, Demandas) - usar mesmo grid system
- [ ] Expandir página de Implantações - manter consistência visual
- [ ] Criar componente Kanban genérico (seguindo padrões visuais)
- [ ] Criar componentes de histórico (timeline seguindo padrão)
- [ ] Criar formulários necessários (usar `Form.css` como base)
- [ ] Implementar filtros (mesmo estilo de inputs)
- [ ] Implementar fluxo: Questionários → Formulário pré-preenchido
- [ ] Garantir responsividade (mesmo breakpoint: 1200px)
- [ ] Usar mesmas cores e variáveis CSS
- [ ] Atualizar rotas no App.tsx

### Integração
- [ ] Testar fluxo completo Solicitação → Placement → Demanda → Implantação
- [ ] Validar histórico em todas as etapas
- [ ] Validar anexos em todas as etapas
- [ ] Testar permissões por perfil

---

## 🚀 Próximos Passos

1. Revisar e aprovar esta análise
2. Criar migration do Prisma
3. Implementar backend (rotas e lógica)
4. Implementar frontend (páginas e componentes)
5. Testes de integração
6. Documentação final

