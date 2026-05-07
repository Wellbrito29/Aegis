# Supported engines

Aegis Spec works with the leading AI engines on the market. The installer automatically detects which ones are present in the environment, but you can add more at any time with `npx aegis-spec add-engine`.

---

## Compatibility

| Engine | File created | Skills path | How to activate |
|--------|-------------|-------------|-----------------|
| **Claude Code** ⭐ | `CLAUDE.md` | `.claude/skills/aegis-*/` and `.agents/skills/aegis-*/` | `/aegis` |
| **Codex** ⭐ | `AGENTS.md` | `.agents/skills/aegis-*/` | `aegis` |
| **Cursor** ⭐ | `.cursorrules` | `.agents/skills/aegis-*/` | `/aegis` |
| **Gemini CLI** | `GEMINI.md` | `.agents/skills/aegis-*/` | `/aegis` |
| **Windsurf** | `.windsurfrules` | `.agents/skills/aegis-*/` | `/aegis` |
| **Antigravity** | `AGENTS.md` | `.agents/skills/aegis-*/` | `/aegis` |
| **Kiro** | (none) | `.kiro/skills/aegis-*/` and `.agents/skills/aegis-*/` | `/aegis` |
| **Opencode** | `AGENTS.md` | `.agents/skills/aegis-*/` | `aegis` |
| **Kimi CLI** | `AGENTS.md` | `.agents/skills/aegis-*/` | `aegis` |
| **Cline** | `.clinerules` | `.agents/skills/aegis-*/` | `/aegis` |
| **Roo Code** | `.roorules` | `.agents/skills/aegis-*/` | `/aegis` |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `.agents/skills/aegis-*/` | `/aegis` |
| **Aider** | `CONVENTIONS.md` | `.agents/skills/aegis-*/` | `aegis` |
| **Amazon Q Developer** | `.amazonq/rules/aegis.md` | `.agents/skills/aegis-*/` | `/aegis` |

---

## Claude Code

The most tested engine with the best support. Uses native slash commands, making activation intuitive. Aegis Spec creates files in both `.claude/skills/` and `.agents/skills/` (for compatibility with other engines that may be added later).

---

## Codex

Fully compatible. Since Codex doesn't use slash commands, activation is by the agent name directly: `aegis`, `aegis-scout`, etc. The `AGENTS.md` file at the project root serves as the entry point.

---

## Cursor

Compatible via `.cursorrules`. Cursor reads the rules from this file and the agents are available as skills.

---

## Gemini CLI and Windsurf

Full support. Agents live in `.agents/skills/` and are accessed via each engine's native mechanisms.

---

## Antigravity

Google's agentic development platform, released in November 2025. Reads `AGENTS.md` natively (same file as Codex). If Codex is already installed in the project, the existing `AGENTS.md` is reused without duplication. CLI command: `agy`.

---

## Kiro

Amazon's agentic IDE. Kiro natively discovers skills in `.kiro/skills/`, no steering document required. The installer places agents in `.kiro/skills/` (and also in `.agents/skills/` for compatibility with other engines). Activation is via `/aegis` or auto-discovery from the skill description.

---

## Opencode

Open source coding agent for the terminal (SST). Reads `AGENTS.md` natively, same convention as Codex. CLI command: `opencode`. Like Codex, activation is by agent name: `aegis`.

---

## Kimi CLI

Moonshot AI's terminal coding agent. Reads `AGENTS.md` natively (merged from project root to working directory) — same convention as Codex/Opencode. If any of those is already installed, the existing `AGENTS.md` is reused without duplication. Skills are auto-discovered from `.agents/skills/` and `.kimi/skills/`. CLI command: `kimi`. Activation is by agent name: `aegis`.

---

## Cline and Roo Code

VS Code extensions with custom rules support via `.clinerules` and `.roorules` respectively. The pattern is identical to Cursor and Windsurf: a rules file at the project root that instructs the agent when activating `/aegis`.

---

## GitHub Copilot

Uses `.github/copilot-instructions.md` as a custom instructions file, automatically read by Copilot in every session. The installer creates the file inside `.github/` (which may already exist in the project).

---

## Aider

Coding agent for the terminal. The entry file `CONVENTIONS.md` at the root is passed via `--read CONVENTIONS.md` or configured in `.aider.conf.yml`. Like Codex and Opencode, activation is by name: `aegis`.

---

## Amazon Q Developer

AWS AI CLI. Uses rules in `.amazonq/rules/` to instruct the agent per project. The installer creates `.amazonq/rules/aegis.md` without interfering with other rules you may already have in that folder.

---

## Multiple engines in the same project

You can have all engines installed at the same time. Agents in `.agents/skills/` are shared by all of them. The installer creates the specific entry files for each engine without conflict.

If you work in a team where each person uses a different engine, this works normally: everyone uses their engine's entry file, but all agents are in the same place.
