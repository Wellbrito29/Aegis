# To-Do

**Comando:** `/aegis-to-do`
**Fase:** Forward — quarto skill do ciclo
**Status:** Obrigatório para avançar pra coding

---

## ✅ O decompositor

Decompõe o `roadmap.md` em ações atômicas com IDs sequenciais, dependências explícitas e marcador de execução paralela. Produz o `actions.md` que o skill Coding executa linha a linha.

---

## O que faz

O To-Do lê o roadmap e quebra em menor unidade de trabalho que pode ser executada e verificada independentemente. Cada ação ganha ID estável (`A001`, `A002`, ...), checkbox aberto `[ ]`, dependências de IDs anteriores e marcador indicando se pode rodar em paralelo com irmãs.

A saída é propositalmente executável — humanos (ou o Coding) andam de cima pra baixo, marcando ações concluídas conforme avançam.

---

## O que lê

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature ativa
- `<feature-dir>/roadmap.md` — o plano de origem
- `<feature-dir>/data-delta.md`, `interfaces.md` — contexto pra decomposição
- `aegis/runtime/hooks.yml` — ganchos `before-to-do` e `after-to-do`

---

## O que produz

| Arquivo | Conteúdo |
|---------|----------|
| `<feature-dir>/actions.md` | Ações atômicas numeradas com IDs, dependências, marcador de paralelismo e checkboxes abertos |

---

## Quando usar

Depois do `/aegis-plan` produzir o roadmap.

```
/aegis-to-do
```

Invocação manual. Sugere `/aegis-coding` (ou `/aegis-audit` / `/aegis-quality` se quiser revisão).
