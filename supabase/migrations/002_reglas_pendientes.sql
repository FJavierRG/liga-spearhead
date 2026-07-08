-- Marca jugadores que aún no han leído las reglas del formato
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reglas_pendientes BOOLEAN NOT NULL DEFAULT false;

-- Nuevos registros deben ver el aviso hasta que entren en Reglas
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
