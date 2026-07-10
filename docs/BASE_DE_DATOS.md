# Base de datos (Supabase)

## Estado actual

La liga **ya está en uso**: hay **usuarios reales** en `auth.users` y perfiles en `public.users`. Los jugadores han empezado a entrar y a usar la web.

Cualquier cambio en SQL debe asumir **datos de producción existentes**.

## Reglas al escribir SQL

| Hacer | Evitar |
|-------|--------|
| Migraciones incrementales (`004_*.sql`, …) | Reejecutar `001_initial_schema.sql` |
| `ALTER TABLE … ADD COLUMN` con valores por defecto | `DROP TABLE` / `TRUNCATE` en tablas con datos |
| Comprobar duplicados antes de `UNIQUE` | Borrar usuarios o partidas “de limpieza” |
| Probar en entorno de desarrollo si el cambio es delicado | Scripts que reseteen la temporada sin acuerdo |

## Tablas con datos sensibles

- `users` — perfiles de jugadores reales
- `matches` — resultados ya registrados
- `availability` — disponibilidad indicada por jugadores
- `scheduled_matches` — emparejamientos (cuando existan)
- `player_avisos` — notificaciones generadas

## Migraciones

Los scripts viven en `supabase/migrations/`. Instrucciones para aplicar nuevas migraciones: [`supabase/migrations/README.md`](../supabase/migrations/README.md).

## Copia de seguridad

Antes de una migración arriesgada en Supabase, usa **Database → Backups** (según tu plan) o exporta las tablas afectadas.
