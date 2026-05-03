# `policy-check` — gate de assinatura em CI

CLI standalone que barra PRs que quebram contratos protegidos. Compara o
working tree (ou qualquer ref) contra um base ref, parseia cada arquivo
alterado com o layer L1 (JS, TS, Python, Go, Java) e reporta decisões.

```bash
npx reversa policy-check --base origin/main --head HEAD --severity high
```

Exit codes:

| Código | Significado |
|---|---|
| 0 | Sem blocks na severidade escolhida |
| 1 | Pelo menos um block na severidade escolhida |
| 2 | Erro de invocação (sem policy index, git diff falhou, …) |

---

## Opções

```
npx reversa policy-check [--base <ref>] [--head <ref>]
                         [--format text|json] [--severity high|medium|low]
                         [--cwd <path>]
```

### `--severity`

| Nível | O que bloqueia |
|---|---|
| **high** (padrão) | `signature_change`, `deleted_symbol` em contratos protegidos |
| medium | + `protected_file`, `protected_glob`, `new_export` |
| low | + `auto_policy_blacklist` (blacklist só de path) |

Edits que só mexem no body de funções em arquivos protegidos sempre passam —
só mudanças de contrato (signature, exported, extends) disparam block.

### `--format`

| Formato | Saída |
|---|---|
| **text** (padrão) | Resumo humano com signatures old/new e alternativas sugeridas |
| json | Payload estruturado — `{ ok, base, head, severity, decisions, summary }` |

---

## Como as decisões são tomadas

1. `policy-index.json` é lido. Construa com `npx reversa policy-index build`.
2. Para cada arquivo em `git diff base...head`:
   - Lê o conteúdo no `base` e no `head` (`git show ref:path`)
   - Roda o smart gate da Fase 10 — diff de símbolos por id canonical,
     classifica a mudança, anexa callers e alternativas
3. Emite decisões; exit não-zero se alguma decisão tiver categoria no gate.

## Templates CI

Ver `templates/ci/github-actions.yml` e `templates/ci/gitlab-ci.yml`.
