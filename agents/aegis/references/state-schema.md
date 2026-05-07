# Schema — aegis/config/state.json

Este arquivo persiste o estado completo da análise entre sessões. O Aegis Spec lê e escreve neste arquivo.

## Estrutura completa

```json
{
  "version": "1.0.0",
  "project": "nome-do-projeto",
  "user_name": "Nome do Usuário",
  "chat_language": "pt-br",
  "doc_language": "Português",
  "answer_mode": "chat",
  "doc_level": null,
  "output_folder": "aegis",
  "phase": "reconhecimento",
  "completed": ["reconhecimento"],
  "pending": ["escavacao", "interpretacao", "geracao", "revisao"],
  "engines": ["claude-code"],
  "agents": ["reversa", "aegis-scout", "aegis-archaeologist"],
  "checkpoints": {
    "scout": {
      "completed_at": "2026-04-26T10:00:00Z",
      "files": [
        "aegis/reports/inventory.md",
        "aegis/reports/dependencies.md",
        "aegis/runtime/context/surface.json"
      ]
    },
    "archaeologist": {
      "completed_at": "2026-04-26T11:00:00Z",
      "modules_analyzed": ["auth", "orders", "payments"],
      "files": [
        "aegis/reports/code-analysis.md",
        "aegis/reports/data-dictionary.md",
        "aegis/runtime/context/modules.json"
      ]
    }
  },
  "created_files": [
    "CLAUDE.md",
    "aegis/skills/aegis/SKILL.md",
    "aegis/config/state.json",
    "aegis/plan.md"
  ]
}
```

## Campos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `version` | string | Versão do Aegis Spec instalada |
| `project` | string | Nome do projeto legado |
| `user_name` | string | Nome do usuário (para interações) |
| `chat_language` | string | Idioma das interações (ex: pt-br, en-us) |
| `doc_language` | string | Idioma das specs geradas (ex: Português, English) |
| `answer_mode` | string | Como o usuário responde às lacunas: `chat` ou `file` |
| `doc_level` | string \| null | Volume de documentação gerada: `essencial`, `completo` ou `detalhado`. Começa `null` — obrigatório preencher via escolha do usuário após o Scout. |
| `output_folder` | string | Pasta de saída das specs (padrão: `aegis`) |
| `phase` | string \| null | Fase atual. `null` = não iniciado |
| `completed` | string[] | Fases concluídas |
| `pending` | string[] | Fases pendentes |
| `checkpoints` | object | Registro de conclusão de cada agente |
| `engines` | string[] | Engines configuradas (ex: `["claude-code", "codex"]`) |
| `agents` | string[] | Agentes instalados |
| `created_files` | string[] | Todos os arquivos criados pelo Aegis Spec (para uninstall seguro) |

## Fases válidas

`reconhecimento` → `escavacao` → `interpretacao` → `geracao` → `revisao`

## Regra ao escrever

Nunca remova campos existentes. Apenas adicione ou atualize.

## Onde NÃO escrever

A decisão de organização das specs (granularidade, pastas customizadas, sugestão original do Scout, timestamp da escolha) **não** vai no `state.json`. Ela é persistida em `aegis/config/config.toml`, seção `[specs]`, conforme `references/step-03-specs-organization.md`. O `state.json` é estado runtime, o `config.toml` é decisão de longo prazo.
