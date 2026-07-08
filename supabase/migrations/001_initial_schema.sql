-- Liga Spearhead — esquema inicial

CREATE TYPE user_role AS ENUM ('jugador', 'administrador');
CREATE TYPE match_result AS ENUM ('victoria_jugador_a', 'victoria_jugador_b', 'empate');
CREATE TYPE time_slot AS ENUM ('manana', 'tarde', 'noche');

-- Perfiles de jugador (vinculados a auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  faccion TEXT,
  rol user_role NOT NULL DEFAULT 'jugador',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  activa BOOLEAN NOT NULL DEFAULT false,
  fecha_inicio DATE,
  fecha_fin DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  jugador_a UUID NOT NULL REFERENCES users(id),
  jugador_b UUID NOT NULL REFERENCES users(id),
  resultado match_result NOT NULL,
  fecha DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT different_players CHECK (jugador_a <> jugador_b)
);

CREATE UNIQUE INDEX matches_unique_pair_per_day
  ON matches (
    season_id,
    LEAST(jugador_a, jugador_b),
    GREATEST(jugador_a, jugador_b),
    fecha
  );

CREATE TABLE availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  franja time_slot NOT NULL,
  disponible BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (jugador_id, fecha, franja)
);

CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_availability_jugador_fecha ON availability(jugador_id, fecha);

-- Perfil automático al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, nombre, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Clasificación dinámica
CREATE OR REPLACE FUNCTION get_standings(p_season_id UUID)
RETURNS TABLE (
  jugador_id UUID,
  nombre TEXT,
  avatar_url TEXT,
  faccion TEXT,
  partidas BIGINT,
  victorias BIGINT,
  empates BIGINT,
  derrotas BIGINT,
  puntos BIGINT
)
LANGUAGE sql
STABLE
AS $$
  WITH stats AS (
    SELECT
      u.id AS jugador_id,
      u.nombre,
      u.avatar_url,
      u.faccion,
      COUNT(m.id) AS partidas,
      COUNT(m.id) FILTER (
        WHERE (m.jugador_a = u.id AND m.resultado = 'victoria_jugador_a')
           OR (m.jugador_b = u.id AND m.resultado = 'victoria_jugador_b')
      ) AS victorias,
      COUNT(m.id) FILTER (WHERE m.resultado = 'empate') AS empates,
      COUNT(m.id) FILTER (
        WHERE (m.jugador_a = u.id AND m.resultado = 'victoria_jugador_b')
           OR (m.jugador_b = u.id AND m.resultado = 'victoria_jugador_a')
      ) AS derrotas
    FROM users u
    LEFT JOIN matches m ON m.season_id = p_season_id
      AND (m.jugador_a = u.id OR m.jugador_b = u.id)
    GROUP BY u.id, u.nombre, u.avatar_url, u.faccion
  )
  SELECT
    jugador_id,
    nombre,
    avatar_url,
    faccion,
    partidas,
    victorias,
    empates,
    derrotas,
    (victorias * 2 + empates) AS puntos
  FROM stats
  ORDER BY puntos DESC, victorias DESC, partidas ASC, nombre ASC;
$$;

-- Bonus de PV entre dos jugadores
CREATE OR REPLACE FUNCTION calculate_handicap(
  p_jugador_a UUID,
  p_jugador_b UUID,
  p_season_id UUID
)
RETURNS TABLE (
  bonus_pv INT,
  beneficiario UUID
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_puntos_a BIGINT;
  v_puntos_b BIGINT;
  v_diff INT;
BEGIN
  SELECT COALESCE(puntos, 0) INTO v_puntos_a
  FROM get_standings(p_season_id) WHERE jugador_id = p_jugador_a;

  SELECT COALESCE(puntos, 0) INTO v_puntos_b
  FROM get_standings(p_season_id) WHERE jugador_id = p_jugador_b;

  v_diff := ABS(v_puntos_a - v_puntos_b);
  bonus_pv := FLOOR(v_diff / 4.0)::INT;

  IF v_puntos_a <= v_puntos_b THEN
    beneficiario := p_jugador_a;
  ELSE
    beneficiario := p_jugador_b;
  END IF;

  RETURN NEXT;
END;
$$;

-- Helper: es administrador
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM users
    WHERE auth_user_id = auth.uid() AND rol = 'administrador'
  );
$$;

-- Helper: perfil del usuario autenticado
CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

-- Temporada activa
CREATE OR REPLACE FUNCTION get_active_season_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM seasons WHERE activa = true LIMIT 1;
$$;

-- RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;

-- users
CREATE POLICY "Lectura pública de jugadores"
  ON users FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jugador edita su perfil"
  ON users FOR UPDATE TO authenticated
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

CREATE POLICY "Admin gestiona jugadores"
  ON users FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- seasons
CREATE POLICY "Lectura pública de temporadas"
  ON seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona temporadas"
  ON seasons FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- matches
CREATE POLICY "Lectura pública de partidas"
  ON matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jugador registra partida en la que participa"
  ON matches FOR INSERT TO authenticated
  WITH CHECK (
    created_by = current_user_profile_id()
    AND (jugador_a = current_user_profile_id() OR jugador_b = current_user_profile_id())
    AND season_id = get_active_season_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = jugador_a)
    AND EXISTS (SELECT 1 FROM users WHERE id = jugador_b)
  );

CREATE POLICY "Admin edita partidas"
  ON matches FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin elimina partidas"
  ON matches FOR DELETE TO authenticated
  USING (is_admin());

-- availability
CREATE POLICY "Lectura pública de disponibilidad"
  ON availability FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jugador gestiona su disponibilidad"
  ON availability FOR ALL TO authenticated
  USING (jugador_id = current_user_profile_id())
  WITH CHECK (jugador_id = current_user_profile_id());

-- Temporada y admin inicial de ejemplo (ajustar en producción)
INSERT INTO seasons (nombre, activa, fecha_inicio)
VALUES ('Temporada 1', true, CURRENT_DATE);

GRANT EXECUTE ON FUNCTION get_standings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_handicap(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_season_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
