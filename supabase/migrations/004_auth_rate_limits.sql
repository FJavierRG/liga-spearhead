-- Eventos temporales para limitar abuso de auth por IP (solo accesible vía service_role)

CREATE TABLE auth_rate_limit_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ip_hash TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('signup', 'login', 'nombre-disponible')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX auth_rate_limit_events_lookup_idx
  ON auth_rate_limit_events (action, ip_hash, created_at DESC);

ALTER TABLE auth_rate_limit_events ENABLE ROW LEVEL SECURITY;
