# Liga Spearhead

Web para gestionar una liga local de **Age of Sigmar: Spearhead**.

Incluye clasificación dinámica, registro de partidas, disponibilidad semanal, hándicap de PV y emparejamientos recomendados.

## Stack

- **Frontend:** Next.js, React, Tailwind CSS, shadcn/ui, TanStack Table
- **Backend:** Supabase (PostgreSQL, Auth, RLS)

## Requisitos

- Node.js 20+ (recomendado 22.13+)
- Cuenta en [Supabase](https://supabase.com)

### Nota sobre `npx` en Windows

Si al ejecutar `npx` Windows te pide elegir un programa, suele deberse a un archivo vacío en `C:\Windows\System32\npx` que tapa el de Node.js. Soluciones:

1. Usar la ruta completa: `"C:\Program Files\nodejs\npx.cmd"`
2. Usar `npm run dev` / `npm install` en lugar de `npx` cuando sea posible
3. Eliminar el archivo erróneo `C:\Windows\System32\npx` (requiere permisos de administrador)

## Configuración

### 1. Variables de entorno

Copia el ejemplo y rellena tus credenciales de Supabase:

```powershell
Copy-Item .env.local.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
```

### 2. Base de datos

En el panel de Supabase → **SQL Editor**, ejecuta el contenido de:

```
supabase/migrations/001_initial_schema.sql
```

Esto crea tablas, políticas RLS, funciones de clasificación/hándicap y una temporada activa de ejemplo.

### 3. Autenticación OAuth

En Supabase → **Authentication → Providers**, activa:

- **Google**
- **Discord**

En **Authentication → URL Configuration**, añade la URL de callback:

```
http://localhost:3000/auth/callback
```

(Añade también tu dominio de producción cuando despliegues.)

### 4. Primer administrador

Tras el primer inicio de sesión, promueve tu usuario en SQL:

```sql
UPDATE users SET rol = 'administrador'
WHERE auth_user_id = 'uuid-de-auth-users';
```

## Desarrollo

### Modo demo (sin Supabase)

Para probar la web en local **sin crear ningún servicio**, con datos de ejemplo y login directo:

```powershell
npm run dev:demo
```

Abre [http://localhost:3000](http://localhost:3000) y elige un usuario:

- **Carlos (Admin)** — administrador
- **Ana, Borja, Diana, Erik** — jugadores con partidas y disponibilidad de ejemplo

Los datos viven en memoria: si reinicias el servidor, vuelven al estado inicial. Ideal para enseñar la web a un compañero antes de decidir si desplegar.

### Modo producción (con Supabase)

```powershell
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

## Secciones

| Ruta | Descripción |
|------|-------------|
| `/` | Inicio: rival recomendado, hándicap, posición, últimos resultados |
| `/clasificacion` | Tabla de clasificación |
| `/partidas` | Registrar partidas e historial |
| `/disponibilidad` | Cuadrícula semanal (mañana/tarde/noche) |
| `/perfil` | Tu perfil, estadísticas e historial |
| `/perfil/[id]` | Perfil de otro jugador |

## Reglas de negocio

- **Puntos:** victoria 2, empate 1, derrota 0
- **Hándicap:** +1 PV por cada 4 puntos de diferencia (para el jugador con menos puntos)
- **Emparejamientos:** priorizan rivales nuevos, menos partidas jugadas, disponibilidad compatible y evitan repeticiones recientes

Los pesos del algoritmo están en `src/lib/league/matching.ts` (`MATCH_WEIGHTS`).

## Despliegue

Compatible con [Vercel](https://vercel.com). Configura las mismas variables de entorno y actualiza las URLs de callback en Supabase.
