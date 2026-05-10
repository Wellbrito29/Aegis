# Audit

**Comando:** `/aegis-audit`
**Fase:** Forward — pase de revisión opcional
**Estado:** Opcional

---

## 🔍 El auditor estricto

Auditoría de solo lectura. Cruza `requirements.md`, `roadmap.md` y `actions.md` de la feature activa buscando inconsistencias, reporta con severidad (CRITICAL, HIGH, MEDIUM, LOW). Nunca edita los artefactos auditados.

---

## Qué hace

Audit busca contradicciones, falta de cobertura y gaps de trazabilidad entre los tres documentos centrales de la feature: requirements (el "qué"), roadmap (el "cómo") y actions (el "ejecutar"). Cada hallazgo recibe tag de severidad y sugerencia de remediación. El humano resuelve — Audit solo reporta.

Escala de severidad:
- **CRITICAL** — requisito sin cobertura en roadmap, acción contradiciendo roadmap
- **HIGH** — acción vaga, dependencia faltante
- **MEDIUM** — inconsistencia de nombres, paso redundante
- **LOW** — cosmético / estilo

---

## Qué lee

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature activa
- `<feature-dir>/requirements.md`, `roadmap.md`, `actions.md`
- `aegis/runtime/hooks.yml` — ganchos `before-audit` y `after-audit`

---

## Qué produce

| Archivo | Contenido |
|---------|-----------|
| `<feature-dir>/audit.md` | Lista de hallazgos agrupados por severidad, cada uno con ubicación y sugerencia de remediación |

---

## Cuándo usar

Entre `/aegis-to-do` y `/aegis-coding`, cuando quiera sanity check antes de implementar. O después de `/aegis-plan` si el roadmap parece frágil.

```
/aegis-audit
```

Invocación manual. Solo lectura — nunca modifica documentos de origen.
