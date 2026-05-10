# Quality

**Comando:** `/aegis-quality`
**Fase:** Forward — passe de revisão opcional
**Status:** Opcional

---

## ✒️ O revisor textual

Audita a clareza textual do `requirements.md` da feature ativa. Checa se a prosa está boa o bastante pra virar plano e código sem retrabalho. Leitor — só escreve o relatório de auditoria.

Importante: **não** é auditoria de testes/implementação. O Quality olha linguagem, não testes.

---

## O que faz

O Quality lê `requirements.md` e sinaliza problemas de escrita que causariam retrabalho na frente: frases ambíguas, siglas sem definição, cláusulas contraditórias, critério de aceitação mal redigido, quantificadores vagos ("rápido", "muitos", "depois"). Cada achado vem com localização e sugestão de reescrita.

O skill nunca modifica o requirements — o humano (ou outro skill) decide se aplica as sugestões.

---

## O que lê

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature ativa
- `<feature-dir>/requirements.md` — documento em revisão
- `aegis/runtime/hooks.yml` — ganchos `before-quality` e `after-quality`

---

## O que produz

| Arquivo | Conteúdo |
|---------|----------|
| `<feature-dir>/quality.md` | Lista de achados com localização, severidade e sugestão de reescrita |

---

## Quando usar

Entre `/aegis-requirements` (ou `/aegis-doubt`) e `/aegis-plan`, quando quiser garantir que o requirements está pronto pra planejamento.

```
/aegis-quality
```

Invocação manual. Leitor — nunca modifica o requirements.
