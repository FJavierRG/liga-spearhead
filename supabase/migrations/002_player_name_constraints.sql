-- Validación de nombre de jugador (máx. 8 caracteres, sin caracteres peligrosos)

CREATE OR REPLACE FUNCTION sanitize_player_name(raw TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned TEXT;
BEGIN
  cleaned := regexp_replace(trim(COALESCE(raw, '')), '[^[:alnum:]_-]', '', 'g');
  IF length(cleaned) = 0 THEN
    cleaned := 'jugador';
  END IF;
  RETURN left(cleaned, 8);
END;
$$;

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
    sanitize_player_name(
      COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
      )
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    true
  );
  RETURN NEW;
END;
$$;

ALTER TABLE users
  ADD CONSTRAINT users_nombre_length CHECK (char_length(nombre) <= 8),
  ADD CONSTRAINT users_nombre_format CHECK (nombre ~ '^[[:alnum:]_-]+$');
