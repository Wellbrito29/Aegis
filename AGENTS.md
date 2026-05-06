# Reversa Repo Notes

## Commands
- Runtime: Node.js 18+; package is ESM (`"type": "module"`).
- No `npm` scripts exist for test/lint/typecheck; do not invent `npm test`/`npm run lint`.
- CLI entrypoint: `node bin/reversa.js --help` or `node bin/reversa.js <command>`.
- Syntax-check a touched JS file with `node --check <file>`; there is no project-wide checker configured.
- Package smoke check: `npm pack --dry-run` respects the `files` whitelist in `package.json`.
- Docs use MkDocs Material from `mkdocs.yml`; run `mkdocs build` only when local Python deps are available.

## Architecture
- `bin/reversa.js` dispatches CLI commands by dynamic import from `lib/commands/`.
- `lib/installer/` owns engine detection, prompts, file writing, manifests, and hook install/remove.
- `agents/reversa-*/` are installed verbatim as skills; each agent folder should contain `SKILL.md` with frontmatter.
- `templates/` is shipped product content copied into user projects; `templates/engines/AGENTS.md` is not active policy for this repo.
- `lib/graph/` builds `.reversa/context/graph.json`; L0 import graph is default, L1 symbols/signatures require `npx reversa graph build --level L1` and optional native parser deps.
- Control-plane gates: build `.reversa/context/policy-index.json` with `npx reversa policy-index build`, then run `npx reversa policy-check --base <ref> --head HEAD`.

## Product Invariants
- Installer/update paths should preserve user-owned files: new files are written only if missing; customized installed files are protected via manifest checks.
- Reversa-generated runtime state belongs under `.reversa/`; generated specs default to `_reversa_sdd/`.
- Keeper auto mode is opt-in: `_reversa_sdd/auto-policy.yaml` must enable `auto_resolve`, and live LLM mode needs `ANTHROPIC_API_KEY`; `--dry-run` skips LLM/spec writes.
- `drift-check` is standalone and engine-agnostic; it reads `<output_folder>/drift.md`, defaulting from `.reversa/state.json` then `_reversa_sdd`.

## Repo Gotchas
- `package.json` currently says `2.0.0`; `package-lock.json` root metadata still says `1.9.0-alpha.2`. Expect lockfile churn if dependency install metadata is refreshed.
- `.reversa/`, `.claude/`, `site/`, `dist/`, and `specs/` are ignored; avoid relying on ignored generated state for committed changes.
