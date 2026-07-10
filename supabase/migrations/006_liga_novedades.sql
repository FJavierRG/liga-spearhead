-- Novedades públicas de la liga (p. ej. partidas finalizadas)

CREATE TABLE liga_novedades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE SET NULL,
  mensaje TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_liga_novedades_season_created
  ON liga_novedades (season_id, created_at DESC);

ALTER TABLE liga_novedades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública de novedades de liga"
  ON liga_novedades FOR SELECT TO authenticated USING (true);
