"use client";

import { useMemo } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { LigaNovedad, PlayerAviso } from "@/types/database";
import { SectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

interface AvisosPanelProps {
  avisos: PlayerAviso[];
  ligaNovedades: LigaNovedad[];
}

type FeedItem =
  | { kind: "liga"; item: LigaNovedad }
  | { kind: "personal"; item: PlayerAviso };

const PERSONAL_TIPO_CONFIG = {
  partido_cancelado: {
    icon: "✕",
    iconClass: "bg-red-900/40 text-red-400",
  },
  partido_finalizado: {
    icon: "✓",
    iconClass: "bg-emerald-900/40 text-emerald-400",
  },
  resultado_editado: {
    icon: "✎",
    iconClass: "bg-amber-900/40 text-amber-400",
  },
} satisfies Record<PlayerAviso["tipo"], { icon: string; iconClass: string }>;

const LIGA_CONFIG = {
  icon: "⚔",
  iconClass: "bg-[color-mix(in_srgb,var(--accent)_25%,#000)] text-[var(--accent)]",
};

export function AvisosPanel({ avisos, ligaNovedades }: AvisosPanelProps) {
  const feed = useMemo(() => {
    const items: FeedItem[] = [
      ...ligaNovedades.map((item) => ({ kind: "liga" as const, item })),
      ...avisos.map((item) => ({ kind: "personal" as const, item })),
    ];

    return items.sort(
      (a, b) =>
        new Date(
          b.kind === "liga" ? b.item.created_at : b.item.created_at
        ).getTime() -
        new Date(
          a.kind === "liga" ? a.item.created_at : a.item.created_at
        ).getTime()
    );
  }, [avisos, ligaNovedades]);

  return (
    <div className="space-y-2">
      <SectionTitle>Novedades</SectionTitle>
      <div className="fantasy-panel fantasy-panel-torn">
        {feed.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-[var(--muted)]">
            Sin novedades recientes.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/40">
            {feed.map((entry) => {
              const timeAgo = formatDistanceToNow(
                new Date(
                  entry.kind === "liga"
                    ? entry.item.created_at
                    : entry.item.created_at
                ),
                {
                  addSuffix: true,
                  locale: es,
                }
              );

              if (entry.kind === "liga") {
                return (
                  <li key={`liga-${entry.item.id}`} className="flex gap-3 px-4 py-3">
                    <span
                      className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        LIGA_CONFIG.iconClass
                      )}
                    >
                      {LIGA_CONFIG.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm leading-snug text-[var(--foreground)]">
                        {entry.item.mensaje}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--muted)]">{timeAgo}</p>
                    </div>
                  </li>
                );
              }

              const cfg = PERSONAL_TIPO_CONFIG[entry.item.tipo];
              return (
                <li
                  key={`personal-${entry.item.id}`}
                  className="flex gap-3 px-4 py-3"
                >
                  <span
                    className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                      cfg.iconClass
                    )}
                  >
                    {cfg.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm leading-snug text-[var(--foreground)]">
                      {entry.item.mensaje}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--muted)]">{timeAgo}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
