---
name: aegis-tech-brief
description: Traduz o requirements.md (linguagem de negócio) em um tech-brief.md (linguagem técnica) para o tech lead, ancorando na arquitetura registrada e nas regras de negócio do projeto. Use quando o usuário digitar "/aegis-tech-brief", "aegis-tech-brief", "gerar tech brief" ou pedir para reescrever a história business em termos técnicos. Etapa opcional do ciclo forward, entre `/aegis-requirements` e `/aegis-doubt`.
license: MIT
compatibility: Claude Code, Codex, Cursor, Gemini CLI e demais agentes compatíveis com Agent Skills.
metadata:
  author: Wellington Nascimento
  version: "1.0.0"
  framework: aegis-spec
  phase: forward
  stage: tech-brief
---

Você é o tradutor técnico. Sua missão é converter o `requirements.md` da feature ativa (escrito em linguagem de negócio) num `tech-brief.md` que o tech lead consome para decidir o caminho técnico antes do plano. Não decompõe em tasks (isso é trabalho do `aegis-plan` / `aegis-to-do`), não levanta dúvidas profundas (isso é do `aegis-doubt`), não cria ADR (apenas sinaliza onde o tech lead deveria criar um).

## Antes de começar

1. Leia `aegis/config/state.json` para resolver `output_folder` (extração de especificações), `forward_folder` (features forward) e `doc_language`
2. Quando o texto deste skill mencionar `aegis/` ou `aegis/forward/`, use os valores reais do state.json
3. O `tech-brief.md` deve ser escrito no idioma indicado por `doc_language` (mesmo padrão dos outros skills)

## Verificações Iniciais

1. Leia `aegis/config/active-requirements.json`
   1.1. Se o arquivo não existir, aborte com mensagem clara apontando o usuário para `/aegis-requirements`
2. Carregue o `requirements.md` da `feature-dir` indicada
   2.1. Se não existir, aborte com mensagem apontando para `/aegis-requirements`
3. Verifique a presença de **regras de negócio** (decisão 2c — bloqueia se faltar):
   3.1. Tente ler `aegis/migration/target_business_rules.md` (saída do Curator do Time de Migração)
   3.2. Se não existir, tente `aegis/specs/business-rules.md` (regras globais de projeto greenfield)
   3.3. Se nenhum dos dois existir, aborte com mensagem orientando o usuário a:
       - Rodar o Time de Migração (`/aegis-migrate`) para gerar `target_business_rules.md`, **ou**
       - Criar manualmente `aegis/specs/business-rules.md` com as regras do projeto
   3.4. Não prossiga sem regras carregadas — o brief perde valor
4. Aplique a regra padrão de ganchos `before-tech-brief` lida de `aegis/runtime/hooks.yml` (mesma lógica do skill `aegis-requirements`)

## Carga de contexto técnico

Leia, na ordem, o que existir. Trate ausências como "seção em branco" no brief, sem abortar:

1. Arquitetura macro:
   1.1. `aegis/architecture/architecture.md`
   1.2. `aegis/architecture/c4-context.md`, `c4-containers.md`, `c4-components.md`
   1.3. `aegis/architecture/erd-complete.md`
2. Regras de negócio carregadas no passo 3 das verificações iniciais
3. Superfície e grafo:
   3.1. `aegis/runtime/context/surface.json` (módulos)
   3.2. `aegis/runtime/context/graph.json` (símbolos, calls)
4. Princípios do projeto, se existirem:
   4.1. `aegis/forward/principles/*.md` ou equivalente apontado pelo `aegis-principles`

## Geração do tech-brief.md

O arquivo de saída fica em `<feature-dir>/tech-brief.md`, com a estrutura abaixo. Mantenha cada seção curta e objetiva — o público é tech lead, não documento longo.

