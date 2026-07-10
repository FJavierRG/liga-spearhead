# Guía de Backend

## Objetivo

El backend será responsable de:

- La persistencia de los datos de la liga.
- La autenticación y autorización de usuarios.
- La gestión de jugadores, partidas y disponibilidad.
- El cálculo de la clasificación.
- La generación de emparejamientos recomendados.

El diseño prioriza la simplicidad, el bajo mantenimiento y el uso de servicios gestionados frente a implementaciones personalizadas.

---

# Arquitectura

La aplicación utilizará **Supabase** como Backend as a Service (BaaS) y **Next.js** desplegado en **Railway** como aplicación web (UI + lógica de servidor).

Supabase será responsable de:

- Base de datos PostgreSQL.
- Autenticación.
- Gestión de usuarios.
- Control de permisos mediante Row Level Security (RLS).
- Funciones SQL o RPC cuando sean necesarias.

Se evitará desarrollar un backend tradicional con una API propia siempre que las capacidades de Supabase sean suficientes.

---

# Base de datos

Toda la información persistente se almacenará en PostgreSQL gestionado por Supabase.

El modelo de datos deberá mantenerse sencillo y normalizado.

La aplicación tendrá una única fuente de verdad: la base de datos.

Las estadísticas y clasificaciones se calcularán a partir de los datos almacenados, evitando duplicar información derivada siempre que sea posible.

**Estado actual:** la base de datos de producción **ya contiene usuarios reales** y actividad de la liga. Cualquier SQL o migración debe ser incremental y no destructiva. Ver [`docs/BASE_DE_DATOS.md`](docs/BASE_DE_DATOS.md).

---

# Autenticación

Toda la autenticación se delegará en Supabase Auth.

Se usará el proveedor de email/contraseña propio de Supabase Auth (sin OAuth de terceros).

Supabase gestionará completamente:

- Inicio de sesión.
- Cierre de sesión.
- Persistencia de sesión.
- Renovación de tokens.
- Recuperación de cuenta cuando corresponda.

---

# Usuarios

La primera vez que un usuario inicia sesión:

- Se crea automáticamente un perfil de jugador.
- Se vincula al identificador único proporcionado por Supabase Auth.
- Se asigna el rol de **Jugador**.

El perfil podrá editarse posteriormente.

---

# Roles

La aplicación tendrá únicamente dos roles.

## Jugador

Puede:

- Consultar toda la información pública de la liga.
- Editar su propia disponibilidad.
- Registrar resultados de sus partidas.

## Administrador

Además de las capacidades anteriores, puede:

- Editar cualquier partida.
- Eliminar partidas.
- Gestionar jugadores.
- Modificar roles.
- Crear o cerrar temporadas.
- Gestionar la configuración general de la liga.

---

# Modelo de datos

## users

Información propia del jugador.

Campos sugeridos:

- id
- auth_user_id
- nombre
- avatar_url
- rol
- created_at

---

## seasons

Temporadas de la liga.

Campos sugeridos:

- id
- nombre
- activa
- fecha_inicio
- fecha_fin

---

## matches

Partidas disputadas.

Campos sugeridos:

- id
- season_id
- jugador_a
- jugador_b
- resultado
- fecha
- created_by
- created_at

El resultado podrá almacenarse como:

- victoria_jugador_a
- victoria_jugador_b
- empate

---

## availability

Disponibilidad semanal.

Cada registro representa una franja horaria concreta.

Campos sugeridos:

- id
- jugador_id
- fecha
- franja
- disponible

La franja tendrá únicamente tres posibles valores:

- mañana
- tarde
- noche

---

# Clasificación

La clasificación no se almacenará como una tabla independiente.

Se calculará dinámicamente a partir de las partidas registradas.

Para cada jugador se obtendrán:

- Partidas jugadas.
- Victorias.
- Empates.
- Derrotas.
- Puntos de liga.

El cálculo seguirá las reglas definidas por la liga:

- Victoria = 2 puntos.
- Empate = 1 punto.
- Derrota = 0 puntos.

---

# Hándicap

