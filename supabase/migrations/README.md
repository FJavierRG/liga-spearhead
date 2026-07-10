# Migraciones SQL

## ⚠️ Base de datos en producción

**Ya hay usuarios reales registrados** y están empezando a usar la liga. La BD de Supabase **no está vacía**.

Antes de ejecutar cualquier SQL en producción:

- **No** vuelvas a ejecutar `001_initial_schema.sql` ni scripts que hagan `DROP`, `TRUNCATE` o `DELETE` masivo.
- **No** reinsertes datos de ejemplo (temporadas, usuarios de prueba, etc.).
- Las migraciones nuevas deben ser **incrementales**: `ALTER`, nuevas tablas, nuevas políticas, índices, etc.
- Revisa si la migración ya se aplicó (columna, tabla o índice ya existente) antes de lanzarla.
- Prueba en local o en un proyecto Supabase de desarrollo cuando el cambio sea arriesgado.

## Orden histórico

Las migraciones de este directorio se aplicaron (o deben aplicarse) en orden por nombre:

1. `001_initial_schema.sql` — solo en instalación inicial (**ya aplicada en producción**)
2. `002_player_name_constraints.sql` / `002_reglas_pendientes.sql`
3. `003_scheduled_matches.sql`
4. `003_unique_player_nombre.sql`

Para cambios futuros, crea `004_*.sql`, `005_*.sql`, etc.

## Dónde ejecutar

Supabase → **SQL Editor** del proyecto de producción, con el script revisado.

Si dudas, consulta [`docs/BASE_DE_DATOS.md`](../docs/BASE_DE_DATOS.md).
