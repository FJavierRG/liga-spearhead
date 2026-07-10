-- Liga Spearhead — esquema inicial

CREATE TYPE user_role AS ENUM ('jugador', 'administrador');
CREATE TYPE match_result AS ENUM ('victoria_jugador_a', 'victoria_jugador_b', 'empate');
CREATE TYPE time_slot AS ENUM ('manana', 'tarde', 'noche');
CREATE TYPE scheduled_match_status AS ENUM ('programado', 'cancelado', 'jugado');
CREATE TYPE aviso_type AS ENUM (
  'partido_cancelado',
  'partido_finalizado',
  'resultado_editado'
);

-- Perfiles de jugador (vinculados a auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  avatar_url TEXT,
  faccion TEXT,
  rol user_role NOT NULL DEFAULT 'jugador',
  reglas_pendientes BOOLEAN NOT NULL DEFAULT false,
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

CREATE TABLE scheduled_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  jugador_a UUID NOT NULL REFERENCES users(id),
  jugador_b UUID NOT NULL REFERENCES users(id),
  fecha DATE NOT NULL,
  franja time_slot NOT NULL,
  week_start DATE NOT NULL,
  status scheduled_match_status NOT NULL DEFAULT 'programado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT scheduled_different_players CHECK (jugador_a <> jugador_b)
);

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  jugador_a UUID NOT NULL REFERENCES users(id),
  jugador_b UUID NOT NULL REFERENCES users(id),
  resultado match_result NOT NULL,
  fecha DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id),
  scheduled_match_id UUID REFERENCES scheduled_matches(id),
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

CREATE TABLE player_avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jugador_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo aviso_type NOT NULL,
  mensaje TEXT NOT NULL,
  actor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  scheduled_match_id UUID REFERENCES scheduled_matches(id) ON DELETE SET NULL,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_matches_season ON matches(season_id);
CREATE INDEX idx_matches_scheduled ON matches(scheduled_match_id);
CREATE INDEX idx_availability_jugador_fecha ON availability(jugador_id, fecha);
CREATE INDEX idx_scheduled_week ON scheduled_matches(season_id, week_start, status);
CREATE INDEX idx_player_avisos_jugador ON player_avisos(jugador_id, created_at DESC);

CREATE UNIQUE INDEX scheduled_unique_active_pair_week
  ON scheduled_matches (
    season_id,
    week_start,
    LEAST(jugador_a, jugador_b),
    GREATEST(jugador_a, jugador_b)
  )
  WHERE status = 'programado';

-- Perfil automático al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, nombre, avatar_url, reglas_pendientes)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION compute_match_points_delta(
  p_resultado match_result,
  p_player_id UUID,
  p_jugador_a UUID,
  p_jugador_b UUID,
  p_points_before_a BIGINT,
  p_points_before_b BIGINT
)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base INT;
  v_bonus INT;
  v_winner_points BIGINT;
  v_loser_points BIGINT;
BEGIN
  IF p_resultado = 'empate' THEN
    RETURN 1;
  END IF;

  IF p_resultado = 'victoria_jugador_a' AND p_player_id = p_jugador_a THEN
    v_base := 2;
    v_winner_points := p_points_before_a;
    v_loser_points := p_points_before_b;
  ELSIF p_resultado = 'victoria_jugador_b' AND p_player_id = p_jugador_b THEN
    v_base := 2;
    v_winner_points := p_points_before_b;
    v_loser_points := p_points_before_a;
  ELSE
    RETURN 0;
  END IF;

  IF v_winner_points >= v_loser_points THEN
    v_bonus := 0;
  ELSE
    v_bonus := FLOOR((v_loser_points - v_winner_points) / 4.0)::INT;
  END IF;

  RETURN v_base + v_bonus;
END;
$$;

CREATE OR REPLACE FUNCTION compute_season_points(p_season_id UUID)
RETURNS TABLE (jugador_id UUID, puntos BIGINT)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_match RECORD;
  v_totals JSONB := '{}'::JSONB;
  v_points_before_a BIGINT;
  v_points_before_b BIGINT;
  v_delta_a INT;
  v_delta_b INT;
BEGIN
  FOR v_match IN
    SELECT id, jugador_a, jugador_b, resultado, fecha, created_at
    FROM matches
    WHERE season_id = p_season_id
    ORDER BY fecha, created_at, id
  LOOP
    v_points_before_a := COALESCE((v_totals ->> v_match.jugador_a::TEXT)::BIGINT, 0);
    v_points_before_b := COALESCE((v_totals ->> v_match.jugador_b::TEXT)::BIGINT, 0);

    v_delta_a := compute_match_points_delta(
      v_match.resultado,
      v_match.jugador_a,
      v_match.jugador_a,
      v_match.jugador_b,
      v_points_before_a,
      v_points_before_b
    );
    v_delta_b := compute_match_points_delta(
      v_match.resultado,
      v_match.jugador_b,
      v_match.jugador_a,
      v_match.jugador_b,
      v_points_before_a,
      v_points_before_b
    );

    v_totals := jsonb_set(
      v_totals,
      ARRAY[v_match.jugador_a::TEXT],
      to_jsonb(v_points_before_a + v_delta_a),
      true
    );
    v_totals := jsonb_set(
      v_totals,
      ARRAY[v_match.jugador_b::TEXT],
      to_jsonb(v_points_before_b + v_delta_b),
      true
    );
  END LOOP;

  RETURN QUERY
  SELECT t.key::UUID, t.value::BIGINT
  FROM jsonb_each_text(v_totals) AS t(key, value);
