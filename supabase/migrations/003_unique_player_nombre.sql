-- Nick de jugador único (sin distinguir mayúsculas/minúsculas)

CREATE UNIQUE INDEX users_nombre_unique_ci ON users (lower(nombre));
