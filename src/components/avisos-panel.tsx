"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import type { PlayerAviso } from "@/types/database";
import { SectionTitle } from "@/components/ui/section-title";
import { cn } from "@/lib/utils";

interface AvisosPanelProps {
  avisos: PlayerAviso[];
}

const TIPO_CONFIG = {
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

export function AvisosPanel({ avisos }: AvisosPanelProps) {
  return (
    <div className="space-y-2">
      <SectionTitle>Avisos</SectionTitle>
      <div className="fantasy-panel fantasy-panel-torn">
        {avisos.length === 0 ? (
          <p className="px-4 py-5 text-center text-sm text-[var(--muted)]">
            Sin avisos recientes.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--border)]/40">
            {avisos.map((aviso) => {
              const cfg = TIPO_CONFIG[aviso.tipo];
              const timeAgo = formatDistanceToNow(new Date(aviso.created_at), {
                addSuffix: true,
                locale: es,
              });
              return (
                <li key={aviso.id} className="flex gap-3 px-4 py-3">
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
                      {aviso.mensaje}
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
