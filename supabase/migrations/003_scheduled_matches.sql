-- Partidos programados semanales y vínculo con partidas jugadas

CREATE TYPE scheduled_match_status AS ENUM ('programado', 'cancelado', 'jugado');

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

CREATE INDEX idx_scheduled_week ON scheduled_matches(season_id, week_start, status);

CREATE UNIQUE INDEX scheduled_unique_active_pair_week
  ON scheduled_matches (
    season_id,
    week_start,
    LEAST(jugador_a, jugador_b),
    GREATEST(jugador_a, jugador_b)
  )
  WHERE status = 'programado';

ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS scheduled_match_id UUID REFERENCES scheduled_matches(id);

CREATE INDEX idx_matches_scheduled ON matches(scheduled_match_id);

-- Jugador implicado puede corregir el resultado de su partida
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

ALTER TABLE scheduled_matches ENABLE ROW LEVEL SECURITY;

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

-- Finalizar partido programado: crea match y marca scheduled como jugado
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

GRANT EXECUTE ON FUNCTION complete_scheduled_match(UUID, match_result) TO authenticated;
