# Resume

**Comando:** `/aegis-resume`
**Fase:** Forward — fora do ciclo, troca a feature ativa
**Status:** Opcional

---

## ⏯️ O retomador

Retoma uma feature pausada (listada em `paused-features` do `active-requirements.json`) e a torna ativa. Não cria features novas — apenas troca a ativa pela escolhida e (quando faz sentido) move a ativa anterior pra `paused-features`.

---

## O que faz

O Resume é o skill de troca de contexto. Quando você está malabarando múltiplas features e quer voltar pra uma pausada sem perder o estado atual, o Resume:

1. Lê `active-requirements.json` e lista `paused-features`
2. Pergunta qual feature pausada retomar
3. Move a ativa atual pra `paused-features` (a menos que o usuário descarte)
4. Promove a feature escolhida pra ativa
5. Relê os artefatos físicos dela pra que skills seguintes saibam o estágio correto

Não modifica conteúdo de pasta de feature — apenas o ponteiro em `active-requirements.json`.

---

## O que lê

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — `feature-dir` e lista `paused-features`

---

## O que produz

| Arquivo | Conteúdo |
|---------|----------|
| `aegis/config/active-requirements.json` | Atualizado in-place — `feature-dir` trocado, `paused-features` ajustado |

---

## Quando usar

Quando há uma ou mais features pausadas em `paused-features` e você quer trocar de contexto para uma delas.

```
/aegis-resume
```

Invocação manual. Pergunta ao usuário qual escolher da lista de pausadas.
