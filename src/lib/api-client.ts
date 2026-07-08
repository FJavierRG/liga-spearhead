import { getBasePath, isStaticDemo } from "@/lib/config";
import { handleStaticDemoApi } from "@/lib/client-demo/handlers";

export function apiPath(path: string): string {
  const base = getBasePath().replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Ruta para Link/router (Next.js añade basePath automáticamente). */
export function appPath(path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!isStaticDemo() || normalized === "/") {
    return normalized;
  }
  return normalized.endsWith("/") ? normalized : `${normalized}/`;
}

export async function apiFetch(
  path: string,
  init?: RequestInit
): Promise<Response> {
  const fullPath = apiPath(path);

  if (isStaticDemo()) {
    const urlPath = path.startsWith("/") ? path : `/${path}`;
    return handleStaticDemoApi(urlPath, init);
  }

  return fetch(fullPath, init);
}

export function notifyDemoDataChanged(): void {
  if (typeof window !== "undefined" && isStaticDemo()) {
    window.dispatchEvent(new CustomEvent("liga-demo-update"));
  }
}