END;
$$;

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
    s.jugador_id,
    s.nombre,
    s.avatar_url,
    s.faccion,
    s.partidas,
    s.victorias,
    s.empates,
    s.derrotas,
    COALESCE(p.puntos, 0) AS puntos
  FROM stats s
  LEFT JOIN compute_season_points(p_season_id) p ON p.jugador_id = s.jugador_id
  ORDER BY puntos DESC, victorias DESC, partidas ASC, nombre ASC;
$$;

CREATE OR REPLACE FUNCTION calculate_handicap(
  p_jugador_a UUID,
  p_jugador_b UUID,
  p_season_id UUID
)
RETURNS TABLE (
  bonus_pl INT,
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
  bonus_pl := FLOOR(v_diff / 4.0)::INT;

  IF v_puntos_a <= v_puntos_b THEN
    beneficiario := p_jugador_a;
  ELSE
    beneficiario := p_jugador_b;
  END IF;

  RETURN NEXT;
END;
$$;

CREATE OR REPLACE FUNCTION complete_scheduled_match(
  p_scheduled_id UUID,
  p_resultado match_result
)
RETURNS matches
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sched scheduled_matches;
  v_profile UUID;
  v_match matches;
BEGIN
  v_profile := current_user_profile_id();
  IF v_profile IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT * INTO v_sched FROM scheduled_matches WHERE id = p_scheduled_id FOR UPDATE;

  IF NOT FOUND OR v_sched.status <> 'programado' THEN
    RAISE EXCEPTION 'Partido no disponible';
  END IF;

  IF v_sched.jugador_a <> v_profile AND v_sched.jugador_b <> v_profile THEN
    RAISE EXCEPTION 'No autorizado';
  END IF;

  INSERT INTO matches (
    season_id,
    jugador_a,
    jugador_b,
    resultado,
    fecha,
    created_by,
    scheduled_match_id
  )
  VALUES (
    v_sched.season_id,
    v_sched.jugador_a,
    v_sched.jugador_b,
    p_resultado,
    v_sched.fecha,
    v_profile,
    p_scheduled_id
  )
  RETURNING * INTO v_match;

  UPDATE scheduled_matches
  SET status = 'jugado'
  WHERE id = p_scheduled_id;

  RETURN v_match;
END;
$$;

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

CREATE OR REPLACE FUNCTION current_user_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION get_active_season_id()
RETURNS UUID
LANGUAGE sql
STABLE
AS $$
  SELECT id FROM seasons WHERE activa = true LIMIT 1;
$$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_avisos ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Lectura pública de temporadas"
  ON seasons FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin gestiona temporadas"
  ON seasons FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

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

CREATE POLICY "Jugador edita partida en la que participa"
  ON matches FOR UPDATE TO authenticated
  USING (
    jugador_a = current_user_profile_id()
    OR jugador_b = current_user_profile_id()
  )
  WITH CHECK (
    jugador_a = current_user_profile_id()
    OR jugador_b = current_user_profile_id()
  );

CREATE POLICY "Admin edita partidas"
  ON matches FOR UPDATE TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admin elimina partidas"
  ON matches FOR DELETE TO authenticated
  USING (is_admin());

CREATE POLICY "Lectura pública de disponibilidad"
  ON availability FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jugador gestiona su disponibilidad"
  ON availability FOR ALL TO authenticated
  USING (jugador_id = current_user_profile_id())
  WITH CHECK (jugador_id = current_user_profile_id());

CREATE POLICY "Lectura de emparejamientos programados"
  ON scheduled_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Jugador gestiona su emparejamiento programado"
  ON scheduled_matches FOR UPDATE TO authenticated
  USING (
    status = 'programado'
    AND (
      jugador_a = current_user_profile_id()
      OR jugador_b = current_user_profile_id()
    )
  )
  WITH CHECK (
    jugador_a = current_user_profile_id()
    OR jugador_b = current_user_profile_id()
  );

CREATE POLICY "Jugador lee sus avisos"
  ON player_avisos FOR SELECT TO authenticated
  USING (jugador_id = current_user_profile_id());

INSERT INTO seasons (nombre, activa, fecha_inicio)
VALUES ('Temporada 1', true, CURRENT_DATE);

GRANT EXECUTE ON FUNCTION get_standings(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_handicap(UUID, UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_match_points_delta(match_result, UUID, UUID, UUID, BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_season_points(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION complete_scheduled_match(UUID, match_result) TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_season_id() TO authenticated;
GRANT EXECUTE ON FUNCTION current_user_profile_id() TO authenticated;
GRANT EXECUTE ON FUNCTION is_admin() TO authenticated;
