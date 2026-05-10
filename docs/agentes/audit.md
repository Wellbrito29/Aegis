# Audit

**Command:** `/aegis-audit`
**Phase:** Forward — optional review pass
**Status:** Optional

---

## 🔍 The strict auditor

Read-only audit. Cross-checks `requirements.md`, `roadmap.md`, and `actions.md` for the active feature, reports inconsistencies with severity (CRITICAL, HIGH, MEDIUM, LOW). Never edits the audited artifacts.

---

## What it does

Audit looks for contradictions, missing coverage, and traceability gaps across the three core documents of the feature: requirements (the "what"), roadmap (the "how"), and actions (the "execute"). Each finding gets a severity tag and a suggested remediation. The human resolves — Audit only reports.

Severity scale:
- **CRITICAL** — requirement with no roadmap coverage, action contradicting roadmap
- **HIGH** — vague action, missing dependency
- **MEDIUM** — naming inconsistency, redundant step
- **LOW** — cosmetic / style

---

## What it reads

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — current feature pointer
- `<feature-dir>/requirements.md`, `roadmap.md`, `actions.md`
- `aegis/runtime/hooks.yml` — `before-audit` and `after-audit` hooks

---

## What it produces

| File | Content |
|------|---------|
| `<feature-dir>/audit.md` | Findings list grouped by severity, each with location and suggested remediation |

---

## When to use

Between `/aegis-to-do` and `/aegis-coding`, when you want a sanity check before implementing. Or after `/aegis-plan` if the roadmap looks fragile.

```
/aegis-audit
```

Manual invocation. Read-only — never modifies the source documents.
