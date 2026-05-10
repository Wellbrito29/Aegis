# Tech Brief

**Command:** `/aegis-tech-brief`
**Phase:** Forward — between Requirements and Doubt
**Status:** Optional

---

## 🛠️ The technical translator

A translator that takes a story written in business language and rewrites it for the tech lead, anchored on the project's architecture and business rules. Doesn't decompose, doesn't decide, doesn't create ADRs — just translates and signals.

---

## What it does

Tech Brief reads the `requirements.md` produced by `/aegis-requirements` (still in business language) and converts it into a `tech-brief.md` the tech lead reviews before planning. The brief answers four questions:

- Which modules will this feature touch?
- Which contracts (functions, interfaces, exports) change?
- Which business rules apply to this feature?
- What technical decisions does the tech lead need to make?

It does not write tasks (that's `/aegis-plan` and `/aegis-to-do`), does not deepen ambiguities (that's `/aegis-doubt`), and does not create ADRs — it only flags decisions that deserve one.

---

## What it reads

- `<feature-dir>/requirements.md` — the business story
- `aegis/migration/target_business_rules.md` (Migration Team) **or** `aegis/specs/business-rules.md` (greenfield)
- `aegis/architecture/architecture.md`, `c4-*.md`, `erd-complete.md`
- `aegis/runtime/context/surface.json` — module list
- `aegis/runtime/context/graph.json` — symbols, calls

If no business rules file exists, Tech Brief blocks execution. The brief loses value without rules to anchor on.

---

## What it produces

| File | Content |
|------|---------|
| `<feature-dir>/tech-brief.md` | Technical brief for the tech lead |

The brief has eight sections:

1. **Technical summary** — one paragraph translating the business goal into a technical problem
2. **Affected modules** — paths from `surface.json`
3. **Contracts touched** — functions/interfaces with `file:line` from `graph.json`
4. **Applicable business rules** — copied verbatim with anchor links
5. **Attention points** — up to 5 technical risks
6. **ADR signals** — decisions that deserve an Architecture Decision Record (tech lead creates them separately)
7. **Questions for the tech lead** — up to 3 binary or short-answer decisions
8. **Decision** — checkboxes the tech lead marks: approve / refine / block

---

## When to use

After `/aegis-requirements` produces the `requirements.md`, before `/aegis-doubt` or `/aegis-plan`. Skip it on greenfield trivial features that don't yet have business rules — but in that case consider authoring `aegis/specs/business-rules.md` first.

```
/aegis-tech-brief
```

The skill never auto-chains; it suggests the next step (`/aegis-doubt` or `/aegis-plan`) and waits for the user.