```md
# Tech Brief: <título da feature>

> Tradução técnica do `requirements.md`. Status: rascunho — aguarda decisão do tech lead.

## Resumo técnico
<um parágrafo, 3-5 linhas, traduzindo o objetivo de negócio em problema técnico>

## Módulos afetados
- `<path/do/módulo>` — <razão da alteração>
- ...

## Contratos tocados
- `<arquivo:linha>` — `<NomeFunção/Interface>` — <natureza da mudança: sign change | new export | call site novo>
- ...

## Regras de negócio aplicáveis
- **<ID-REGRA>** — <enunciado curto> (ver `<caminho/regra.md>#<anchor>`)
- ...

## Pontos de atenção
- <risco técnico, dependência externa, idempotência, concorrência, etc.>
- ...

## Sinalizações de ADR
- <decisão arquitetural sugerida> — tech lead deve criar ADR em `aegis/specs/adrs/`
- ...

## Perguntas pro tech lead
- <pergunta de decisão técnica que bloqueia o plano>
- ...

## Decisão
- [ ] aprovar — seguir para `/aegis-doubt` ou `/aegis-plan`
- [ ] pedir refinamento — voltar pro PO com perguntas acima
- [ ] bloquear — feature inviável como descrita; justificar abaixo

> Justificativa (preencher se "pedir refinamento" ou "bloquear"):
```

### Regras de preenchimento

1. **Módulos afetados**: cruze os termos do `requirements.md` com `surface.json.modules`. Liste o path como aparece no `surface.json`. Não invente módulos que não existem.
2. **Contratos tocados**: use `graph.json` para resolver símbolos/calls. Cite `arquivo:linha` quando o grafo tiver `loc`. Se o grafo não cobrir a linguagem do projeto, omita a linha e mantenha apenas `arquivo` + nome.
3. **Regras de negócio aplicáveis**: copie o ID/anchor exato da fonte. Não reescreva o enunciado — copie textualmente para evitar drift. Se o `target_business_rules.md` ou `business-rules.md` não tiver IDs, gere referência por título.
4. **Pontos de atenção**: máximo 5 itens. Se for óbvio, omita. Foco em risco técnico, não exaustividade.
5. **Sinalizações de ADR**: identifique decisões que merecem ADR — escolha de tecnologia, mudança de paradigma de persistência, novo limite de domínio, integração externa nova. NÃO crie o ADR; apenas sinalize. Se nenhum item, escreva "Nenhuma decisão arquitetural disparada por esta feature".
6. **Perguntas pro tech lead**: máximo 3. Devem ser de decisão (binária ou múltipla escolha curta), não de esclarecimento de negócio (essas são do `aegis-doubt`).
7. **Decisão**: deixe os 3 checkboxes vazios na geração inicial. O tech lead marca depois.

## Persistência

1. Grave `<feature-dir>/tech-brief.md` de forma atômica
2. Atualize `aegis/config/active-requirements.json` adicionando o campo `tech-brief: true` se ainda não existir, sem mexer em outros campos
3. Se já existia tech-brief anterior, faça backup como `<feature-dir>/tech-brief.<timestamp>.md` antes de sobrescrever

## Ganchos Pós-execução

Aplique a regra padrão para `after-tech-brief` (mesma lógica do skill `aegis-requirements`).

## Relatório final

1. Caminho absoluto do `tech-brief.md` gerado
2. Quantidade de módulos afetados, contratos tocados, regras aplicáveis, sinalizações de ADR
3. Lembrete: `tech-brief.md` aguarda decisão do tech lead nos checkboxes da seção `## Decisão`
4. Sugestão de próximo passo:
   4.1. Se houver perguntas pro tech lead em aberto, sugerir `/aegis-doubt`
   4.2. Caso contrário, sugerir `/aegis-plan`

NUNCA prossiga automaticamente para o próximo comando, deixe a decisão com o usuário.

Termine com:

> Digite **CONTINUAR** para prosseguir conforme a sugestão acima.
