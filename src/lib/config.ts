/** Máximo de tarjetas en Novedades (liga + personales, mezcladas). */
export const NOVEDADES_FEED_LIMIT = 6;

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

/** URL de la app en producción (Supabase). Solo para la demo en GitHub Pages. */
export function getProductionSiteUrl(): string {
  return process.env.NEXT_PUBLIC_PRODUCTION_URL?.trim() ?? "";
}

export function getBasePath(): string {
  return process.env.NEXT_PUBLIC_BASE_PATH ?? "";
}

/** Ruta a un archivo en /public (respeta basePath en GitHub Pages). */
export function assetPath(path: string): string {
  const base = getBasePath().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
