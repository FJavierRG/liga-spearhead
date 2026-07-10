import { getProductionSiteUrl, isStaticDemo } from "@/lib/config";

export function StaticDemoBanner() {
  if (!isStaticDemo()) return null;

  const productionUrl = getProductionSiteUrl();

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex min-h-9 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 border-b border-orange-700/50 bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm"
    >
      <span>Web demo.</span>
      {productionUrl ? (
        <>
          <span className="hidden font-normal sm:inline">
            La versión original está en:
          </span>
          <span className="font-normal sm:hidden">Original:</span>
          <a
            href={productionUrl}
            className="font-semibold underline underline-offset-2 hover:text-orange-100"
            target="_blank"
            rel="noopener noreferrer"
          >
            {productionUrl.replace(/^https?:\/\//, "")}
          </a>
        </>
      ) : (
        <span className="font-normal">
          Esta es solo una versión de demostración sin datos reales.
        </span>
      )}
    </div>
  );
}
