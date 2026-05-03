# `policy-check` — signature CI gate

Standalone CLI that blocks PRs which break protected contracts. Compares the
working tree (or any ref) against a base ref, parses each changed file with
the L1 layer (JS, TS, Python, Go, Java) and reports decisions.

```bash
npx reversa policy-check --base origin/main --head HEAD --severity high
```

Exit codes:

| Code | Meaning |
|---|---|
| 0 | No blocks at the chosen severity |
| 1 | At least one block at the chosen severity |
| 2 | Invocation error (no policy index, git diff failed, …) |

---

## Options

```
npx reversa policy-check [--base <ref>] [--head <ref>]
                         [--format text|json] [--severity high|medium|low]
                         [--cwd <path>]
```

### `--severity`

| Level | What blocks |
|---|---|
| **high** (default) | `signature_change`, `deleted_symbol` on protected contracts |
| medium | + `protected_file`, `protected_glob`, `new_export` |
| low | + `auto_policy_blacklist` (path-only blacklist) |

Body-only edits to protected files always approve — only contract-relevant
changes (signature, exported flag, extends) trigger a block.

### `--format`

| Format | Output |
|---|---|
| **text** (default) | Human-readable summary with old/new signatures and suggested alternatives |
| json | Structured payload — `{ ok, base, head, severity, decisions, summary }` |

---

## How decisions are made

1. `policy-index.json` is read. Build it with `npx reversa policy-index build`.
2. For each file in `git diff base...head`:
   - Read the file at `base` and at `head` (`git show ref:path`)
   - Run the smart gate from Phase 10 — diff symbols by canonical id, classify
     the change, attach callers and alternatives
3. Emit decisions; exit non-zero if any decision's category is in the gate set.

## CI templates

See `templates/ci/github-actions.yml` and `templates/ci/gitlab-ci.yml` for
ready-to-paste workflows.
