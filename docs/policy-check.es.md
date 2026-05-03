# `policy-check` — gate de firmas en CI

CLI standalone que bloquea PRs que rompen contratos protegidos. Compara el
working tree (o cualquier ref) contra un base ref, parsea cada archivo
modificado con el layer L1 (JS, TS, Python, Go, Java) y reporta decisiones.

```bash
npx reversa policy-check --base origin/main --head HEAD --severity high
```

Códigos de salida:

| Código | Significado |
|---|---|
| 0 | Sin blocks en la severidad elegida |
| 1 | Al menos un block en la severidad elegida |
| 2 | Error de invocación (sin policy index, git diff falló, …) |

---

## Opciones

```
npx reversa policy-check [--base <ref>] [--head <ref>]
                         [--format text|json] [--severity high|medium|low]
                         [--cwd <path>]
```

### `--severity`

| Nivel | Qué bloquea |
|---|---|
| **high** (por defecto) | `signature_change`, `deleted_symbol` en contratos protegidos |
| medium | + `protected_file`, `protected_glob`, `new_export` |
| low | + `auto_policy_blacklist` (blacklist sólo de path) |

Cambios sólo en el body de funciones en archivos protegidos siempre aprueban
— sólo cambios de contrato (signature, exported, extends) disparan block.

### `--format`

| Formato | Salida |
|---|---|
| **text** (por defecto) | Resumen humano con firmas old/new y alternativas sugeridas |
| json | Payload estructurado — `{ ok, base, head, severity, decisions, summary }` |

---

## Cómo se toman las decisiones

1. `policy-index.json` se lee. Constrúyelo con `npx reversa policy-index build`.
2. Por cada archivo en `git diff base...head`:
   - Lee el contenido en `base` y en `head` (`git show ref:path`)
   - Corre el smart gate de la Fase 10 — diff de símbolos por id canonical,
     clasifica el cambio, adjunta callers y alternativas
3. Emite decisiones; sale con código no-cero si alguna decisión tiene
   categoría en el gate.

## Plantillas CI

Ver `templates/ci/github-actions.yml` y `templates/ci/gitlab-ci.yml`.
