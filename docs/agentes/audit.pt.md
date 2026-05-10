# Audit

**Comando:** `/aegis-audit`
**Fase:** Forward — passe de revisão opcional
**Status:** Opcional

---

## 🔍 O auditor estrito

Auditoria leitora. Cruza `requirements.md`, `roadmap.md` e `actions.md` da feature ativa em busca de inconsistências, reporta com severidade (CRITICAL, HIGH, MEDIUM, LOW). Nunca edita os artefatos auditados.

---

## O que faz

O Audit procura contradições, falta de cobertura e gaps de rastreabilidade entre os três documentos centrais da feature: requirements (o "o quê"), roadmap (o "como") e actions (o "executar"). Cada achado ganha tag de severidade e sugestão de remediação. O humano resolve — Audit só reporta.

Escala de severidade:
- **CRITICAL** — requisito sem cobertura no roadmap, ação contradizendo roadmap
- **HIGH** — ação vaga, dependência faltando
- **MEDIUM** — inconsistência de nomes, passo redundante
- **LOW** — cosmético / estilo

---

## O que lê

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature ativa
- `<feature-dir>/requirements.md`, `roadmap.md`, `actions.md`
- `aegis/runtime/hooks.yml` — ganchos `before-audit` e `after-audit`

---

## O que produz

| Arquivo | Conteúdo |
|---------|----------|
| `<feature-dir>/audit.md` | Lista de achados agrupados por severidade, cada um com localização e sugestão de remediação |

---

## Quando usar

Entre `/aegis-to-do` e `/aegis-coding`, quando quiser sanity check antes de implementar. Ou depois do `/aegis-plan` se o roadmap parecer frágil.

```
/aegis-audit
```

Invocação manual. Leitor — nunca modifica documentos de origem.
