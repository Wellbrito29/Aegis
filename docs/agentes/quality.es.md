# Quality

**Comando:** `/aegis-quality`
**Fase:** Forward — pase de revisión opcional
**Estado:** Opcional

---

## ✒️ El revisor textual

Audita la claridad textual del `requirements.md` de la feature activa. Comprueba si la prosa es lo suficientemente buena para convertirse en plan y código sin retrabajo. Solo lectura — solo escribe el informe de auditoría.

Importante: **no** es auditoría de tests/implementación. Quality mira lenguaje, no tests.

---

## Qué hace

Quality lee `requirements.md` y señala problemas de escritura que causarían retrabajo más adelante: frases ambiguas, siglas sin definición, cláusulas contradictorias, criterio de aceptación mal redactado, cuantificadores vagos ("rápido", "muchos", "después"). Cada hallazgo viene con ubicación y sugerencia de reescritura.

El skill nunca modifica el requirements — el humano (u otro skill) decide si aplica las sugerencias.

---

## Qué lee

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature activa
- `<feature-dir>/requirements.md` — documento en revisión
- `aegis/runtime/hooks.yml` — ganchos `before-quality` y `after-quality`

---

## Qué produce

| Archivo | Contenido |
|---------|-----------|
| `<feature-dir>/quality.md` | Lista de hallazgos con ubicación, severidad y sugerencia de reescritura |

---

## Cuándo usar

Entre `/aegis-requirements` (o `/aegis-doubt`) y `/aegis-plan`, cuando quiera garantizar que el requirements está listo para planificación.

```
/aegis-quality
```

Invocación manual. Solo lectura — nunca modifica el requirements.
