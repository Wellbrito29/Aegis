# Quality

**Command:** `/aegis-quality`
**Phase:** Forward — optional review pass
**Status:** Optional

---

## ✒️ The textual reviewer

Audits the textual clarity of the active feature's `requirements.md`. Checks whether the prose is good enough to turn into a plan and code without rework. Read-only — only writes the audit report.

Important: this is **not** test/implementation auditing. Quality looks at language, not tests.

---

## What it does

Quality reads `requirements.md` and flags writing problems that would cause downstream rework: ambiguous phrasing, undefined acronyms, contradictory clauses, missing acceptance criteria phrasing, vague quantifiers ("fast", "many", "later"). Each finding is reported with location and suggested rephrase.

The skill never modifies the requirements — the human (or another skill) decides whether to apply the suggestions.

---

## What it reads

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — current feature pointer
- `<feature-dir>/requirements.md` — document under review
- `aegis/runtime/hooks.yml` — `before-quality` and `after-quality` hooks

---

## What it produces

| File | Content |
|------|---------|
| `<feature-dir>/quality.md` | Findings list with location, severity, and suggested rephrase |

---

## When to use

Between `/aegis-requirements` (or `/aegis-doubt`) and `/aegis-plan`, when you want to make sure the requirements is plan-ready.

```
/aegis-quality
```

Manual invocation. Read-only — never modifies the requirements.
