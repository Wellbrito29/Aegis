# Resume

**Command:** `/aegis-resume`
**Phase:** Forward — out-of-cycle, switches the active feature
**Status:** Optional

---

## ⏯️ The resumer

Resumes a paused feature (one listed in `paused-features` of `active-requirements.json`) and makes it active. Does not create new features — only swaps the current active for the chosen one and (when it makes sense) moves the previous active into `paused-features`.

---

## What it does

Resume is the context-switch skill. When you're juggling multiple features and want to go back to a paused one without losing the current state, Resume:

1. Reads `active-requirements.json` and lists `paused-features`
2. Asks which paused feature to resume
3. Moves the current active to `paused-features` (unless the user opts to discard it)
4. Promotes the chosen feature to active
5. Re-reads its physical artifacts so subsequent skills know the correct stage

It does not modify any feature folder content — only the pointer in `active-requirements.json`.

---

## What it reads

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — `feature-dir` and `paused-features` list

---

## What it produces

| File | Content |
|------|---------|
| `aegis/config/active-requirements.json` | Updated in place — `feature-dir` swapped, `paused-features` adjusted |

---

## When to use

When you have one or more paused features in `paused-features` and want to switch context to one of them.

```
/aegis-resume
```

Manual invocation. Asks the user to pick from the paused list.
