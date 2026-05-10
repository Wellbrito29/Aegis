# Tech Brief

**Comando:** `/aegis-tech-brief`
**Fase:** Forward — entre Requirements e Doubt
**Status:** Opcional

---

## 🛠️ O tradutor técnico

Um tradutor que pega uma história escrita em linguagem de negócio e reescreve para o tech lead, ancorando na arquitetura e nas regras de negócio do projeto. Não decompõe, não decide, não cria ADR — apenas traduz e sinaliza.

---

## O que faz

O Tech Brief lê o `requirements.md` produzido pelo `/aegis-requirements` (ainda em linguagem de negócio) e converte em um `tech-brief.md` que o tech lead revisa antes do planejamento. O brief responde quatro perguntas:

- Quais módulos essa feature vai tocar?
- Quais contratos (funções, interfaces, exports) mudam?
- Quais regras de negócio se aplicam a essa feature?
- Quais decisões técnicas o tech lead precisa tomar?

Não escreve tasks (isso é `/aegis-plan` e `/aegis-to-do`), não aprofunda ambiguidades (isso é `/aegis-doubt`) e não cria ADR — apenas sinaliza decisões que merecem um.

---

## O que lê

- `<feature-dir>/requirements.md` — a história business
- `aegis/migration/target_business_rules.md` (Time de Migração) **ou** `aegis/specs/business-rules.md` (greenfield)
- `aegis/architecture/architecture.md`, `c4-*.md`, `erd-complete.md`
- `aegis/runtime/context/surface.json` — lista de módulos
- `aegis/runtime/context/graph.json` — símbolos, calls

Se não existir arquivo de regras de negócio, o Tech Brief bloqueia execução. O brief perde valor sem regras pra ancorar.

---

## O que produz

| Arquivo | Conteúdo |
|---------|----------|
| `<feature-dir>/tech-brief.md` | Brief técnico para o tech lead |

O brief tem oito seções:

1. **Resumo técnico** — um parágrafo traduzindo o objetivo de negócio em problema técnico
2. **Módulos afetados** — paths do `surface.json`
3. **Contratos tocados** — funções/interfaces com `arquivo:linha` do `graph.json`
4. **Regras de negócio aplicáveis** — copiadas literalmente com link de âncora
5. **Pontos de atenção** — até 5 riscos técnicos
6. **Sinalizações de ADR** — decisões que merecem Architecture Decision Record (tech lead cria à parte)
7. **Perguntas pro tech lead** — até 3 decisões binárias ou de resposta curta
8. **Decisão** — checkboxes que o tech lead marca: aprovar / refinar / bloquear

---

## Quando usar

Depois do `/aegis-requirements` produzir o `requirements.md`, antes do `/aegis-doubt` ou `/aegis-plan`. Pule em features trivial greenfield sem regras de negócio — mas nesse caso considere criar `aegis/specs/business-rules.md` antes.

```
/aegis-tech-brief
```

O skill nunca encadeia auto; sugere o próximo passo (`/aegis-doubt` ou `/aegis-plan`) e aguarda o usuário.
