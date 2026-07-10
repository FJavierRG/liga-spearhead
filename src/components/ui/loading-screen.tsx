"use client";

import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/config";

interface LoadingScreenProps {
  className?: string;
  overlay?: boolean;
  /** Ocupa el área de contenido bajo la barra de navegación. */
  fill?: boolean;
}

export function LoadingScreen({
  className,
  overlay = false,
  fill = false,
}: LoadingScreenProps) {
  const content = (
    <div className="flex flex-col items-center gap-4">
      <img
        src={assetPath("/assets/dice-game.gif")}
        alt=""
        aria-hidden="true"
        className="h-16 w-16 object-contain sm:h-20 sm:w-20"
        decoding="async"
      />
      <div
        className="w-48 sm:w-56"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-2.5 overflow-hidden rounded-full border border-[var(--border-light)] p-px">
          <div className="loading-bar-fill h-full rounded-full bg-[var(--accent-dim)]" />
        </div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center bg-[color-mix(in_srgb,var(--background)_92%,transparent)] backdrop-blur-sm",
          className
        )}
        aria-busy="true"
        aria-label="Cargando"
      >
        {content}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-4",
        fill
          ? "min-h-[calc(100dvh-3.5rem-var(--demo-banner-height,0px))]"
          : "min-h-screen",
        className
      )}
      aria-busy="true"
      aria-label="Cargando"
    >
      {content}
    </div>
  );
}
