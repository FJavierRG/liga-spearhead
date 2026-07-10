"use client";

import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  History,
  ScrollText,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type LigaSection = "tablon" | "historial" | "reglas";

const SECTIONS: {
  id: LigaSection;
  label: string;
  shortLabel: string;
  icon: typeof ScrollText;
}[] = [
  { id: "tablon", label: "Tablón", shortLabel: "Tablón", icon: ScrollText },
  { id: "historial", label: "Historial", shortLabel: "Historial", icon: History },
  {
    id: "reglas",
    label: "Reglas del formato",
    shortLabel: "Reglas",
    icon: BookOpen,
  },
];

interface SidebarNavProps {
  active: LigaSection;
  onSelect: (section: LigaSection) => void;
  open: boolean;
  onToggle: () => void;
  reglasPendientes?: boolean;
}

function SectionButton({
  id,
  label,
  icon: Icon,
  isActive,
  showReglasAlert,
  onSelect,
  compact = false,
  showLabel = true,
}: {
  id: LigaSection;
  label: string;
  icon: typeof ScrollText;
  isActive: boolean;
  showReglasAlert: boolean;
  onSelect: (section: LigaSection) => void;
  compact?: boolean;
  showLabel?: boolean;
}) {
  return (
    <button
      type="button"
      title={!showLabel ? label : undefined}
      onClick={() => onSelect(id)}
      className={cn(
        "flex items-center gap-3 text-left text-sm transition-colors",
        compact
          ? "flex-1 flex-col gap-0.5 rounded-none px-1.5 py-2 text-center"
          : "w-full rounded-md px-3 py-2.5",
        isActive
          ? compact
            ? "border-b-2 border-[var(--accent)] bg-[color-mix(in_srgb,var(--accent)_12%,transparent)] text-[var(--accent-hover)]"
            : "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-hover)]"
          : compact
            ? "border-b-2 border-transparent text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
            : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
        compact && !showLabel && "justify-center px-0",
        !compact && !showLabel && "justify-center px-0"
      )}
    >
      <span className="relative shrink-0">
        <Icon
          className={cn("h-4 w-4", compact && "h-3.5 w-3.5")}
          aria-hidden
        />
        {showReglasAlert && (
          <span
            className={cn(
              "absolute -right-1 -top-1 rounded-full bg-red-500 ring-2 ring-[color-mix(in_srgb,var(--background)_94%,#000)]",
              compact ? "h-1.5 w-1.5" : "h-2 w-2"
            )}
            aria-hidden
          />
        )}
      </span>
      {showLabel && (
        <span
          className={cn(
            "font-display min-w-0 tracking-wide",
            compact ? "text-[10px] leading-tight" : "flex-1 truncate"
          )}
        >
          {label}
        </span>
      )}
      {showReglasAlert && showLabel && !compact && (
        <CircleAlert
          className="h-4 w-4 shrink-0 fill-red-500/15 text-red-500"
          aria-label="Pendiente de leer"
        />
      )}
    </button>
  );
}

export function SidebarNav({
  active,
  onSelect,
  open,
  onToggle,
  reglasPendientes = false,
}: SidebarNavProps) {
  return (
    <>
      <nav
        aria-label="Secciones de la liga"
        className="sticky top-[calc(3.5rem+var(--demo-banner-height,0px))] z-30 flex border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_94%,#000)] lg:hidden"
      >
        {SECTIONS.map(({ id, shortLabel, icon }) => (
          <SectionButton
            key={id}
            id={id}
            label={shortLabel}
            icon={icon}
            isActive={active === id}
            showReglasAlert={id === "reglas" && reglasPendientes}
            onSelect={onSelect}
            compact
          />
        ))}
      </nav>

      <div className="fixed left-0 top-14 z-40 hidden h-[calc(100vh-3.5rem)] lg:block">
        <aside
          className={cn(
            "flex h-full flex-col overflow-hidden border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_94%,#000)] transition-[width] duration-200 ease-out",
            open ? "w-56" : "w-14"
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 p-2 pt-3 min-w-14">
            {SECTIONS.map(({ id, label, icon }) => (
              <SectionButton
                key={id}
                id={id}
                label={label}
                icon={icon}
                isActive={active === id}
                showReglasAlert={id === "reglas" && reglasPendientes}
                onSelect={onSelect}
                showLabel={open}
                compact={false}
              />
            ))}
          </nav>
        </aside>

        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Ocultar menú" : "Mostrar menú"}
          aria-expanded={open}
          className={cn(
            "absolute top-1/2 z-50 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-md transition-[left] duration-200 ease-out hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
            open ? "left-56" : "left-14"
          )}
        >
          {open ? (
            <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>
      </div>
    </>
  );
}
