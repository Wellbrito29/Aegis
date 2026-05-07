# Developing from specs

Once Aegis Spec has generated all specs in `aegis/`, you can take those files to any machine and start building the system from scratch. Here is the recommended order.

---

## Before writing a single line of code

Start by reading these three files:

| File | Why read first |
|---|---|
| `aegis/confidence-report.md` | Shows what is high-confidence (green) vs. gaps (red). Avoids building on wrong inferences. |
| `aegis/gaps.md` | Lists what Aegis Spec could not determine. Fill these in manually before starting. |
| `aegis/architecture.md` + C4 diagrams | Shows the big picture: layers, modules, system boundaries. |

---

## Implementation order (bottom-up)

```
1. database/  +  erd-complete.md             (data structures, migrations)
2. domain.md  +  <unit>/ for core entities   (core business rules: read requirements.md, design.md, tasks.md of each)
3. <unit>/ for services sorted by dependency (use dependencies.md as a guide)
4. openapi/   +  API contracts               (if present)
5. ui/                                       (presentation layer last)
```

---

## Which unit comes first

Open `aegis/traceability/code-spec-matrix.md`. It lists each unit and its dependencies.

Implement the units that depend on nothing else first (leaf nodes in the dependency tree), then work up toward the units that integrate multiple components.

---

## Keeping traceability alive during development

Use `aegis/traceability/code-spec-matrix.md` as a reference while developing to know which piece of implemented code corresponds to which spec. This keeps traceability accurate as the codebase grows.

---

## See also

- [Generated outputs](saidas/index.md): full list of files produced by Aegis Spec
- [Confidence scale](escala-confianca.md): how to interpret the 🟢🟡🔴 markers in the specs