El backend deberá proporcionar el bonus de PV correspondiente para cualquier enfrentamiento.

El cálculo será:

- Diferencia de puntos de liga.
- 1 PV por cada 4 puntos completos de diferencia.

Ejemplo:

- Diferencia de 3 → +0 PV
- Diferencia de 4 → +1 PV
- Diferencia de 9 → +2 PV

El cálculo deberá realizarse siempre utilizando la clasificación existente antes del comienzo de la partida.

---

# Emparejamientos

El backend genera partidos programados (`scheduled_matches`) a partir de la disponibilidad y el historial de la liga.

## Calendario

Todas las horas son **peninsulares** (`Europe/Madrid`):

| Momento | Acción |
|---------|--------|
| Viernes 20:00 | Emparejamiento principal de la semana siguiente |
| Sábado 23:00 | Repaso: solo jugadores sin partido asignado |
| Domingo 23:00 | Último repaso, mismas reglas |

Los jugadores deben indicar disponibilidad **antes del viernes** para la semana que empieza el lunes siguiente.

## Ejecución automática

No se usa cron externo ni tareas en el panel de Railway. La app desplegada ejecuta `maybeRunWeeklySchedules` (`src/lib/league/schedule-runner.ts`):

- Al arrancar el servidor (reloj cada 15 minutos).
- Al cargar el tablón principal.

Documentación detallada: [`docs/EMPAREJAMIENTOS.md`](docs/EMPAREJAMIENTOS.md).

## Algoritmo

Para cada semana, entre jugadores **sin partido ya asignado** y con disponibilidad compatible, el sistema prioriza:

- Rivales no enfrentados previamente.
- Jugadores con menor número de partidas.
- Evitar repetir el último rival.
- Maximizar coincidencias de franja horaria.

Implementación: `src/lib/league/weekly-schedule.ts` (emparejamiento máximo ponderado) y `src/lib/league/matching.ts` (pesos).

## Reemparejamiento puntual

- Al **cancelar** un partido programado se intenta reemparejar a los jugadores liberados en esa misma semana.
- **No** se recalcula al guardar disponibilidad (evita abuso y carga innecesaria).

## Permisos

La inserción de emparejamientos usa el cliente **service role** en servidor (`SUPABASE_SERVICE_ROLE_KEY`). Los jugadores solo leen sus partidos programados; no insertan emparejamientos directamente.

---

# Seguridad

Se utilizará Row Level Security (RLS) en todas las tablas.

Las políticas deberán garantizar que:

- Cualquier usuario autenticado pueda consultar la información pública.
- Un jugador únicamente pueda modificar su propia disponibilidad.
- Un jugador únicamente pueda registrar partidas en las que participe.
- Solo los administradores puedan modificar resultados ya existentes.
- Solo los administradores puedan gestionar jugadores, temporadas y configuración.

La aplicación nunca deberá confiar únicamente en validaciones realizadas en el cliente.

---

# Validaciones

El backend deberá impedir:

- Que un jugador juegue contra sí mismo.
- Registrar resultados inválidos.
- Registrar dos veces la misma partida por error.
- Registrar partidas con jugadores inexistentes.
- Registrar partidas fuera de la temporada activa.

---

# Funciones recomendadas

El backend debería disponer de funciones claramente separadas para:

- Obtener clasificación.
- Obtener historial de un jugador.
- Obtener disponibilidad de un jugador.
- Registrar una partida.
- Calcular bonus de PV entre dos jugadores.
- Generar emparejamientos recomendados.

Cada función deberá tener una única responsabilidad.

---

# Filosofía de implementación

El backend debe mantenerse pequeño, comprensible y fácil de mantener.

Se priorizará:

- Aprovechar al máximo las funcionalidades nativas de Supabase.
- Reducir el número de componentes propios.
- Mantener un modelo de datos simple.
- Evitar lógica duplicada.
- Mantener la lógica de negocio centralizada.

El objetivo es disponer de una infraestructura fiable, con el menor mantenimiento posible y fácilmente ampliable si la liga crece en el futuro.