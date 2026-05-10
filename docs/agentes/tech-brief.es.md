# Tech Brief

**Comando:** `/aegis-tech-brief`
**Fase:** Forward — entre Requirements y Doubt
**Estado:** Opcional

---

## 🛠️ El traductor técnico

Un traductor que toma una historia escrita en lenguaje de negocio y la reescribe para el tech lead, anclándose en la arquitectura y las reglas de negocio del proyecto. No descompone, no decide, no crea ADR — solo traduce y señala.

---

## Qué hace

Tech Brief lee el `requirements.md` producido por `/aegis-requirements` (aún en lenguaje de negocio) y lo convierte en un `tech-brief.md` que el tech lead revisa antes de planificar. El brief responde cuatro preguntas:

- ¿Qué módulos tocará esta feature?
- ¿Qué contratos (funciones, interfaces, exports) cambian?
- ¿Qué reglas de negocio aplican a esta feature?
- ¿Qué decisiones técnicas debe tomar el tech lead?

No escribe tasks (eso es `/aegis-plan` y `/aegis-to-do`), no profundiza ambigüedades (eso es `/aegis-doubt`) y no crea ADR — solo señala decisiones que merecen uno.

---

## Qué lee

- `<feature-dir>/requirements.md` — la historia de negocio
- `aegis/migration/target_business_rules.md` (Equipo de Migración) **o** `aegis/specs/business-rules.md` (greenfield)
- `aegis/architecture/architecture.md`, `c4-*.md`, `erd-complete.md`
- `aegis/runtime/context/surface.json` — lista de módulos
- `aegis/runtime/context/graph.json` — símbolos, calls

Si no existe archivo de reglas de negocio, Tech Brief bloquea la ejecución. El brief pierde valor sin reglas para anclar.

---

## Qué produce

| Archivo | Contenido |
|---------|-----------|
| `<feature-dir>/tech-brief.md` | Brief técnico para el tech lead |

El brief tiene ocho secciones:

1. **Resumen técnico** — un párrafo traduciendo el objetivo de negocio en problema técnico
2. **Módulos afectados** — paths del `surface.json`
3. **Contratos tocados** — funciones/interfaces con `archivo:línea` del `graph.json`
4. **Reglas de negocio aplicables** — copiadas literalmente con enlace de ancla
5. **Puntos de atención** — hasta 5 riesgos técnicos
6. **Señalizaciones de ADR** — decisiones que merecen Architecture Decision Record (el tech lead las crea aparte)
7. **Preguntas para el tech lead** — hasta 3 decisiones binarias o de respuesta corta
8. **Decisión** — checkboxes que el tech lead marca: aprobar / refinar / bloquear

---

## Cuándo usar

Después de que `/aegis-requirements` produzca el `requirements.md`, antes de `/aegis-doubt` o `/aegis-plan`. Sáltalo en features triviales greenfield sin reglas de negocio — pero en ese caso considera crear `aegis/specs/business-rules.md` antes.

```
/aegis-tech-brief
```

El skill nunca encadena automáticamente; sugiere el siguiente paso (`/aegis-doubt` o `/aegis-plan`) y espera al usuario.
