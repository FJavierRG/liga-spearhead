-- Underdog: bonus PL al ganar (+1 PL por cada 4 PLs de diferencia), no bonus PV en partida.

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

-- Bonus PL potencial si gana el underdog (sustituye al antiguo bonus PV en partida).
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

GRANT EXECUTE ON FUNCTION compute_match_points_delta(match_result, UUID, UUID, UUID, BIGINT, BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION compute_season_points(UUID) TO authenticated;
