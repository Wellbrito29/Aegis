# Aegis Spec Repo Notes

## Commands
- Runtime: Node.js 18+; package is ESM (`"type": "module"`).
- No `npm` scripts exist for test/lint/typecheck; do not invent `npm test`/`npm run lint`.
- CLI entrypoint: `node bin/aegis.js --help` or `node bin/aegis.js <command>`.
- Syntax-check a touched JS file with `node --check <file>`; there is no project-wide checker configured.
- Package smoke check: `npm pack --dry-run` respects the `files` whitelist in `package.json`.
- Docs use MkDocs Material from `mkdocs.yml`; run `mkdocs build` only when local Python deps are available.

## Architecture
- `bin/aegis.js` dispatches CLI commands by dynamic import from `lib/commands/`.
- `lib/installer/` owns engine detection, prompts, file writing, manifests, and hook install/remove.
- `agents/aegis-*/` are installed verbatim as skills; each agent folder should contain `SKILL.md` with frontmatter.
- `templates/` is shipped product content copied into user projects; `templates/engines/AGENTS.md` is not active policy for this repo.
- `lib/graph/` builds `aegis/runtime/context/graph.json`; L0 import graph is default, L1 symbols/signatures require `npx aegis-spec graph build --level L1` and optional native parser deps.
- Control-plane gates: build `aegis/runtime/context/policy-index.json` with `npx aegis-spec policy-index build`, then run `npx aegis-spec policy-check --base <ref> --head HEAD`.

## Product Invariants
- Installer/update paths should preserve user-owned files: new files are written only if missing; customized installed files are protected via manifest checks.
- Aegis Spec-generated runtime state belongs under `aegis/runtime/`; generated specs default to `aegis/specs/` and reports to `aegis/reports/`.
- Keeper auto mode is opt-in: `aegis/config/auto-policy.yaml` must enable `auto_resolve`, and live LLM mode needs `ANTHROPIC_API_KEY`; `--dry-run` skips LLM/spec writes.
- `drift-check` is standalone and engine-agnostic; it reads `<output_folder>/drift.md`, defaulting from `aegis/config/state.json` then `aegis/reports/`.

## Repo Gotchas
- `package.json` currently says `2.0.0`; `package-lock.json` root metadata still says `1.9.0-alpha.2`. Expect lockfile churn if dependency install metadata is refreshed.
- `aegis/runtime/`, `aegis/reports/`, `site/`, `dist/`, and `specs/` are ignored; avoid relying on ignored generated state for committed changes.
