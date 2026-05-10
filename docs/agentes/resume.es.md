# Resume

**Comando:** `/aegis-resume`
**Fase:** Forward — fuera del ciclo, cambia la feature activa
**Estado:** Opcional

---

## ⏯️ El reanudador

Reanuda una feature pausada (listada en `paused-features` del `active-requirements.json`) y la vuelve activa. No crea features nuevas — solo intercambia la activa por la elegida y (cuando tiene sentido) mueve la activa anterior a `paused-features`.

---

## Qué hace

Resume es el skill de cambio de contexto. Cuando estás haciendo malabares con múltiples features y quieres volver a una pausada sin perder el estado actual, Resume:

1. Lee `active-requirements.json` y lista `paused-features`
2. Pregunta qué feature pausada reanudar
3. Mueve la activa actual a `paused-features` (a menos que el usuario la descarte)
4. Promueve la feature elegida a activa
5. Relee sus artefactos físicos para que skills siguientes sepan la etapa correcta

No modifica contenido de carpeta de feature — solo el puntero en `active-requirements.json`.

---

## Qué lee

- `aegis/config/state.json` — `output_folder`, `forward_folder`
- `aegis/config/active-requirements.json` — `feature-dir` y lista `paused-features`

---

## Qué produce

| Archivo | Contenido |
|---------|-----------|
| `aegis/config/active-requirements.json` | Actualizado in situ — `feature-dir` intercambiado, `paused-features` ajustado |

---

## Cuándo usar

Cuando hay una o más features pausadas en `paused-features` y quieres cambiar de contexto a una de ellas.

```
/aegis-resume
```

Invocación manual. Pregunta al usuario qué elegir de la lista de pausadas.
