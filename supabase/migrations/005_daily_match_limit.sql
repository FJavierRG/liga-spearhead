-- Límite de partidas registradas manualmente por jugador y día (máx. 2)

CREATE OR REPLACE FUNCTION user_matches_created_today_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::INTEGER
  FROM matches
  WHERE created_by = p_user_id
    AND (created_at AT TIME ZONE 'Europe/Madrid')::date =
        (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Madrid')::date;
$$;

CREATE OR REPLACE FUNCTION can_current_user_create_match_today()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_admin()
    OR user_matches_created_today_count(current_user_profile_id()) < 2;
$$;

GRANT EXECUTE ON FUNCTION can_current_user_create_match_today() TO authenticated;

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

  IF NOT can_current_user_create_match_today() THEN
    RAISE EXCEPTION 'Has alcanzado el límite de 2 partidas registradas por día.';
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

DROP POLICY IF EXISTS "Jugador registra partida en la que participa" ON matches;

CREATE POLICY "Jugador registra partida en la que participa"
  ON matches FOR INSERT TO authenticated
  WITH CHECK (
    created_by = current_user_profile_id()
    AND (jugador_a = current_user_profile_id() OR jugador_b = current_user_profile_id())
    AND season_id = get_active_season_id()
    AND EXISTS (SELECT 1 FROM users WHERE id = jugador_a)
    AND EXISTS (SELECT 1 FROM users WHERE id = jugador_b)
    AND can_current_user_create_match_today()
  );

GRANT EXECUTE ON FUNCTION complete_scheduled_match(UUID, match_result) TO authenticated;
