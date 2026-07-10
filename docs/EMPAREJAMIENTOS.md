# Emparejamientos automáticos

Este documento explica **cuándo** y **cómo** se generan los partidos programados. Está pensado para evitar confusiones sobre cron externo, Vercel u otras plataformas.

## Resumen

| Qué | Dónde |
|-----|--------|
| Algoritmo de emparejamiento | `src/lib/league/weekly-schedule.ts` |
| Pesos y prioridades | `src/lib/league/matching.ts` (`MATCH_WEIGHTS`) |
| Insertar en base de datos | `src/lib/data/scheduled-queries.ts` → `ensureWeeklySchedule` |
| **Cuándo se ejecuta** | `src/lib/league/schedule-runner.ts` → `maybeRunWeeklySchedules` |
| Arranque del reloj interno | `src/instrumentation.ts` |

**No hace falta configurar cron en Railway ni en ningún panel.** La lógica vive dentro de la app desplegada.

## Calendario (hora peninsular, `Europe/Madrid`)

| Momento | Qué hace |
|---------|----------|
| **Viernes 20:00** | Emparejamiento principal de la **semana siguiente** (lunes–domingo) |
| **Sábado 23:00** | Segunda oportunidad: solo jugadores **sin partido** esa semana |
| **Domingo 23:00** | Última segunda oportunidad, mismas reglas |

Los jugadores deben actualizar su disponibilidad de la semana siguiente **antes del viernes** para entrar en el cálculo principal.

## Cómo se dispara (sin cron externo)

Al desplegar en Railway, el servidor Next.js arranca con `next start`. Entonces:

1. **`instrumentation.ts`** registra un reloj que llama a `maybeRunWeeklySchedules()` cada **15 minutos** mientras el proceso sigue activo.
2. **`HomePageServer`** (carga del tablón) también llama a `maybeRunWeeklySchedules()` por si el servidor estaba dormido.

`maybeRunWeeklySchedules` comprueba la hora en Madrid y, si toca, ejecuta `ensureWeeklySchedule` para la semana siguiente.

### Si Railway apaga el servidor por inactividad

En el plan gratuito el proceso puede **dormirse** si nadie entra durante horas.

- A las 20:00 del viernes en punto **no pasará nada** si el servidor está apagado.
- En la **primera visita después** de esa hora, al cargar la liga, se ejecutará el emparejamiento pendiente.

Para una liga pequeña suele bastar: si alguien entra el viernes noche o el sábado, los partidos están listos antes del lunes.

### Qué no hace el sistema

- **No** recalcula al guardar disponibilidad (evita abuso y carga innecesaria).
- **No** rompe parejas ya asignadas en los repasos de sábado/domingo.
- **No** depende de Vercel ni de tareas programadas en el panel de Railway.

## Otros momentos en que se empareja

| Situación | Comportamiento |
|-----------|----------------|
| Cancelar un partido programado | Se intenta reemparejar a los jugadores liberados (`match-actions.ts`) |
| Cargar partidos del jugador | `ensureWeeklySchedule` es idempotente: solo añade parejas que falten |

## Endpoint manual (opcional)

```
GET /api/cron/weekly-schedule
Authorization: Bearer <CRON_SECRET>
```

Sirve para **pruebas** o forzar un repaso. En producción normal **no es necesario** llamarlo. Requiere la variable de entorno `CRON_SECRET`.

## Variables de entorno necesarias

Para que el emparejamiento automático funcione en producción:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...   # obligatoria: inserta en scheduled_matches
```

Sin `SUPABASE_SERVICE_ROLE_KEY`, la app funciona pero **no genera emparejamientos** en segundo plano.

## Semana de referencia

- Las semanas van de **lunes a domingo** (`src/lib/league/week.ts`).
- Tras el viernes 20:00 la UI muestra ya los partidos de la **semana siguiente**.
- Constantes de hora: `WEEKLY_SCHEDULE_CRON_HOUR` (20) y `WEEKEND_SCHEDULE_CRON_HOUR` (23).
