export const PLAYER_NAME_MAX_LENGTH = 8;

/** Letras (incl. acentos), números, guión y guion bajo. */
const PLAYER_NAME_PATTERN = /^[\p{L}\p{N}_-]+$/u;

export type PlayerNameValidation =
  | { ok: true; value: string }
  | { ok: false; error: string };

export function sanitizePlayerName(raw: string): string {
  return raw
    .trim()
    .replace(/[^\p{L}\p{N}_-]/gu, "")
    .slice(0, PLAYER_NAME_MAX_LENGTH);
}

export function validatePlayerName(raw: unknown): PlayerNameValidation {
  if (typeof raw !== "string") {
    return { ok: false, error: "Nombre no válido." };
  }

  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Introduce tu nombre." };
  }
  if (trimmed.length > PLAYER_NAME_MAX_LENGTH) {
    return {
      ok: false,
      error: `Máximo ${PLAYER_NAME_MAX_LENGTH} caracteres.`,
    };
  }
  if (!PLAYER_NAME_PATTERN.test(trimmed)) {
    return {
      ok: false,
      error: "Solo letras, números, guiones y guiones bajos.",
    };
  }

  return { ok: true, value: trimmed };
}
