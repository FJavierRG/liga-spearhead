# Liga Spearhead

Web para gestionar una liga local de **Age of Sigmar: Spearhead**.

Incluye clasificación dinámica, registro de partidas, disponibilidad semanal, hándicap de PV y emparejamientos automáticos.

## Stack

- **App:** Next.js (React), desplegada en **[Railway](https://railway.app)**
- **Datos y auth:** Supabase (PostgreSQL, Auth, RLS)
- **UI:** Tailwind CSS, shadcn/ui, Lucide

> La base de datos y los usuarios viven en Supabase. La app (frontend + lógica de servidor) vive en Railway. No se usa Vercel para el despliegue de producción.

## Documentación adicional

| Documento | Contenido |
|-----------|-----------|
| [`docs/EMPAREJAMIENTOS.md`](docs/EMPAREJAMIENTOS.md) | Calendario, cómo salta el emparejamiento, variables necesarias |
| [`diseño_backend.md`](diseño_backend.md) | Arquitectura y reglas de negocio |
| [`diseño_frontend.md`](diseño_frontend.md) | Interfaz y UX |
| [`idea_original.md`](idea_original.md) | Diseño conceptual de la liga |

## Requisitos

- Node.js 20+ (recomendado 22.13+)
- Proyecto en [Supabase](https://supabase.com)
- Servicio en [Railway](https://railway.app) (producción)

### Nota sobre `npx` en Windows

Si al ejecutar `npx` Windows te pide elegir un programa, suele deberse a un archivo vacío en `C:\Windows\System32\npx` que tapa el de Node.js. Soluciones:

1. Usar la ruta completa: `"C:\Program Files\nodejs\npx.cmd"`
2. Usar `npm run dev` / `npm install` en lugar de `npx` cuando sea posible
3. Eliminar el archivo erróneo `C:\Windows\System32\npx` (requiere permisos de administrador)

## Configuración local

### 1. Variables de entorno

```powershell
Copy-Item .env.local.example .env.local
```

Rellena al menos las credenciales de Supabase. En producción también necesitas `SUPABASE_SERVICE_ROLE_KEY` (ver [Emparejamientos](docs/EMPAREJAMIENTOS.md)).

### 2. Base de datos

En Supabase → **SQL Editor**, ejecuta las migraciones de `supabase/migrations/` **en orden por nombre de archivo**:

1. `001_initial_schema.sql`
2. `002_player_name_constraints.sql` (o `002_reglas_pendientes.sql` si aplica en tu historial)
3. `003_scheduled_matches.sql`
4. `003_unique_player_nombre.sql`

### 3. Autenticación

Email + contraseña con Supabase Auth.

En desarrollo puedes desactivar la confirmación de email en **Authentication → Providers → Email**.

En **Authentication → URL Configuration**, añade:

```
http://localhost:3000/auth/callback
https://tu-dominio.railway.app/auth/callback
```

### 4. Primer administrador

Tras el primer inicio de sesión:

```sql
UPDATE users SET rol = 'administrador'
WHERE auth_user_id = 'uuid-de-auth-users';
```

## Desarrollo

### Modo demo (sin Supabase)

```powershell
npm run dev:demo
```

Abre [http://localhost:3000](http://localhost:3000). Datos en memoria; se reinician al parar el servidor.

### Modo producción local (con Supabase)

```powershell
npm install
npm run dev
```

## Emparejamientos (resumen)

Los partidos de la semana siguiente se calculan automáticamente **desde el código**, sin configurar tareas en Railway:

| Hora (peninsular) | Acción |
|-------------------|--------|
| Viernes 20:00 | Emparejamiento principal |
| Sábado 23:00 | Segunda oportunidad (solo sin partido) |
| Domingo 23:00 | Última segunda oportunidad |

Detalle completo, limitaciones del plan gratis y archivos implicados: **[`docs/EMPAREJAMIENTOS.md`](docs/EMPAREJAMIENTOS.md)**.

## Reglas de negocio

- **Puntos:** victoria 2, empate 1, derrota 0
- **Underdog:** +1 PL extra por cada 4 PL de diferencia al ganar estando por detrás
- **Emparejamientos:** rivales nuevos, menos partidas jugadas, disponibilidad compatible, evitar repetir el último rival

Pesos del algoritmo: `src/lib/league/matching.ts` (`MATCH_WEIGHTS`).

## Despliegue en Railway

1. Conecta el repositorio a un servicio en Railway.
2. Comando de build: `npm run build`
3. Comando de start: `npm start` (equivale a `next start`)
4. Variables de entorno en Railway (mismas que `.env.local.example`):

   | Variable | Obligatoria | Uso |
   |----------|-------------|-----|
   | `NEXT_PUBLIC_SUPABASE_URL` | Sí | Cliente Supabase |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Sí | Cliente Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | Sí | Emparejamientos automáticos |
   | `CRON_SECRET` | Opcional | Forzar emparejamiento manual vía API |

5. Añade la URL pública de Railway en Supabase (callback de auth).

**No hace falta** crear cron jobs, tareas programadas ni servicios extra en Railway: el emparejamiento lo gestiona la propia app al arrancar y al entrar usuarios.

### Demo estática (GitHub Pages)

Existe un modo `NEXT_PUBLIC_STATIC_DEMO` para publicar una demo sin servidor Node. No incluye emparejamiento automático real ni Supabase en vivo.
