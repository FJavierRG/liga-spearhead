/** Activa el modo demo local (sin Supabase). */
export function isMockMode(): boolean {
  return (
    process.env.MOCK_MODE === "true" ||
    process.env.NEXT_PUBLIC_MOCK_MODE === "true"
  );
}

/** Demo estática para GitHub Pages (sin servidor Node). */
export function isStaticDemo(): boolean {
  return process.env.NEXT_PUBLIC_STATIC_DEMO === "true";
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}
