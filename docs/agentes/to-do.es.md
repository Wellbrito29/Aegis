# To-Do

**Comando:** `/aegis-to-do`
**Fase:** Forward — cuarto skill del ciclo
**Estado:** Requerido para avanzar a coding

---

## ✅ El descompositor

Descompone el `roadmap.md` en acciones atómicas con IDs secuenciales, dependencias explícitas y marcador de ejecución paralela. Produce el `actions.md` que el skill Coding ejecuta línea a línea.

---

## Qué hace

To-Do lee el roadmap y lo divide en la menor unidad de trabajo que puede ejecutarse y verificarse independientemente. Cada acción recibe un ID estable (`A001`, `A002`, ...), checkbox abierto `[ ]`, dependencias de IDs anteriores y marcador indicando si puede correr en paralelo con hermanas.

La salida es intencionalmente ejecutable — humanos (o el Coding) caminan de arriba hacia abajo, marcando acciones completadas a medida que avanzan.

---

## Qué lee

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — feature activa
- `<feature-dir>/roadmap.md` — el plan de origen
- `<feature-dir>/data-delta.md`, `interfaces.md` — contexto para descomposición
- `aegis/runtime/hooks.yml` — ganchos `before-to-do` y `after-to-do`

---

## Qué produce

| Archivo | Contenido |
|---------|-----------|
| `<feature-dir>/actions.md` | Acciones atómicas numeradas con IDs, dependencias, marcador de paralelismo y checkboxes abiertos |

---

## Cuándo usar

Después de que `/aegis-plan` produzca el roadmap.

```
/aegis-to-do
```

Invocación manual. Sugiere `/aegis-coding` (o `/aegis-audit` / `/aegis-quality` si quiere revisión).
