# Desenvolvendo com as specs

Depois que o Aegis Spec gerou todas as specs em `aegis/`, você pode copiar esses arquivos para qualquer máquina e começar a construir o sistema do zero. Veja a ordem recomendada.

---

## Antes de escrever uma linha de código

Comece lendo esses três arquivos:

| Arquivo | Por que ler primeiro |
|---|---|
| `aegis/confidence-report.md` | Mostra o que tem alta confiança (verde) vs. lacunas (vermelho). Evita implementar algo baseado em inferência errada. |
| `aegis/gaps.md` | Lista o que o Aegis Spec não conseguiu determinar. Preencha manualmente antes de começar. |
| `aegis/architecture.md` + diagramas C4 | Mostra a visão macro: camadas, módulos, fronteiras do sistema. |

---

## Ordem de implementação (bottom-up)

```
1. database/  +  erd-complete.md                  (estrutura de dados, migrations)
2. domain.md  +  <unit>/ das entidades core       (regras de negócio centrais: leia requirements.md, design.md, tasks.md de cada unit)
3. <unit>/ dos serviços ordenados por dependência (use dependencies.md como guia)
4. openapi/   +  contratos de API                 (se houver)
5. ui/                                            (camada de apresentação por último)
```

---

## Qual unit vem primeiro

Abra `aegis/traceability/code-spec-matrix.md`. Ele lista cada unit e suas dependências.

Implemente primeiro as units que não dependem de nenhuma outra (folhas da árvore de dependências), e suba em direção às units que integram múltiplos componentes.

---

## Mantendo a rastreabilidade durante o desenvolvimento

Use a `aegis/traceability/code-spec-matrix.md` como referência durante o desenvolvimento para saber qual trecho de código implementado corresponde a qual spec. Isso mantém a rastreabilidade precisa conforme o código cresce.

---

## Veja também

- [Saídas geradas](saidas/index.md): lista completa dos arquivos produzidos pelo Aegis Spec
- [Escala de confiança](escala-confianca.md): como interpretar os marcadores 🟢🟡🔴 nas specs
