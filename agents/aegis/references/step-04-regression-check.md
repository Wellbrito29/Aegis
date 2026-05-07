# Passo 4, verificação de regressão semântica

> Este passo só roda em **re-extrações**, ou seja, quando uma pipeline de descoberta é executada num projeto que já passou por pelo menos um ciclo `/aegis-coding`. Em projetos sem `aegis/forward/` ou sem `regression-watch.md`, este passo é silenciosamente pulado.

## Por que existe

O Aegis Spec não é só extração one-shot. Cada `/aegis-coding` deixa em `aegis/forward/<feature>/regression-watch.md` uma lista de regras que precisam continuar verdadeiras na próxima extração. A pipeline de descoberta, ao re-rodar, tem o dever de checar essas regras contra o código atual e reportar regressões. Esse é o diferencial competitivo do Aegis Spec frente a frameworks forward puros.

## Quando rodar

Após o **último agente do plano** concluir, antes da mensagem final de "extração concluída". O gatilho é posição (último item de `aegis/plan.md`), não nome de agente, porque o último agente varia conforme os opcionais selecionados no install (Reviewer pode estar ausente, por exemplo). Faça os checks na ordem:

1. Verifique se `aegis/forward/` existe na raiz do projeto. Se não existir, encerre este passo silenciosamente.
2. Liste todas as subpastas de `aegis/forward/` que contêm `regression-watch.md`.
3. Se a lista estiver vazia, encerre.
4. Caso contrário, prossiga com o procedimento abaixo, uma feature por vez.

## Procedimento por feature

Para cada `aegis/forward/<feature>/regression-watch.md`:

1. Carregue o arquivo. Identifique a tabela principal de watch items (colunas `ID | Origem | Regra esperada após mudança | Tipo de verificação | Sinal de violação`).
2. Para cada watch item da tabela principal (não os arquivados):
   2.1. Identifique o `Tipo de verificação`, valores possíveis: `presença`, `ausência`, `redação`, `confidência`.
   2.2. Aplique a verificação correspondente contra os artefatos recém-gerados em `aegis/`:
        - `presença`: a regra precisa estar presente em `aegis/reports/domain.md` (ou no arquivo apontado pela coluna Origem) com a mesma essência semântica.
        - `ausência`: a regra original NÃO pode mais aparecer no SDD.
        - `redação`: o texto foi alterado deliberadamente, verifique se a versão nova bate com a expectativa.
        - `confidência`: a regra continua presente, mas a confidência (🟢, 🟡, 🔴) deve ser igual ou maior à esperada.
   2.3. Atribua um veredito:
        - 🟢 **verde**, a expectativa bateu integralmente.
        - 🟡 **amarelo**, há equivalência semântica mas o texto difere, ou a evidência é parcial. Veredito padrão quando há ambiguidade. Aguarda julgamento humano.
        - 🔴 **vermelho**, a expectativa NÃO bateu. A regra confirmada antes virou regra ferida.
3. Após avaliar todos os watch items, atualize a seção `## Histórico de re-extrações` do mesmo `regression-watch.md` adicionando bloco datado:

```
### Re-extração YYYY-MM-DD HH:MM

| ID | Veredito | Observação |
|----|----------|------------|
| W001 | 🟢 verde | regra preservada em aegis/reports/domain.md#regra-X |
| W005 | 🔴 vermelho | regra removida do código atual; mudança não pretendida |
| W010 | 🟡 amarelo | texto equivalente mas difere literalmente; aguarda julgamento |
```

4. NÃO altere a tabela principal de watch items. NÃO recicle IDs. NÃO mova watch items para "Arquivadas" automaticamente.

5. Para cada watch item com três vereditos verdes consecutivos no histórico, e desde que `setup.json#watch.archive-after` permita, mova o item da tabela principal para a seção `## Arquivadas` no final do arquivo. Mantenha o ID original.

## Política de escrita

- Escrita atômica (tempfile mais rename) em `regression-watch.md`.
- Nunca reescreva ou apague entradas do histórico de re-extrações.
- O bloco novo de re-extração vai sempre no topo da seção `## Histórico de re-extrações` (ordem decrescente).

## Relatório ao usuário

Após percorrer todas as features, apresente:

1. Total de features verificadas
2. Total de watch items verificados
3. Quebra por veredito: verdes, amarelos, vermelhos
4. Lista detalhada dos vermelhos (ID, feature, regra, motivo da divergência)
5. Lista detalhada dos amarelos que pediram julgamento humano

Se houver pelo menos um vermelho, apresente um aviso destacado:

> 🔴 **Atenção**, foram detectadas **N regressões semânticas** em features previamente codadas. Revise antes de seguir.

Se a `setup.json#watch.block-on-red` for `true`, sugira ao usuário **não** prosseguir com novos `/aegis-requirements` até que cada vermelho seja triado. O Aegis Spec apenas alerta, jamais bloqueia automaticamente o fluxo do usuário.

## Caso especial, sem `aegis/`

Se durante o procedimento o `aegis/` não tiver os arquivos esperados (porque a re-extração foi parcial ou o nível de documentação foi reduzido), registre veredito 🟡 amarelo com observação `evidência ausente, aegis/<arquivo> não foi gerado nesta extração` e siga em frente.

## Lacuna conhecida

Equivalência semântica entre regra esperada e regra extraída é avaliação subjetiva. Quando tiver dúvida, prefira veredito amarelo. Veredito vermelho deve ser reservado para casos onde a regra simplesmente sumiu ou foi explicitamente contradita.
