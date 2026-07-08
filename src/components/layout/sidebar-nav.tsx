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
  icon: typeof ScrollText;
}[] = [
  { id: "tablon", label: "Tablón", icon: ScrollText },
  { id: "historial", label: "Historial", icon: History },
  { id: "reglas", label: "Reglas del formato", icon: BookOpen },
];

interface SidebarNavProps {
  active: LigaSection;
  onSelect: (section: LigaSection) => void;
  open: boolean;
  onToggle: () => void;
  reglasPendientes?: boolean;
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
      {open && (
        <button
          type="button"
          aria-label="Cerrar menú"
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      <div className="fixed left-0 top-14 z-40 h-[calc(100vh-3.5rem)]">
        <aside
          className={cn(
            "flex h-full flex-col overflow-hidden border-r border-[var(--border)] bg-[color-mix(in_srgb,var(--background)_94%,#000)] transition-[width] duration-200 ease-out",
            open ? "w-56" : "w-0 lg:w-14"
          )}
        >
          <nav className="flex flex-1 flex-col gap-1 p-2 pt-3 lg:min-w-14">
            {SECTIONS.map(({ id, label, icon: Icon }) => {
              const isActive = active === id;
              const showReglasAlert = id === "reglas" && reglasPendientes;
              return (
                <button
                  key={id}
                  type="button"
                  title={!open ? label : undefined}
                  onClick={() => onSelect(id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                    isActive
                      ? "bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-hover)]"
                      : "text-[var(--muted)] hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
                    !open && "lg:justify-center lg:px-0",
                    !open && "max-lg:hidden"
                  )}
                >
                  <span className="relative shrink-0">
                    <Icon className="h-4 w-4" aria-hidden />
                    {showReglasAlert && (
                      <span
                        className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[color-mix(in_srgb,var(--background)_94%,#000)]"
                        aria-hidden
                      />
                    )}
                  </span>
                  <span
                    className={cn(
                      "font-display min-w-0 flex-1 truncate tracking-wide",
                      !open && "lg:hidden"
                    )}
                  >
                    {label}
                  </span>
                  {showReglasAlert && (
                    <CircleAlert
                      className={cn(
                        "h-4 w-4 shrink-0 fill-red-500/15 text-red-500",
                        !open && "lg:hidden"
                      )}
                      aria-label="Pendiente de leer"
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <button
          type="button"
          onClick={onToggle}
          aria-label={open ? "Ocultar menú" : "Mostrar menú"}
          aria-expanded={open}
          className={cn(
            "absolute top-1/2 z-50 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-md transition-[left] duration-200 ease-out hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]",
            open ? "left-56" : "left-0 lg:left-14"
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
