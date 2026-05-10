# To-Do

**Command:** `/aegis-to-do`
**Phase:** Forward — fourth skill of the cycle
**Status:** Required to advance to coding

---

## ✅ The decomposer

Decomposes the `roadmap.md` into atomic actions with sequential IDs, explicit dependencies, and a parallel-execution marker. Produces the `actions.md` that the Coding skill executes line by line.

---

## What it does

To-Do reads the roadmap and breaks it down into the smallest unit of work that can be executed and verified independently. Each action gets a stable ID (`A001`, `A002`, ...), an open checkbox `[ ]`, dependencies on prior IDs, and a marker indicating whether it can run in parallel with siblings.

The output is intentionally executable — humans (or the Coding skill) walk top to bottom, marking actions complete as they go.

---

## What it reads

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — current feature pointer
- `<feature-dir>/roadmap.md` — the source plan
- `<feature-dir>/data-delta.md`, `interfaces.md` — context for decomposition
- `aegis/runtime/hooks.yml` — `before-to-do` and `after-to-do` hooks

---

## What it produces

| File | Content |
|------|---------|
| `<feature-dir>/actions.md` | Numbered atomic actions with IDs, dependencies, parallel marker, and open checkboxes |

---

## When to use

After `/aegis-plan` produces the roadmap.

```
/aegis-to-do
```

Manual invocation. Suggests `/aegis-coding` next (or `/aegis-audit` / `/aegis-quality` if a review pass is desired).
